"""Seed the database with demo forms and responses when it is empty.

Keeps the deployed demo usable even on hosts with ephemeral disks:
the app re-seeds itself on boot whenever the forms table is empty.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Answer, Form, Question, QuestionOption, Response
from app.utils import generate_public_id


def _question(qtype, title, position, *, description=None, required=False, settings=None, options=None):
    question = Question(
        type=qtype,
        title=title,
        description=description,
        required=required,
        position=position,
        settings=settings,
    )
    if options:
        question.options = [
            QuestionOption(label=label, position=index)
            for index, label in enumerate(options)
        ]
    return question


def _response(form, days_ago, answers_by_title):
    by_title = {q.title: q for q in form.questions}
    response = Response(
        submitted_at=datetime.now(timezone.utc) - timedelta(days=days_ago)
    )
    for title, value in answers_by_title.items():
        response.answers.append(Answer(question=by_title[title], value=value))
    form.responses.append(response)


def seed_if_empty(db: Session) -> None:
    if db.query(Form.id).first() is not None:
        return

    feedback = Form(
        title="Customer Feedback Survey",
        status="published",
        public_id=generate_public_id(db),
        thank_you_message="Thanks for helping us improve! 💜",
        welcome_enabled=True,
        welcome_title="We'd love your feedback 👋",
        welcome_message="It takes less than 2 minutes. Ready?",
    )
    feedback.questions = [
        _question("short_text", "First up — what's your name?", 0, required=True),
        _question("email", "And your email address?", 1,
                  description="We'll only use this to follow up on your feedback.", required=True),
        _question("multiple_choice", "How did you hear about us?", 2,
                  options=["Social media", "A friend", "Search engine", "Advertisement"]),
        _question("rating", "How satisfied are you with our product?", 3,
                  required=True, settings={"max": 5}),
        _question("yes_no", "Would you recommend us to a friend?", 4, required=True),
        _question("long_text", "Anything we could do better?", 5,
                  description="Be as honest as you like — we read every answer."),
    ]
    db.add(feedback)

    registration = Form(
        title="Event Registration",
        status="published",
        public_id=generate_public_id(db),
        thank_you_message="You're registered! See you at DevConf 2026 🎉",
    )
    registration.questions = [
        _question("short_text", "What's your full name?", 0, required=True),
        _question("email", "Where should we send your ticket?", 1, required=True),
        _question("dropdown", "Which track are you most interested in?", 2,
                  required=True,
                  options=["Frontend", "Backend", "AI & ML", "DevOps", "Product & Design"]),
        _question("number", "How many years of experience do you have?", 3),
        _question("yes_no", "Do you need a parking spot?", 4),
        _question("rating", "How excited are you for the event?", 5, settings={"max": 10}),
    ]
    db.add(registration)

    draft = Form(
        title="Product Research — Draft",
        status="draft",
        public_id=generate_public_id(db),
    )
    draft.questions = [
        _question("short_text", "What problem are you trying to solve?", 0),
        _question("multiple_choice", "How often do you face it?", 1,
                  options=["Daily", "Weekly", "Monthly", "Rarely"]),
    ]
    db.add(draft)
    db.flush()

    _response(feedback, 6, {
        "First up — what's your name?": "Priya Sharma",
        "And your email address?": "priya.sharma@example.com",
        "How did you hear about us?": "Social media",
        "How satisfied are you with our product?": "5",
        "Would you recommend us to a friend?": "Yes",
        "Anything we could do better?": "Love the product! Mobile app could be faster though.",
    })
    _response(feedback, 4, {
        "First up — what's your name?": "Marcus Lee",
        "And your email address?": "marcus.lee@example.com",
        "How did you hear about us?": "A friend",
        "How satisfied are you with our product?": "4",
        "Would you recommend us to a friend?": "Yes",
    })
    _response(feedback, 2, {
        "First up — what's your name?": "Sofia González",
        "And your email address?": "sofia.g@example.com",
        "How did you hear about us?": "Search engine",
        "How satisfied are you with our product?": "3",
        "Would you recommend us to a friend?": "No",
        "Anything we could do better?": "Pricing feels steep for small teams.",
    })
    _response(feedback, 1, {
        "First up — what's your name?": "Tom Becker",
        "And your email address?": "tom.becker@example.com",
        "How did you hear about us?": "Social media",
        "How satisfied are you with our product?": "5",
        "Would you recommend us to a friend?": "Yes",
        "Anything we could do better?": "All good. Ship the dark mode!",
    })

    _response(registration, 5, {
        "What's your full name?": "Aisha Khan",
        "Where should we send your ticket?": "aisha.khan@example.com",
        "Which track are you most interested in?": "AI & ML",
        "How many years of experience do you have?": "6",
        "Do you need a parking spot?": "No",
        "How excited are you for the event?": "9",
    })
    _response(registration, 3, {
        "What's your full name?": "Daniel Novak",
        "Where should we send your ticket?": "d.novak@example.com",
        "Which track are you most interested in?": "Backend",
        "How many years of experience do you have?": "11",
        "Do you need a parking spot?": "Yes",
        "How excited are you for the event?": "7",
    })
    _response(registration, 1, {
        "What's your full name?": "Emma Wilson",
        "Where should we send your ticket?": "emma.w@example.com",
        "Which track are you most interested in?": "Frontend",
        "Do you need a parking spot?": "No",
        "How excited are you for the event?": "10",
    })

    db.commit()
