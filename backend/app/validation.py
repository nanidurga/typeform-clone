import re

from app.models import Question

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

REQUIRED_MESSAGE = "This field is required"


def _validate_value(question: Question, value: str) -> str | None:
    if question.type == "email":
        if not EMAIL_RE.match(value):
            return "Please enter a valid email address"
    elif question.type == "number":
        try:
            float(value)
        except ValueError:
            return "Please enter a valid number"
    elif question.type == "rating":
        max_rating = (question.settings or {}).get("max", 5)
        if not value.isdigit() or not (1 <= int(value) <= max_rating):
            return f"Please pick a rating between 1 and {max_rating}"
    elif question.type in ("multiple_choice", "dropdown"):
        labels = {option.label for option in question.options}
        if value not in labels:
            return "Please select one of the options"
    elif question.type == "yes_no":
        if value not in ("Yes", "No"):
            return "Please answer Yes or No"
    return None


def validate_answers(
    questions: list[Question], answers: dict[int, str]
) -> list[dict]:
    """Validate submitted answers against a form's questions.

    `answers` maps question_id -> raw string value. Returns a list of
    {question_id, message} error dicts; empty list means valid.
    Blank answers to optional questions are treated as not answered.
    """
    errors: list[dict] = []
    known_ids = {question.id for question in questions}

    for question_id in answers:
        if question_id not in known_ids:
            errors.append(
                {"question_id": question_id, "message": "Unknown question"}
            )

    for question in questions:
        raw = answers.get(question.id, "").strip()
        if raw == "":
            if question.required:
                errors.append(
                    {"question_id": question.id, "message": REQUIRED_MESSAGE}
                )
            continue
        message = _validate_value(question, raw)
        if message is not None:
            errors.append({"question_id": question.id, "message": message})

    return errors
