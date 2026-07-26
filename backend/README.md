# Backend — FastAPI + SQLite

See the [root README](../README.md) for full documentation.

```bash
python -m venv .venv
.venv/Scripts/activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # API + Swagger at /docs
python -m pytest                            # run the test suite
```

Layout: `app/models.py` (SQLAlchemy), `app/schemas.py` (Pydantic),
`app/routers/` (forms, questions, public, results), `app/validation.py`
(answer rules), `app/seed.py` (demo data on empty DB), `tests/`.
