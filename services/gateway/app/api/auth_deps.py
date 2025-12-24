from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_settings
from app.core.models import User
from app.core.security import CSRF_COOKIE, DEVICE_COOKIE, SESSION_COOKIE, decode_session_jwt
from app.core.settings import Settings


async def get_current_user_optional(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User | None:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    try:
        session = decode_session_jwt(token, settings)
    except Exception:
        return None

    res = await db.execute(select(User).where(User.id == session.user_id))
    return res.scalar_one_or_none()


async def require_user(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Нужен вход в аккаунт.")
    return user


async def require_verified_user(user: Annotated[User, Depends(require_user)]) -> User:
    if not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Подтверди почту, чтобы генерировать.")
    return user


def require_csrf(request: Request) -> None:
    cookie = request.cookies.get(CSRF_COOKIE)
    header = request.headers.get("x-csrf-token")
    if not cookie or not header or cookie != header:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Неверная защита запроса.")


def get_device_id(request: Request) -> str | None:
    value = getattr(request.state, "device_id", None) or request.cookies.get(DEVICE_COOKIE)
    if not value:
        return None
    return str(value)


def parse_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail="Некорректный идентификатор.") from exc
