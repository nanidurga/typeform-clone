from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.models import Question, QuestionOption
from app.routers.forms import get_form_or_404

router = APIRouter(prefix="/api", tags=["questions"])


def _get_question_or_404(question_id: int, db: Session) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


def _set_options(question: Question, labels: list[str]) -> None:
    question.options = [
        QuestionOption(label=label, position=index) for index, label in enumerate(labels)
    ]


@router.post(
    "/forms/{form_id}/questions", response_model=schemas.QuestionOut, status_code=201
)
def add_question(
    form_id: int, payload: schemas.QuestionCreate, db: Session = Depends(get_db)
):
    form = get_form_or_404(form_id, db)
    # empty default title: the builder renders it as a faint placeholder
    question = Question(
        type=payload.type,
        title=payload.title or "",
        description=payload.description,
        required=payload.required,
        position=len(form.questions),
        settings=payload.settings,
    )
    if payload.options is not None:
        _set_options(question, payload.options)
    form.questions.append(question)
    db.commit()
    db.refresh(question)
    return question


@router.patch("/questions/{question_id}", response_model=schemas.QuestionOut)
def update_question(
    question_id: int, payload: schemas.QuestionPatch, db: Session = Depends(get_db)
):
    question = _get_question_or_404(question_id, db)
    updates = payload.model_dump(exclude_unset=True)
    options = updates.pop("options", None)
    for field, value in updates.items():
        setattr(question, field, value)
    if options is not None:
        _set_options(question, options)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = _get_question_or_404(question_id, db)
    form = question.form
    db.delete(question)
    db.flush()
    remaining = sorted(
        (q for q in form.questions if q.id != question_id), key=lambda q: q.position
    )
    for index, q in enumerate(remaining):
        q.position = index
    db.commit()


@router.put("/forms/{form_id}/questions/order")
def reorder_questions(
    form_id: int, payload: schemas.QuestionOrder, db: Session = Depends(get_db)
):
    form = get_form_or_404(form_id, db)
    existing_ids = {q.id for q in form.questions}
    if set(payload.question_ids) != existing_ids or len(payload.question_ids) != len(
        existing_ids
    ):
        raise HTTPException(
            status_code=422,
            detail="question_ids must be a permutation of the form's question ids",
        )
    position_by_id = {qid: index for index, qid in enumerate(payload.question_ids)}
    for question in form.questions:
        question.position = position_by_id[question.id]
    db.commit()
    return {"ok": True}
