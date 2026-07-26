import secrets
import string

from sqlalchemy.orm import Session

_ALPHABET = string.ascii_lowercase + string.digits


def generate_public_id(db: Session, length: int = 10) -> str:
    from app.models import Form

    while True:
        candidate = "".join(secrets.choice(_ALPHABET) for _ in range(length))
        exists = db.query(Form.id).filter(Form.public_id == candidate).first()
        if not exists:
            return candidate
