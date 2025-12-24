from __future__ import annotations

import hashlib
import secrets
import time
import uuid
from dataclasses import dataclass

import bcrypt
import jwt
from passlib.context import CryptContext

from app.core.settings import Settings


SESSION_COOKIE = "nv_session"
CSRF_COOKIE = "nv_csrf"
DEVICE_COOKIE = "nv_device"


# Используем pbkdf2_sha256: он не зависит от нативных bcrypt-бэкендов и не имеет
# ограничения bcrypt в 72 байта.
_pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    pbkdf2_sha256__rounds=260_000,
)


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    # Поддержка старых bcrypt-хэшей (если они уже есть в базе).
    if password_hash.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            pw = password.encode("utf-8")
            # У bcrypt историческое ограничение 72 байта — остальное игнорируется/триггерит ошибку.
            if len(pw) > 72:
                pw = pw[:72]
            return bool(bcrypt.checkpw(pw, password_hash.encode("utf-8")))
        except Exception:  # noqa: BLE001
            return False
    return _pwd_context.verify(password, password_hash)


def new_token(*, nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class SessionData:
    user_id: uuid.UUID


def create_session_jwt(*, user_id: uuid.UUID, settings: Settings) -> str:
    now = int(time.time())
    exp = now + int(settings.jwt_ttl_minutes) * 60
    payload = {"sub": str(user_id), "iat": now, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_session_jwt(token: str, settings: Settings) -> SessionData:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    sub = payload.get("sub")
    if not isinstance(sub, str):
        raise ValueError("Invalid token")
    return SessionData(user_id=uuid.UUID(sub))
