from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.models import Answer, Form, Response
from app.validation import validate_answers

router = APIRouter(prefix="/api/public", tags=["public"])


def _get_published_form(public_id: str, db: Session) -> Form:
    form = db.query(Form).filter(Form.public_id == public_id).first()
    if form is None or form.status != "published":
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.get("/forms/{public_id}", response_model=schemas.FormDetail)
def get_public_form(public_id: str, db: Session = Depends(get_db)):
    return _get_published_form(public_id, db)


@router.post("/forms/{public_id}/responses", status_code=201)
def submit_response(
    public_id: str, payload: schemas.ResponseCreate, db: Session = Depends(get_db)
):
    form = _get_published_form(public_id, db)
    answers = {answer.question_id: answer.value for answer in payload.answers}

    errors = validate_answers(form.questions, answers)
    if errors:
        raise HTTPException(status_code=422, detail={"errors": errors})

    response = Response(form_id=form.id)
    for question in form.questions:
        value = answers.get(question.id, "").strip()
        if value == "":
            continue
        response.answers.append(Answer(question_id=question.id, value=value))
    db.add(response)
    db.commit()
    db.refresh(response)
    return {"id": response.id}
