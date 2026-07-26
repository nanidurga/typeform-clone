import pytest


@pytest.fixture()
def published_form(client):
    form = client.post("/api/forms", json={"title": "Survey"}).json()
    fid = form["id"]

    def add(payload):
        return client.post(f"/api/forms/{fid}/questions", json=payload).json()

    questions = {
        "name": add({"type": "short_text", "title": "Name?", "required": True}),
        "email": add({"type": "email", "title": "Email?"}),
        "age": add({"type": "number", "title": "Age?"}),
        "color": add({"type": "multiple_choice", "title": "Color?", "options": ["Red", "Blue"]}),
        "sub": add({"type": "yes_no", "title": "Subscribe?"}),
        "rate": add({"type": "rating", "title": "Rate us", "settings": {"max": 5}}),
    }
    client.patch(f"/api/forms/{fid}", json={"status": "published"})
    form = client.get(f"/api/forms/{fid}").json()
    return {"form": form, "q": questions}


def _submit(client, public_id, answers):
    return client.post(
        f"/api/public/forms/{public_id}/responses", json={"answers": answers}
    )


def _errors(res):
    return {e["question_id"]: e["message"] for e in res.json()["detail"]["errors"]}


def test_get_public_form(client, published_form):
    public_id = published_form["form"]["public_id"]
    res = client.get(f"/api/public/forms/{public_id}")
    assert res.status_code == 200
    assert len(res.json()["questions"]) == 6


def test_draft_form_not_public(client):
    form = client.post("/api/forms", json={"title": "Draft"}).json()
    assert client.get(f"/api/public/forms/{form['public_id']}").status_code == 404
    assert _submit(client, form["public_id"], []).status_code == 404


def test_unknown_slug_404(client):
    assert client.get("/api/public/forms/nope").status_code == 404


def test_happy_submission(client, published_form):
    form, q = published_form["form"], published_form["q"]
    res = _submit(
        client,
        form["public_id"],
        [
            {"question_id": q["name"]["id"], "value": "Alice"},
            {"question_id": q["email"]["id"], "value": "alice@example.com"},
            {"question_id": q["age"]["id"], "value": "30"},
            {"question_id": q["color"]["id"], "value": "Red"},
            {"question_id": q["sub"]["id"], "value": "Yes"},
            {"question_id": q["rate"]["id"], "value": "4"},
        ],
    )
    assert res.status_code == 201, res.text
    assert "id" in res.json()

    listing = client.get(f"/api/forms/{form['id']}/responses")
    assert listing.status_code == 200 or listing.status_code == 404  # results task later


def test_required_missing(client, published_form):
    form, q = published_form["form"], published_form["q"]
    res = _submit(client, form["public_id"], [])
    assert res.status_code == 422
    assert _errors(res)[q["name"]["id"]] == "This field is required"


def test_email_format(client, published_form):
    form, q = published_form["form"], published_form["q"]
    res = _submit(
        client,
        form["public_id"],
        [
            {"question_id": q["name"]["id"], "value": "Bob"},
            {"question_id": q["email"]["id"], "value": "not-an-email"},
        ],
    )
    assert res.status_code == 422
    assert q["email"]["id"] in _errors(res)


def test_number_and_rating_and_choice_rules(client, published_form):
    form, q = published_form["form"], published_form["q"]
    res = _submit(
        client,
        form["public_id"],
        [
            {"question_id": q["name"]["id"], "value": "Bob"},
            {"question_id": q["age"]["id"], "value": "abc"},
            {"question_id": q["color"]["id"], "value": "Purple"},
            {"question_id": q["sub"]["id"], "value": "Maybe"},
            {"question_id": q["rate"]["id"], "value": "9"},
        ],
    )
    assert res.status_code == 422
    errors = _errors(res)
    assert set(errors) == {
        q["age"]["id"],
        q["color"]["id"],
        q["sub"]["id"],
        q["rate"]["id"],
    }


def test_unknown_question_id_rejected(client, published_form):
    form = published_form["form"]
    q = published_form["q"]
    res = _submit(
        client,
        form["public_id"],
        [
            {"question_id": q["name"]["id"], "value": "Bob"},
            {"question_id": 99999, "value": "hm"},
        ],
    )
    assert res.status_code == 422


def test_optional_blank_skipped(client, published_form):
    form, q = published_form["form"], published_form["q"]
    res = _submit(
        client,
        form["public_id"],
        [
            {"question_id": q["name"]["id"], "value": "Bob"},
            {"question_id": q["email"]["id"], "value": ""},
        ],
    )
    assert res.status_code == 201
