from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from yookassa import Configuration as YooConfiguration
from yookassa import Payment as YooPayment

from app.api.auth_deps import parse_uuid, require_csrf, require_user
from app.api.deps import get_db_session, get_redis, get_settings
from app.api.schemas import (
    BillingHistoryResponse,
    BillingHistoryItem,
    BillingQuoteResponse,
    CreatePaymentRequest,
    CreatePaymentResponse,
)
from app.core.admin_metrics import record_revenue, record_webhook
from app.core.models import Payment, User, Wallet, WalletTransaction
from app.core.security import new_token
from app.core.settings import Settings
from app.core.pricing import calculate_unit_price
from redis.asyncio import Redis

router = APIRouter(prefix="/billing", tags=["billing"])


def _quote(count: int) -> BillingQuoteResponse:
    unit = calculate_unit_price(count)
    return BillingQuoteResponse(
        count=count,
        currency="RUB",
        unit_price_rub=unit,
        total_price_rub=unit * count,
        suggestions=[1, 10, 50, 200, 500, 1000],
    )


def _parse_uuid(value: str | None) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(value)
    except ValueError:
        return None


async def _get_or_create_wallet_for_update(db: AsyncSession, *, user_id) -> Wallet:
    res = await db.execute(select(Wallet).where(Wallet.user_id == user_id).with_for_update())
    wallet = res.scalar_one_or_none()
    if wallet is not None:
        return wallet
    wallet = Wallet(user_id=user_id, balance=0, trial_granted=False)
    db.add(wallet)
    await db.flush()
    return wallet


