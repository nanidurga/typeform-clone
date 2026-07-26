from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.routers import forms

app = FastAPI(title="Typeform Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(forms.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
