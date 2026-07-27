import csv
import io
import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response as RawResponse
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.models import Question, Response
from app.routers.forms import get_form_or_404

router = APIRouter(prefix="/api", tags=["results"])

CHOICE_TYPES = ("multiple_choice", "dropdown", "yes_no")
TEXT_TYPES = ("short_text", "long_text", "email")
LATEST_SAMPLE_SIZE = 5


@router.get("/forms/{form_id}/responses", response_model=schemas.ResponseList)
def list_responses(form_id: int, db: Session = Depends(get_db)):
    form = get_form_or_404(form_id, db)
    responses = (
        db.query(Response)
        .filter(Response.form_id == form.id)
        .order_by(Response.submitted_at.desc(), Response.id.desc())
        .all()
    )
    return schemas.ResponseList(
        total=len(responses),
        items=[
            schemas.ResponseListItem(
                id=response.id,
                submitted_at=response.submitted_at,
                answers=[
                    schemas.AnswerOut(question_id=a.question_id, value=a.value)
                    for a in response.answers
                ],
            )
            for response in responses
        ],
    )


def _csv_safe(value: str) -> str:
    """Neutralize spreadsheet formula injection (=, +, -, @ prefixes)."""
    if value and value[0] in "=+-@":
        return "'" + value
    return value


@router.get("/forms/{form_id}/responses/export")
def export_responses_csv(form_id: int, db: Session = Depends(get_db)):
    form = get_form_or_404(form_id, db)
    responses = (
        db.query(Response)
        .filter(Response.form_id == form.id)
        .order_by(Response.submitted_at.asc(), Response.id.asc())
        .all()
    )
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\r\n")
    writer.writerow(
        ["Response ID", "Submitted At"]
        + [q.title or f"Question {q.position + 1}" for q in form.questions]
    )
    for response in responses:
        by_question = {a.question_id: a.value for a in response.answers}
        writer.writerow(
            [response.id, response.submitted_at.isoformat()]
            + [_csv_safe(by_question.get(q.id, "")) for q in form.questions]
        )

    slug = re.sub(r"[^a-z0-9]+", "-", form.title.lower()).strip("-") or "form"
    return RawResponse(
        content=buffer.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{slug}-responses.csv"'
        },
    )


@router.get("/responses/{response_id}", response_model=schemas.ResponseDetail)
def get_response(response_id: int, db: Session = Depends(get_db)):
    response = db.get(Response, response_id)
    if response is None:
        raise HTTPException(status_code=404, detail="Response not found")

    question_order = {q.id: q.position for q in response.form.questions}
    answers = sorted(
        response.answers, key=lambda a: question_order.get(a.question_id, 999)
    )
    return schemas.ResponseDetail(
        id=response.id,
        form_id=response.form_id,
        submitted_at=response.submitted_at,
        answers=[
            schemas.AnswerDetail(
                question_id=a.question_id,
                question_title=a.question.title,
                question_type=a.question.type,
                value=a.value,
            )
            for a in answers
        ],
    )


def _question_stats(question: Question, values: list[str]) -> dict:
    if question.type in CHOICE_TYPES:
        if question.type == "yes_no":
            labels = ["Yes", "No"]
        else:
            labels = [option.label for option in question.options]
        counts = {label: 0 for label in labels}
        for value in values:
            if value in counts:
                counts[value] += 1
        return {"counts": counts}

    if question.type == "rating":
        max_rating = (question.settings or {}).get("max", 5)
        distribution = {str(i): 0 for i in range(1, max_rating + 1)}
        numeric = []
        for value in values:
            if value in distribution:
                distribution[value] += 1
                numeric.append(int(value))
        average = round(sum(numeric) / len(numeric), 2) if numeric else None
        return {"average": average, "distribution": distribution, "max": max_rating}

    if question.type == "number":
        numeric = []
        for value in values:
            try:
                numeric.append(float(value))
            except ValueError:
                continue
        average = round(sum(numeric) / len(numeric), 2) if numeric else None
        return {"average": average}

    # text-like: latest samples, newest first
    return {"latest": list(reversed(values))[:LATEST_SAMPLE_SIZE]}


@router.get("/forms/{form_id}/summary", response_model=schemas.FormSummary)
def form_summary(form_id: int, db: Session = Depends(get_db)):
    form = get_form_or_404(form_id, db)
    responses = (
        db.query(Response)
        .filter(Response.form_id == form.id)
        .order_by(Response.submitted_at.asc(), Response.id.asc())
        .all()
    )
    values_by_question: dict[int, list[str]] = {q.id: [] for q in form.questions}
    for response in responses:
        for answer in response.answers:
            if answer.question_id in values_by_question:
                values_by_question[answer.question_id].append(answer.value)

    return schemas.FormSummary(
        response_count=len(responses),
        questions=[
            schemas.SummaryQuestion(
                question_id=question.id,
                title=question.title,
                type=question.type,
                answered_count=len(values_by_question[question.id]),
                stats=_question_stats(question, values_by_question[question.id]),
            )
            for question in form.questions
        ],
    )
