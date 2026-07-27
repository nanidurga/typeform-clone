from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app import models  # noqa: F401  (register tables on Base.metadata)
from app.database import Base, SessionLocal, engine
from app.routers import forms, public, questions, results
from app.seed import seed_if_empty


def _run_sqlite_migrations() -> None:
    """create_all only creates missing tables — add new columns to existing DBs."""
    with engine.begin() as conn:
        cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(forms)")}
        if cols:
            if "welcome_enabled" not in cols:
                conn.exec_driver_sql(
                    "ALTER TABLE forms ADD COLUMN welcome_enabled BOOLEAN NOT NULL DEFAULT 0"
                )
            if "welcome_title" not in cols:
                conn.exec_driver_sql("ALTER TABLE forms ADD COLUMN welcome_title TEXT")
            if "welcome_message" not in cols:
                conn.exec_driver_sql("ALTER TABLE forms ADD COLUMN welcome_message TEXT")
            if "theme" not in cols:
                conn.exec_driver_sql("ALTER TABLE forms ADD COLUMN theme JSON")


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _run_sqlite_migrations()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Typeform Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(public.router)
app.include_router(results.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
