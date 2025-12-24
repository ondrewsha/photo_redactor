from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import urlencode

import httpx
import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_http, get_redis, get_settings
from app.core.cookies import clear_session_cookies, set_session_cookies
from app.core.models import TrialDevice, User, Wallet, WalletTransaction
from app.core.rate_limit import RateLimitExceededError, incr_with_ttl
from app.core.request_utils import get_client_ip
from app.core.security import create_session_jwt, new_token, sha256_hex
from app.core.settings import Settings

router = APIRouter(prefix="/auth/google", tags=["auth"])

OAUTH_STATE_COOKIE = "nv_oauth_state"


def _base_cookie_kwargs(settings: Settings) -> dict[str, object]:
    out: dict[str, object] = {
        "path": "/",
        "secure": bool(settings.cookie_secure),
        "samesite": "lax",
    }
    if settings.cookie_domain:
        out["domain"] = settings.cookie_domain
    return out


def _require_google_settings(settings: Settings) -> None:
    if not settings.google_client_id or not settings.google_client_secret or not settings.google_redirect_url:
        raise HTTPException(status_code=503, detail="Google-вход не настроен.")


async def _get_or_create_wallet(db: AsyncSession, user_id) -> Wallet:
    res = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = res.scalar_one_or_none()
    if wallet is None:
        wallet = Wallet(user_id=user_id, balance=0, trial_granted=False)
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
    return wallet


async def _maybe_grant_trial(
    *,
    request: Request,
    db: AsyncSession,
    redis_client: redis.Redis,
    settings: Settings,
    user: User,
) -> bool:
    wallet = await _get_or_create_wallet(db, user.id)
    if wallet.trial_granted:
        return False

    device_id = getattr(request.state, "device_id", None) or ""
    device_hash = sha256_hex(str(device_id))
    res = await db.execute(select(TrialDevice).where(TrialDevice.device_hash == device_hash))
    device_used = res.scalar_one_or_none() is not None

    ip = get_client_ip(request)
    ip_ok = True
    try:
        await incr_with_ttl(
            redis_client,
            key=f"nv:trial:{ip}:{datetime.now(timezone.utc).date().isoformat()}",
            ttl=timedelta(days=1),
            limit=settings.antifraud_trial_ip_daily_limit,
        )
    except RateLimitExceededError:
        ip_ok = False

    if device_used or not ip_ok:
        return False

    wallet.balance += 3
    wallet.trial_granted = True
    db.add(TrialDevice(device_hash=device_hash, first_user_id=user.id))
    db.add(WalletTransaction(user_id=user.id, delta=3, kind="trial", reference=None, comment="Приветственный бонус"))
    await db.commit()
    return True


@router.get("/start")
async def google_start(
    settings: Annotated[Settings, Depends(get_settings)],
) -> RedirectResponse:
    _require_google_settings(settings)
    state = new_token(nbytes=16)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_url,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    resp = RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)
    resp.set_cookie(OAUTH_STATE_COOKIE, state, httponly=True, max_age=600, **_base_cookie_kwargs(settings))
    return resp


@router.get("/callback")
async def google_callback(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    redis_client: Annotated[redis.Redis, Depends(get_redis)],
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
) -> RedirectResponse:
    _require_google_settings(settings)
    if error:
        redirect = RedirectResponse(url=f"{settings.frontend_base_url.rstrip('/')}/?google=bad", status_code=status.HTTP_302_FOUND)
        clear_session_cookies(redirect, settings=settings)
        redirect.delete_cookie(OAUTH_STATE_COOKIE, **_base_cookie_kwargs(settings))
        return redirect

    cookie_state = request.cookies.get(OAUTH_STATE_COOKIE)
    if not code or not state or not cookie_state or state != cookie_state:
        redirect = RedirectResponse(url=f"{settings.frontend_base_url.rstrip('/')}/?google=bad", status_code=status.HTTP_302_FOUND)
        redirect.delete_cookie(OAUTH_STATE_COOKIE, **_base_cookie_kwargs(settings))
        return redirect

    redirect_url = settings.google_redirect_url

    token_resp = await http.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": redirect_url,
            "grant_type": "authorization_code",
        },
        headers={"content-type": "application/x-www-form-urlencoded"},
    )
    token_resp.raise_for_status()
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not isinstance(access_token, str) or not access_token:
        raise HTTPException(status_code=502, detail="Google вернул некорректный ответ.")

    userinfo_resp = await http.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"authorization": f"Bearer {access_token}"},
    )
    userinfo_resp.raise_for_status()
    info = userinfo_resp.json()

    sub = info.get("sub")
    email = info.get("email")
    email_verified = bool(info.get("email_verified"))
    if not isinstance(sub, str) or not sub or not isinstance(email, str) or not email:
        raise HTTPException(status_code=502, detail="Google вернул некорректный ответ.")

    email_norm = email.strip().lower()

    created = False
    res = await db.execute(select(User).where(User.google_sub == sub))
    user = res.scalar_one_or_none()
    if user is None:
        res2 = await db.execute(select(User).where(User.email == email_norm))
        user = res2.scalar_one_or_none()
        if user is None:
            user = User(email=email_norm, password_hash=None, google_sub=sub, email_verified=True)
            db.add(user)
            await db.flush()
            db.add(Wallet(user_id=user.id, balance=0, trial_granted=False))
            created = True
        else:
            user.google_sub = sub
            if email_verified:
                user.email_verified = True

        await db.commit()
        await db.refresh(user)

    trial_granted = False
    if user.email_verified and created:
        trial_granted = await _maybe_grant_trial(request=request, db=db, redis_client=redis_client, settings=settings, user=user)

    session_jwt = create_session_jwt(user_id=user.id, settings=settings)
    csrf_token = new_token(nbytes=16)
    redirect = RedirectResponse(
        url=f"{settings.frontend_base_url.rstrip('/')}/?google=ok&trial={'1' if trial_granted else '0'}",
        status_code=status.HTTP_302_FOUND,
    )
    set_session_cookies(redirect, settings=settings, session_jwt=session_jwt, csrf_token=csrf_token)
    redirect.delete_cookie(OAUTH_STATE_COOKIE, **_base_cookie_kwargs(settings))
    return redirect
