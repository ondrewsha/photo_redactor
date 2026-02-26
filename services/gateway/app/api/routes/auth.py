from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth_deps import get_current_user_optional, require_csrf, require_user
from app.api.deps import get_db_session, get_redis, get_settings
from app.api.schemas import (
    AuthMeResponse,
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
)
from app.core.cookies import clear_session_cookies, set_session_cookies
from app.core.email import EmailConfigurationError, send_email
from app.core.models import EmailVerificationToken, TrialDevice, User, Wallet, WalletTransaction
from app.core.rate_limit import RateLimitExceededError, incr_with_ttl
from app.core.request_utils import get_client_ip
from app.core.security import create_session_jwt, hash_password, new_token, sha256_hex, verify_password
from app.core.settings import Settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _normalize_email(email: str) -> str:
    return email.strip().lower()


async def _get_wallet(db: AsyncSession, user_id) -> Wallet:
    res = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = res.scalar_one_or_none()
    if wallet is None:
        wallet = Wallet(user_id=user_id, balance=0, trial_granted=False)
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
    return wallet


async def _issue_verification_token(db: AsyncSession, *, user_id) -> str:
    token = new_token(nbytes=32)
    token_hash = sha256_hex(token)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    db.add(
        EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            used_at=None,
        )
    )
    await db.commit()
    return token


async def _send_verification_email(
    *,
    settings: Settings,
    to_email: str,
    token: str,
) -> None:
    base = settings.public_base_url.rstrip("/")
    verify_url = f"{base}/auth/verify-email?token={token}"
    subject = "Подтверждение почты для NanoVisual"
    text = (
        "Привет!\n\n"
        "Подтверди почту, чтобы пользоваться NanoVisual.\n\n"
        f"Ссылка: {verify_url}\n\n"
        "Если ты не регистрировался, просто проигнорируй это письмо."
    )
    html = (
        "<div style=\"font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5\">"
        "<h2 style=\"margin:0 0 12px\">Подтверждение почты</h2>"
        "<p style=\"margin:0 0 12px\">Нажми кнопку ниже, чтобы подтвердить почту и продолжить.</p>"
        f"<p style=\"margin:18px 0\"><a href=\"{verify_url}\" "
        "style=\"display:inline-block;padding:10px 14px;border-radius:10px;"
        "background:#ffffff;color:#111827;text-decoration:none;font-weight:700\">"
        "Подтвердить почту</a></p>"
        f"<p style=\"margin:0;color:#6b7280;font-size:12px\">Или открой ссылку: {verify_url}</p>"
        "</div>"
    )
    await send_email(settings=settings, to_email=to_email, subject=subject, text=text, html=html)


