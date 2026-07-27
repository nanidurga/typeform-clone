from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.models import Form, Question, QuestionOption, Response
from app.utils import generate_public_id

router = APIRouter(prefix="/api/forms", tags=["forms"])


def get_form_or_404(form_id: int, db: Session) -> Form:
    form = db.get(Form, form_id)
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.get("", response_model=list[schemas.FormListItem])
def list_forms(db: Session = Depends(get_db)):
    response_counts = (
        db.query(Response.form_id, func.count(Response.id).label("n"))
        .group_by(Response.form_id)
        .subquery()
    )
    question_counts = (
        db.query(Question.form_id, func.count(Question.id).label("n"))
        .group_by(Question.form_id)
        .subquery()
    )
    rows = (
        db.query(
            Form,
            func.coalesce(response_counts.c.n, 0),
            func.coalesce(question_counts.c.n, 0),
        )
        .outerjoin(response_counts, response_counts.c.form_id == Form.id)
        .outerjoin(question_counts, question_counts.c.form_id == Form.id)
        .order_by(Form.updated_at.desc())
        .all()
    )
    return [
        schemas.FormListItem(
            id=form.id,
            title=form.title,
            status=form.status,
            public_id=form.public_id,
            response_count=response_count,
            question_count=question_count,
            created_at=form.created_at,
            updated_at=form.updated_at,
        )
        for form, response_count, question_count in rows
    ]


@router.post("", response_model=schemas.FormDetail, status_code=201)
def create_form(payload: schemas.FormCreate, db: Session = Depends(get_db)):
    form = Form(title=payload.title, public_id=generate_public_id(db))
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


@router.get("/{form_id}", response_model=schemas.FormDetail)
def get_form(form_id: int, db: Session = Depends(get_db)):
    return get_form_or_404(form_id, db)


@router.patch("/{form_id}", response_model=schemas.FormDetail)
def update_form(form_id: int, payload: schemas.FormPatch, db: Session = Depends(get_db)):
    form = get_form_or_404(form_id, db)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(form, field, value)
    db.commit()
    db.refresh(form)
    return form


@router.delete("/{form_id}", status_code=204)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form = get_form_or_404(form_id, db)
    db.delete(form)
    db.commit()


@router.post("/{form_id}/duplicate", response_model=schemas.FormDetail, status_code=201)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    source = get_form_or_404(form_id, db)
    copy = Form(
        title=f"{source.title} (copy)",
        status="draft",
        public_id=generate_public_id(db),
        thank_you_message=source.thank_you_message,
        welcome_enabled=source.welcome_enabled,
        welcome_title=source.welcome_title,
        welcome_message=source.welcome_message,
        theme=dict(source.theme) if source.theme else None,
    )
    for question in source.questions:
        question_copy = Question(
            type=question.type,
            title=question.title,
            description=question.description,
            required=question.required,
            position=question.position,
            settings=dict(question.settings) if question.settings else None,
        )
        question_copy.options = [
            QuestionOption(label=option.label, position=option.position)
            for option in question.options
        ]
        copy.questions.append(question_copy)
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return copy
