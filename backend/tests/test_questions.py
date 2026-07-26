def _form(client):
    return client.post("/api/forms", json={"title": "Q form"}).json()


def _add(client, form_id, payload):
    res = client.post(f"/api/forms/{form_id}/questions", json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def test_add_questions_appends_positions(client):
    form = _form(client)
    q1 = _add(client, form["id"], {"type": "short_text", "title": "Name?"})
    q2 = _add(client, form["id"], {"type": "email"})
    assert q1["position"] == 0
    assert q2["position"] == 1
    assert q2["title"]  # default title assigned


def test_add_choice_question_with_options(client):
    form = _form(client)
    q = _add(
        client,
        form["id"],
        {"type": "multiple_choice", "title": "Pick", "options": ["Red", "Blue", "Green"]},
    )
    assert [o["label"] for o in q["options"]] == ["Red", "Blue", "Green"]
    assert [o["position"] for o in q["options"]] == [0, 1, 2]


def test_add_invalid_type_rejected(client):
    form = _form(client)
    res = client.post(f"/api/forms/{form['id']}/questions", json={"type": "file_upload"})
    assert res.status_code == 422


def test_patch_question_replaces_options(client):
    form = _form(client)
    q = _add(client, form["id"], {"type": "dropdown", "options": ["A", "B"]})
    res = client.patch(
        f"/api/questions/{q['id']}",
        json={"title": "Choose", "required": True, "options": ["X", "Y", "Z"]},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Choose"
    assert body["required"] is True
    assert [o["label"] for o in body["options"]] == ["X", "Y", "Z"]


def test_patch_settings(client):
    form = _form(client)
    q = _add(client, form["id"], {"type": "rating"})
    res = client.patch(f"/api/questions/{q['id']}", json={"settings": {"max": 10}})
    assert res.json()["settings"] == {"max": 10}


def test_delete_question_compacts_positions(client):
    form = _form(client)
    q1 = _add(client, form["id"], {"type": "short_text"})
    q2 = _add(client, form["id"], {"type": "long_text"})
    q3 = _add(client, form["id"], {"type": "number"})
    res = client.delete(f"/api/questions/{q2['id']}")
    assert res.status_code == 204

    detail = client.get(f"/api/forms/{form['id']}").json()
    ids = [q["id"] for q in detail["questions"]]
    positions = [q["position"] for q in detail["questions"]]
    assert ids == [q1["id"], q3["id"]]
    assert positions == [0, 1]


def test_reorder_questions(client):
    form = _form(client)
    qs = [_add(client, form["id"], {"type": "short_text"}) for _ in range(3)]
    new_order = [qs[2]["id"], qs[0]["id"], qs[1]["id"]]
    res = client.put(
        f"/api/forms/{form['id']}/questions/order", json={"question_ids": new_order}
    )
    assert res.status_code == 200

    detail = client.get(f"/api/forms/{form['id']}").json()
    assert [q["id"] for q in detail["questions"]] == new_order


def test_reorder_rejects_wrong_id_set(client):
    form = _form(client)
    q1 = _add(client, form["id"], {"type": "short_text"})
    res = client.put(
        f"/api/forms/{form['id']}/questions/order",
        json={"question_ids": [q1["id"], 9999]},
    )
    assert res.status_code == 422


def test_question_404s(client):
    assert client.patch("/api/questions/999", json={"title": "x"}).status_code == 404
    assert client.delete("/api/questions/999").status_code == 404
    assert (
        client.post("/api/forms/999/questions", json={"type": "short_text"}).status_code == 404
    )