@router.post("/register", response_model=MessageResponse)
async def register(
    request: Request,
    payload: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    redis_client: Annotated[redis.Redis, Depends(get_redis)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> Response:
    ip = get_client_ip(request)
    try:
        await incr_with_ttl(
            redis_client,
            key=f"nv:reg:{ip}:{datetime.now(timezone.utc).date().isoformat()}",
            ttl=timedelta(days=1),
            limit=settings.antifraud_register_ip_daily_limit,
        )
    except RateLimitExceededError:
        raise HTTPException(status_code=429, detail="Слишком много регистраций. Попробуй позже.") from None

    email = _normalize_email(payload.email)
    password_hash_value = hash_password(payload.password)
    user = User(email=email, password_hash=password_hash_value, email_verified=False)
    try:
        async with db.begin():
            db.add(user)
            await db.flush()
            db.add(Wallet(user_id=user.id, balance=0, trial_granted=False))
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Эта почта уже зарегистрирована.") from None

    await db.refresh(user)

    try:
        token = await _issue_verification_token(db, user_id=user.id)
        await _send_verification_email(settings=settings, to_email=user.email, token=token)
    except EmailConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    session_jwt = create_session_jwt(user_id=user.id, settings=settings)
    csrf_token = new_token(nbytes=16)
    response = JSONResponse(content=MessageResponse(message="Готово. Проверь почту и подтверди адрес.").model_dump(mode="json"))
    set_session_cookies(response, settings=settings, session_jwt=session_jwt, csrf_token=csrf_token)
    return response


@router.post("/login", response_model=MessageResponse)
async def login(
    payload: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> Response:
    email = _normalize_email(payload.email)
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if user is None or not user.password_hash:
        raise HTTPException(status_code=401, detail="Неверная почта или пароль.")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверная почта или пароль.")

    session_jwt = create_session_jwt(user_id=user.id, settings=settings)
    csrf_token = new_token(nbytes=16)
    response = Response(
        content=MessageResponse(message="Вход выполнен.").model_dump_json(),
        media_type="application/json",
    )
    set_session_cookies(response, settings=settings, session_jwt=session_jwt, csrf_token=csrf_token)
    return response


@router.post("/logout", response_model=MessageResponse)
async def logout(settings: Annotated[Settings, Depends(get_settings)]) -> Response:
    response = Response(
        content=MessageResponse(message="Вы вышли из аккаунта.").model_dump_json(),
        media_type="application/json",
    )
    clear_session_cookies(response, settings=settings)
    return response


@router.get("/me", response_model=AuthMeResponse)
async def me(
    user: Annotated[User, Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthMeResponse:
    wallet = await _get_wallet(db, user.id)
    return AuthMeResponse(
        email=user.email,
        email_verified=user.email_verified,
        balance=wallet.balance,
        role=user.role,
    )


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    request: Request,
    user: Annotated[User, Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> MessageResponse:
    if user.email_verified:
        return MessageResponse(message="Почта уже подтверждена.")
    try:
        token = await _issue_verification_token(db, user_id=user.id)
        await _send_verification_email(settings=settings, to_email=user.email, token=token)
    except EmailConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return MessageResponse(message="Письмо отправлено. Проверь почту.")


@router.get("/verify-email")
async def verify_email(
    request: Request,
    token: Annotated[str, Query(min_length=10)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    redis_client: Annotated[redis.Redis, Depends(get_redis)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> Response:
    token_hash = sha256_hex(token)
    now = datetime.now(timezone.utc)
    res = await db.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
    )
    token_row = res.scalar_one_or_none()
    if token_row is None:
        return RedirectResponse(url=f"{settings.frontend_base_url.rstrip('/')}/?verify=bad", status_code=302)

    res_user = await db.execute(select(User).where(User.id == token_row.user_id))
    user = res_user.scalar_one_or_none()
    if user is None:
        return RedirectResponse(url=f"{settings.frontend_base_url.rstrip('/')}/?verify=bad", status_code=302)

    user.email_verified = True
    token_row.used_at = now

    wallet = await _get_wallet(db, user.id)

    trial_granted = False
    if not wallet.trial_granted:
        device_id = getattr(request.state, "device_id", None) or ""
        device_hash = sha256_hex(str(device_id))
        # Device-based one-time trial.
        existing_device = await db.execute(select(TrialDevice).where(TrialDevice.device_hash == device_hash))
        device_used = existing_device.scalar_one_or_none() is not None

        ip = get_client_ip(request)
        ip_ok = True
        try:
            await incr_with_ttl(
                redis_client,
                key=f"nv:trial:{ip}:{now.date().isoformat()}",
                ttl=timedelta(days=1),
                limit=settings.antifraud_trial_ip_daily_limit,
            )
        except RateLimitExceededError:
            ip_ok = False

        if (not device_used) and ip_ok:
            wallet.balance += 3
            wallet.trial_granted = True
            db.add(TrialDevice(device_hash=device_hash, first_user_id=user.id))
            db.add(WalletTransaction(user_id=user.id, delta=3, kind="trial", reference=None, comment="Приветственный бонус"))
            trial_granted = True

    await db.commit()

    session_jwt = create_session_jwt(user_id=user.id, settings=settings)
    csrf_token = new_token(nbytes=16)
    redirect = RedirectResponse(
        url=f"{settings.frontend_base_url.rstrip('/')}/?verify=ok&trial={'1' if trial_granted else '0'}",
        status_code=302,
    )
    set_session_cookies(redirect, settings=settings, session_jwt=session_jwt, csrf_token=csrf_token)
    return redirect


@router.post("/change-password", response_model=MessageResponse, dependencies=[Depends(require_csrf)])
async def change_password(
    payload: ChangePasswordRequest,
    user: Annotated[User, Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> MessageResponse:
    if not user.password_hash:
        raise HTTPException(status_code=400, detail="Пароль не задан для этого аккаунта.")
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Текущий пароль неверный.")
    user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return MessageResponse(message="Пароль обновлён.")
