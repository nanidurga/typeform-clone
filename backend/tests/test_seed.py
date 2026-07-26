from app.models import Form, Response
from app.seed import seed_if_empty
from app.validation import validate_answers


def test_seed_populates_empty_db(db_session):
    seed_if_empty(db_session)
    forms = db_session.query(Form).all()
    assert len(forms) == 3
    statuses = sorted(f.status for f in forms)
    assert statuses == ["draft", "published", "published"]

    published = [f for f in forms if f.status == "published"]
    all_types = {q.type for f in published for q in f.questions}
    assert all_types == {
        "short_text",
        "long_text",
        "multiple_choice",
        "dropdown",
        "email",
        "number",
        "yes_no",
        "rating",
    }

    total_responses = db_session.query(Response).count()
    assert total_responses >= 6

    # every seeded response passes the app's own validation rules
    for form in published:
        for response in form.responses:
            answers = {a.question_id: a.value for a in response.answers}
            assert validate_answers(form.questions, answers) == []


def test_seed_is_idempotent(db_session):
    seed_if_empty(db_session)
    count_first = db_session.query(Form).count()
    seed_if_empty(db_session)
    assert db_session.query(Form).count() == count_first
