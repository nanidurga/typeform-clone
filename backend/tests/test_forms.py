from app.models import Answer, Question, QuestionOption, Response


def _create(client, title="My form"):
    res = client.post("/api/forms", json={"title": title})
    assert res.status_code == 201
    return res.json()


def test_create_and_get_form(client):
    form = _create(client)
    assert form["title"] == "My form"
    assert form["status"] == "draft"
    assert form["questions"] == []
    assert len(form["public_id"]) >= 8

    res = client.get(f"/api/forms/{form['id']}")
    assert res.status_code == 200
    assert res.json()["title"] == "My form"


def test_list_forms_with_counts(client, db_session):
    from app.models import Form

    form = _create(client)

    orm_form = db_session.get(Form, form["id"])
    q = Question(type="short_text", title="Name?", position=0)
    orm_form.questions.append(q)
    resp = Response()
    resp.answers = [Answer(question=q, value="Bob")]
    orm_form.responses.append(resp)
    db_session.commit()

    res = client.get("/api/forms")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["response_count"] == 1
    assert items[0]["question_count"] == 1
    assert items[0]["status"] == "draft"


def test_patch_title_status_and_thank_you(client):
    form = _create(client)
    res = client.patch(
        f"/api/forms/{form['id']}",
        json={"title": "Renamed", "status": "published", "thank_you_message": "Cheers!"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Renamed"
    assert body["status"] == "published"
    assert body["thank_you_message"] == "Cheers!"

    res = client.patch(f"/api/forms/{form['id']}", json={"status": "draft"})
    assert res.json()["status"] == "draft"


def test_patch_welcome_screen_fields(client):
    form = _create(client)
    assert form["welcome_enabled"] is False
    res = client.patch(
        f"/api/forms/{form['id']}",
        json={
            "welcome_enabled": True,
            "welcome_title": "Hi there 👋",
            "welcome_message": "Ready to start?",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["welcome_enabled"] is True
    assert body["welcome_title"] == "Hi there 👋"
    assert body["welcome_message"] == "Ready to start?"


def test_patch_theme(client):
    form = _create(client)
    assert form["theme"] is None
    res = client.patch(
        f"/api/forms/{form['id']}",
        json={"theme": {"accent": "purple", "background": "lavender", "font": "serif"}},
    )
    assert res.status_code == 200
    assert res.json()["theme"] == {
        "accent": "purple",
        "background": "lavender",
        "font": "serif",
    }


def test_patch_rejects_bad_status(client):
    form = _create(client)
    res = client.patch(f"/api/forms/{form['id']}", json={"status": "archived"})
    assert res.status_code == 422


def test_delete_form(client):
    form = _create(client)
    res = client.delete(f"/api/forms/{form['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/forms/{form['id']}").status_code == 404


def test_duplicate_form(client, db_session):
    from app.models import Form

    form = _create(client, "Original")
    orm_form = db_session.get(Form, form["id"])
    q = Question(type="multiple_choice", title="Pick", position=0, required=True)
    q.options = [QuestionOption(label="A", position=0), QuestionOption(label="B", position=1)]
    orm_form.questions.append(q)
    orm_form.status = "published"
    orm_form.responses.append(Response())
    db_session.commit()

    res = client.post(f"/api/forms/{form['id']}/duplicate")
    assert res.status_code == 201
    copy = res.json()
    assert copy["title"] == "Original (copy)"
    assert copy["status"] == "draft"
    assert copy["public_id"] != form["public_id"]
    assert len(copy["questions"]) == 1
    assert copy["questions"][0]["required"] is True
    assert [o["label"] for o in copy["questions"][0]["options"]] == ["A", "B"]

    listing = {f["id"]: f for f in client.get("/api/forms").json()}
    assert listing[copy["id"]]["response_count"] == 0


def test_missing_form_404s(client):
    assert client.get("/api/forms/999").status_code == 404
    assert client.patch("/api/forms/999", json={"title": "x"}).status_code == 404
    assert client.delete("/api/forms/999").status_code == 404
    assert client.post("/api/forms/999/duplicate").status_code == 404
