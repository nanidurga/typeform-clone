import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