async def _apply_success_payment(
    db: AsyncSession,
    *,
    payment_id,
    provider_payment_id: str | None,
    redis_client: Redis | None = None,
) -> Payment:
    now = datetime.now(timezone.utc)
    res = await db.execute(select(Payment).where(Payment.id == payment_id).with_for_update())
    payment = res.scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=404, detail="Платёж не найден.")

    if payment.status == "succeeded":
        await db.commit()
        return payment

    payment.status = "succeeded"
    payment.paid_at = now
    if provider_payment_id:
        payment.provider_payment_id = provider_payment_id

    wallet = await _get_or_create_wallet_for_update(db, user_id=payment.user_id)
    wallet.balance += payment.generation_count
    db.add(
        WalletTransaction(
            user_id=payment.user_id,
            delta=payment.generation_count,
            kind="purchase",
            reference=str(payment.id),
            comment="Покупка генераций",
        )
    )
    await db.commit()
    await db.refresh(payment)
    amount_rub = int(payment.amount_kopecks // 100)
    if redis_client:
        await record_revenue(redis_client, amount_rub)
    return payment


def _require_yookassa_settings(settings: Settings) -> None:
    if not settings.yookassa_shop_id or not settings.yookassa_secret_key:
        raise HTTPException(status_code=503, detail="YooKassa не настроена.")


async def _create_yookassa_payment(
    *,
    settings: Settings,
    amount_kopecks: int,
    currency: str,
    description: str,
    return_url: str,
    idempotency_key: str,
    metadata: dict[str, str],
) -> tuple[str, str]:
    _require_yookassa_settings(settings)

    def _call() -> tuple[str, str]:
        YooConfiguration.account_id = settings.yookassa_shop_id
        YooConfiguration.secret_key = settings.yookassa_secret_key
        amount_value = str((Decimal(amount_kopecks) / Decimal(100)).quantize(Decimal("0.01")))
        payment = YooPayment.create(
            {
                "amount": {"value": amount_value, "currency": currency},
                "confirmation": {"type": "redirect", "return_url": return_url},
                "capture": True,
                "description": description,
                "metadata": metadata,
            },
            idempotency_key,
        )
        confirmation_url = getattr(getattr(payment, "confirmation", None), "confirmation_url", None)
        if not isinstance(confirmation_url, str) or not confirmation_url:
            raise RuntimeError("YooKassa не вернула ссылку на оплату.")
        provider_id = getattr(payment, "id", None)
        if not isinstance(provider_id, str) or not provider_id:
            raise RuntimeError("YooKassa не вернула id платежа.")
        return provider_id, confirmation_url

    return await asyncio.to_thread(_call)


@router.get("/quote", response_model=BillingQuoteResponse)
async def quote(count: Annotated[int, Query(ge=1, le=1000)] = 10) -> BillingQuoteResponse:
    return _quote(count)


@router.post("/pay", response_model=CreatePaymentResponse, dependencies=[Depends(require_csrf)])
async def pay(
    request: Request,
    payload: CreatePaymentRequest,
    user: Annotated[User, Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CreatePaymentResponse:
    quote = _quote(payload.generation_count)
    idempotency_key = request.headers.get("idempotency-key") or new_token(nbytes=16)

    payment = Payment(
        user_id=user.id,
        provider=settings.payment_provider,
        provider_payment_id=None,
        status="pending",
        generation_count=quote.count,
        amount_kopecks=quote.total_price_rub * 100,
        currency=quote.currency,
        confirmation_url=None,
        idempotency_key=idempotency_key,
    )
    db.add(payment)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        res = await db.execute(select(Payment).where(Payment.idempotency_key == idempotency_key))
        existing = res.scalar_one_or_none()
        if existing is None or existing.user_id != user.id:
            raise HTTPException(status_code=409, detail="Не удалось создать платёж. Попробуй ещё раз.") from None
        return CreatePaymentResponse(
            payment_id=str(existing.id),
            status=existing.status,
            confirmation_url=existing.confirmation_url,
            generation_count=existing.generation_count,
            amount_rub=int(existing.amount_kopecks // 100),
            currency=existing.currency,
        )

    await db.refresh(payment)

    if settings.payment_provider == "mock":
        payment.provider_payment_id = f"mock_{payment.id}"
        payment.confirmation_url = f"{settings.public_base_url.rstrip('/')}/billing/mock/confirm?payment_id={payment.id}"
    elif settings.payment_provider == "yookassa":
        return_url = settings.yookassa_return_url or f"{settings.frontend_base_url.rstrip('/')}/?pay=return"
        provider_id, confirmation_url = await _create_yookassa_payment(
            settings=settings,
            amount_kopecks=payment.amount_kopecks,
            currency=payment.currency,
            description=f"Пакет генераций NanoVisual: {payment.generation_count} шт.",
            return_url=return_url,
            idempotency_key=payment.idempotency_key,
            metadata={"payment_id": str(payment.id), "user_id": str(payment.user_id)},
        )
        payment.provider_payment_id = provider_id
        payment.confirmation_url = confirmation_url
    else:
        raise HTTPException(status_code=500, detail="Платёжный провайдер не поддерживается.")

    await db.commit()
    await db.refresh(payment)

    return CreatePaymentResponse(
        payment_id=str(payment.id),
        status=payment.status,
        confirmation_url=payment.confirmation_url,
        generation_count=payment.generation_count,
        amount_rub=int(payment.amount_kopecks // 100),
        currency=payment.currency,
    )


@router.get("/history", response_model=BillingHistoryResponse)
async def history(
    user: Annotated[User, Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    page: Annotated[int, Query(ge=1)] = 1,
) -> BillingHistoryResponse:
    res = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.user_id == user.id)
        .order_by(WalletTransaction.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    items = res.scalars().all()
    total_res = await db.execute(
        select(func.count()).where(WalletTransaction.user_id == user.id)
    )
    total = int(total_res.scalar_one())
    reference_ids = {_parse_uuid(item.reference) for item in items}
    reference_ids.discard(None)
    amount_map: dict[UUID, int] = {}
    if reference_ids:
        ref_res = await db.execute(
            select(Payment.id, Payment.amount_kopecks).where(Payment.id.in_(reference_ids))
        )
        for pid, amount in ref_res.all():
            amount_map[pid] = amount
    history_items: list[BillingHistoryItem] = []
    for item in items:
        ref = _parse_uuid(item.reference)
        amount = amount_map.get(ref) if ref else None
        amount_rub = int(amount // 100) if amount is not None else None
        history_items.append(
            BillingHistoryItem(
                transaction_id=str(item.id),
                delta=item.delta,
                kind=item.kind,
                comment=item.comment,
                created_at=item.created_at,
                amount_rub=amount_rub,
            )
        )
    return BillingHistoryResponse(items=history_items, total=total, page=page, limit=limit)


@router.get("/mock/confirm")
async def mock_confirm(
    payment_id: Annotated[str, Query(min_length=10)],
    user: Annotated[User, Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
    redis_client: Annotated[Redis, Depends(get_redis)],
) -> RedirectResponse:
    if settings.payment_provider != "mock":
        raise HTTPException(status_code=404, detail="Не найдено.")
    pid = parse_uuid(payment_id)
    res = await db.execute(select(Payment).where(Payment.id == pid, Payment.user_id == user.id))
    payment = res.scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=404, detail="Платёж не найден.")
    await _apply_success_payment(
        db,
        payment_id=payment.id,
        provider_payment_id=payment.provider_payment_id,
        redis_client=redis_client,
    )
    await record_webhook(redis_client, success=True)
    return RedirectResponse(url=f"{settings.frontend_base_url.rstrip('/')}/?pay=ok", status_code=status.HTTP_302_FOUND)


@router.post("/webhook/yookassa")
async def yookassa_webhook(
    request: Request,
    secret: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    redis_client: Annotated[Redis, Depends(get_redis)],
) -> dict[str, str]:
    if settings.payment_provider != "yookassa":
        raise HTTPException(status_code=404, detail="Не найдено.")
    if settings.yookassa_webhook_secret:
        if not secret or secret != settings.yookassa_webhook_secret:
            raise HTTPException(status_code=401, detail="Неверный секрет.")

    payload = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Некорректный запрос.")

    event = payload.get("event")
    obj = payload.get("object") if isinstance(payload.get("object"), dict) else None
    provider_id = obj.get("id") if obj is not None else None
    status_val = obj.get("status") if obj is not None else None

    if event != "payment.succeeded" or not isinstance(provider_id, str) or status_val != "succeeded":
        return {"status": "ignored"}

    res = await db.execute(select(Payment).where(Payment.provider == "yookassa", Payment.provider_payment_id == provider_id))
    payment = res.scalar_one_or_none()
    if payment is None:
        return {"status": "ignored"}

    await _apply_success_payment(
        db,
        payment_id=payment.id,
        provider_payment_id=provider_id,
        redis_client=redis_client,
    )
    await record_webhook(redis_client, success=True)
    return {"status": "ok"}
