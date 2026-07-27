import pytest


@pytest.fixture()
def form_with_responses(client):
    form = client.post("/api/forms", json={"title": "Feedback"}).json()
    fid = form["id"]

    def add(payload):
        return client.post(f"/api/forms/{fid}/questions", json=payload).json()

    q_name = add({"type": "short_text", "title": "Name?", "required": True})
    q_color = add({"type": "multiple_choice", "title": "Color?", "options": ["Red", "Blue", "Green"]})
    q_rate = add({"type": "rating", "title": "Rate", "settings": {"max": 5}})
    q_age = add({"type": "number", "title": "Age?"})
    client.patch(f"/api/forms/{fid}", json={"status": "published"})
    form = client.get(f"/api/forms/{fid}").json()

    submissions = [
        [("Alice", q_name), ("Red", q_color), ("5", q_rate), ("30", q_age)],
        [("Bob", q_name), ("Red", q_color), ("3", q_rate), ("40", q_age)],
        [("Cara", q_name), ("Blue", q_color), ("4", q_rate)],
    ]
    for submission in submissions:
        answers = [
            {"question_id": q["id"], "value": value} for value, q in submission
        ]
        res = client.post(
            f"/api/public/forms/{form['public_id']}/responses",
            json={"answers": answers},
        )
        assert res.status_code == 201

    return {
        "form": form,
        "q_name": q_name,
        "q_color": q_color,
        "q_rate": q_rate,
        "q_age": q_age,
    }


def test_list_responses(client, form_with_responses):
    fid = form_with_responses["form"]["id"]
    res = client.get(f"/api/forms/{fid}/responses")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3
    first = body["items"][0]
    assert {"id", "submitted_at", "answers"} <= set(first)
    # newest first
    submitted = [item["submitted_at"] for item in body["items"]]
    assert submitted == sorted(submitted, reverse=True)


def test_response_detail(client, form_with_responses):
    fid = form_with_responses["form"]["id"]
    items = client.get(f"/api/forms/{fid}/responses").json()["items"]
    detail = client.get(f"/api/responses/{items[-1]['id']}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["form_id"] == fid
    titles = {a["question_title"] for a in body["answers"]}
    assert "Name?" in titles
    types = {a["question_type"] for a in body["answers"]}
    assert "short_text" in types


def test_summary_stats(client, form_with_responses):
    f = form_with_responses
    fid = f["form"]["id"]
    res = client.get(f"/api/forms/{fid}/summary")
    assert res.status_code == 200
    body = res.json()
    assert body["response_count"] == 3
    by_id = {q["question_id"]: q for q in body["questions"]}

    color = by_id[f["q_color"]["id"]]
    assert color["stats"]["counts"] == {"Red": 2, "Blue": 1, "Green": 0}
    assert color["answered_count"] == 3

    rate = by_id[f["q_rate"]["id"]]
    assert rate["stats"]["max"] == 5
    assert rate["stats"]["average"] == 4.0
    assert rate["stats"]["distribution"]["5"] == 1

    age = by_id[f["q_age"]["id"]]
    assert age["answered_count"] == 2
    assert age["stats"]["average"] == 35.0

    name = by_id[f["q_name"]["id"]]
    assert name["stats"]["latest"] == ["Cara", "Bob", "Alice"]


def test_csv_export(client, form_with_responses):
    f = form_with_responses
    fid = f["form"]["id"]
    res = client.get(f"/api/forms/{fid}/responses/export")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "attachment" in res.headers["content-disposition"]

    lines = res.text.strip().splitlines()
    assert len(lines) == 4  # header + 3 responses
    assert "Name?" in lines[0] and "Submitted At" in lines[0]
    assert "Alice" in lines[1]
    assert "Blue" in lines[3]


def test_csv_export_escapes_formulas(client):
    form = client.post("/api/forms", json={"title": "Inject"}).json()
    q = client.post(
        f"/api/forms/{form['id']}/questions", json={"type": "short_text"}
    ).json()
    client.patch(f"/api/forms/{form['id']}", json={"status": "published"})
    form = client.get(f"/api/forms/{form['id']}").json()
    client.post(
        f"/api/public/forms/{form['public_id']}/responses",
        json={"answers": [{"question_id": q["id"], "value": "=SUM(A1:A9)"}]},
    )
    res = client.get(f"/api/forms/{form['id']}/responses/export")
    assert "'=SUM(A1:A9)" in res.text


def test_results_404s(client):
    assert client.get("/api/forms/999/responses").status_code == 404
    assert client.get("/api/forms/999/summary").status_code == 404
    assert client.get("/api/responses/999").status_code == 404
