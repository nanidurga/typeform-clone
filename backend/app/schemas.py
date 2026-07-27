from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

QuestionType = Literal[
    "short_text",
    "long_text",
    "multiple_choice",
    "dropdown",
    "email",
    "number",
    "yes_no",
    "rating",
]

FormStatus = Literal["draft", "published"]


class OptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    position: int


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: QuestionType
    title: str
    description: str | None = None
    required: bool
    position: int
    settings: dict | None = None
    options: list[OptionOut] = []


class FormDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: FormStatus
    public_id: str
    thank_you_message: str | None = None
    welcome_enabled: bool = False
    welcome_title: str | None = None
    welcome_message: str | None = None
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionOut] = []


class FormListItem(BaseModel):
    id: int
    title: str
    status: FormStatus
    public_id: str
    response_count: int
    question_count: int
    created_at: datetime
    updated_at: datetime


class FormCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class FormPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    status: FormStatus | None = None
    thank_you_message: str | None = None
    welcome_enabled: bool | None = None
    welcome_title: str | None = None
    welcome_message: str | None = None


class QuestionCreate(BaseModel):
    type: QuestionType
    title: str | None = None
    description: str | None = None
    required: bool = False
    settings: dict | None = None
    options: list[str] | None = None


class QuestionPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    required: bool | None = None
    settings: dict | None = None
    options: list[str] | None = None


class QuestionOrder(BaseModel):
    question_ids: list[int]


class AnswerIn(BaseModel):
    question_id: int
    value: str


class ResponseCreate(BaseModel):
    answers: list[AnswerIn] = []


class AnswerOut(BaseModel):
    question_id: int
    value: str


class ResponseListItem(BaseModel):
    id: int
    submitted_at: datetime
    answers: list[AnswerOut]


class ResponseList(BaseModel):
    total: int
    items: list[ResponseListItem]


class AnswerDetail(BaseModel):
    question_id: int
    question_title: str
    question_type: str
    value: str


class ResponseDetail(BaseModel):
    id: int
    form_id: int
    submitted_at: datetime
    answers: list[AnswerDetail]


class SummaryQuestion(BaseModel):
    question_id: int
    title: str
    type: str
    answered_count: int
    stats: dict


class FormSummary(BaseModel):
    response_count: int
    questions: list[SummaryQuestion]
