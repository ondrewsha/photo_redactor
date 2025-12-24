from __future__ import annotations

from datetime import timedelta

from fastapi import Response

from app.core.security import CSRF_COOKIE, DEVICE_COOKIE, SESSION_COOKIE
from app.core.settings import Settings


def _base_cookie_kwargs(settings: Settings) -> dict[str, object]:
    out: dict[str, object] = {
        "path": "/",
        "secure": bool(settings.cookie_secure),
        "samesite": "lax",
    }
    if settings.cookie_domain:
        out["domain"] = settings.cookie_domain
    return out


def set_session_cookies(response: Response, *, settings: Settings, session_jwt: str, csrf_token: str) -> None:
    base = _base_cookie_kwargs(settings)
    max_age = int(timedelta(minutes=settings.jwt_ttl_minutes).total_seconds())

    response.set_cookie(
        SESSION_COOKIE,
        session_jwt,
        httponly=True,
        max_age=max_age,
        **base,
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        httponly=False,
        max_age=max_age,
        **base,
    )


def clear_session_cookies(response: Response, *, settings: Settings) -> None:
    base = _base_cookie_kwargs(settings)
    response.delete_cookie(SESSION_COOKIE, **base)
    response.delete_cookie(CSRF_COOKIE, **base)


def set_device_cookie(response: Response, *, settings: Settings, device_id: str) -> None:
    base = _base_cookie_kwargs(settings)
    # 1 year
    response.set_cookie(
        DEVICE_COOKIE,
        device_id,
        httponly=True,
        max_age=60 * 60 * 24 * 365,
        **base,
    )


def clear_device_cookie(response: Response, *, settings: Settings) -> None:
    base = _base_cookie_kwargs(settings)
    response.delete_cookie(DEVICE_COOKIE, **base)

