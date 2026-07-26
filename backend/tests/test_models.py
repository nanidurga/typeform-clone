from app.models import Answer, Form, Question, QuestionOption, Response


def _build_form(db):
    form = Form(title="Test form", public_id="abc123defg")
    q1 = Question(type="short_text", title="Your name?", position=0)
    q2 = Question(type="multiple_choice", title="Pick one", position=1)
    q2.options = [
        QuestionOption(label="Red", position=0),
        QuestionOption(label="Blue", position=1),
    ]
    form.questions = [q1, q2]
    response = Response()
    response.answers = [
        Answer(question=q1, value="Alice"),
        Answer(question=q2, value="Red"),
    ]
    form.responses = [response]
    db.add(form)
    db.commit()
    return form


def test_create_form_graph(db_session):
    form = _build_form(db_session)
    assert form.id is not None
    assert form.status == "draft"
    assert [q.position for q in form.questions] == [0, 1]
    assert [o.label for o in form.questions[1].options] == ["Red", "Blue"]
    assert len(form.responses[0].answers) == 2
    assert form.created_at is not None


def test_cascade_delete(db_session):
    form = _build_form(db_session)
    db_session.delete(form)
    db_session.commit()
    assert db_session.query(Question).count() == 0
    assert db_session.query(QuestionOption).count() == 0
    assert db_session.query(Response).count() == 0
    assert db_session.query(Answer).count() == 0
