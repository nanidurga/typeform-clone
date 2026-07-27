from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    public_id: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    thank_you_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    welcome_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    welcome_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    welcome_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    theme: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=_utcnow, onupdate=_utcnow, nullable=False
    )

    questions: Mapped[list["Question"]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )
    responses: Mapped[list["Response"]] = relationship(
        back_populates="form", cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False, default="...")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    form: Mapped[Form] = relationship(back_populates="questions")
    options: Mapped[list["QuestionOption"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.position",
    )
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    question: Mapped[Question] = relationship(back_populates="options")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)

    form: Mapped[Form] = relationship(back_populates="responses")
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="response", cascade="all, delete-orphan"
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    response_id: Mapped[int] = mapped_column(
        ForeignKey("responses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    value: Mapped[str] = mapped_column(Text, nullable=False)

    response: Mapped[Response] = relationship(back_populates="answers")
    question: Mapped[Question] = relationship(back_populates="answers")
