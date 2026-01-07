from __future__ import annotations

from collections import defaultdict
from datetime import datetime
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth_deps import require_admin
from app.api.deps import get_db_session, get_redis, get_settings
from app.api.schemas import (
    AdminJobSummary,
    AdminJobsResponse,
    AdminMetricsResponse,
    AdminTransactionItem,
    AdminTransactionsResponse,
    AdminTransactionsSummary,
    AdminUserBalanceRequest,
    AdminUserStatusRequest,
    AdminUsersResponse,
    AdminUserSummary,
    MessageResponse,
)
from app.core.admin_metrics import collect_metrics
from app.core.models import (
    AdminActionLog,
    Payment,
    User,
    UserJobReservation,
    Wallet,
    WalletTransaction,
)
from app.core.settings import Settings

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _parse_uuid(value: str | None) -> uuid.UUID | None:
    if not value:
        return None
    try:
        return uuid.UUID(value)
    except ValueError:
        return None


def _user_summary(user: User, wallet: Wallet | None) -> AdminUserSummary:
    return AdminUserSummary(
        user_id=user.id,
        email=user.email,
        role=user.role,
        email_verified=user.email_verified,
        is_active=getattr(user, "is_active", True),
        balance=wallet.balance if wallet else 0,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


async def _log_admin_action(
    db: AsyncSession,
    *,
    admin_user: User,
    action: str,
    target_type: str | None = None,
    target_id: uuid.UUID | None = None,
    details: str | None = None,
) -> None:
    log_entry = AdminActionLog(
        admin_id=admin_user.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
    )
    db.add(log_entry)


async def _get_or_create_wallet(db: AsyncSession, user_id: uuid.UUID) -> Wallet:
    res = await db.execute(select(Wallet).where(Wallet.user_id == user_id).with_for_update())
    wallet = res.scalar_one_or_none()
    if wallet is None:
        wallet = Wallet(user_id=user_id, balance=0, trial_granted=False)
        db.add(wallet)
        await db.flush()
    return wallet


@router.get("/users", response_model=AdminUsersResponse)
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    email: str | None = Query(default=None),
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> AdminUsersResponse:
    offset = (page - 1) * limit
    filters: list = []
    if email:
        filters.append(User.email.ilike(f"%{email}%"))
    if role:
        filters.append(User.role == role)
    if is_active is not None and hasattr(User, "is_active"):
        filters.append(User.is_active == is_active)

    base_query = select(User)
    for cond in filters:
        base_query = base_query.where(cond)

    query = select(User, Wallet).outerjoin(Wallet, Wallet.user_id == User.id)
    for cond in filters:
        query = query.where(cond)

    total_res = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = total_res.scalar_one()
    res = await db.execute(query.order_by(User.created_at.desc()).offset(offset).limit(limit))
    results = res.all()
    return AdminUsersResponse(
        items=[_user_summary(user, wallet) for user, wallet in results],
        total=int(total),
        page=page,
        limit=limit,
    )


@router.post("/users/{user_id}/balance", response_model=AdminUserSummary)
async def adjust_balance(
    user_id: str,
    payload: AdminUserBalanceRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    admin_user: Annotated[User, Depends(require_admin)],
    action: Annotated[str | None, Header(alias="x-admin-action")] = None,
) -> AdminUserSummary:
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Некорректный идентификатор пользователя.")
    res = await db.execute(select(User).where(User.id == user_uuid))
    user = res.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден.")
    wallet = await _get_or_create_wallet(db, user_uuid)
    wallet.balance += payload.amount
    db.add(
        WalletTransaction(
            user_id=user_uuid,
            delta=payload.amount,
            kind="admin_adjust",
            reference=None,
            comment=payload.comment,
        )
    )
    await _log_admin_action(
        db,
        admin_user=admin_user,
        action=action or "adjust_balance",
        target_type="user",
        target_id=user_uuid,
        details=payload.comment or str(payload.amount),
    )
    await db.commit()
    await db.refresh(user)
    await db.refresh(wallet)
    return _user_summary(user, wallet)


@router.post("/users/{user_id}/status", response_model=AdminUserSummary)
async def set_user_status(
    user_id: str,
    payload: AdminUserStatusRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    admin_user: Annotated[User, Depends(require_admin)],
    action: Annotated[str | None, Header(alias="x-admin-action")] = None,
) -> AdminUserSummary:
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Некорректный идентификатор пользователя.")
    res = await db.execute(select(User).where(User.id == user_uuid))
    user = res.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден.")
    user.is_active = payload.is_active
    await _log_admin_action(
        db,
        admin_user=admin_user,
        action=action or "set_user_status",
        target_type="user",
        target_id=user_uuid,
        details=str(payload.is_active),
    )
    await db.commit()
    await db.refresh(user)
    wallet = await _get_or_create_wallet(db, user_uuid)
    await db.refresh(wallet)
    return _user_summary(user, wallet)


@router.get("/transactions", response_model=AdminTransactionsResponse)
async def list_transactions(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    kind: str | None = Query(default=None),
    email: str | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> AdminTransactionsResponse:
    offset = (page - 1) * limit
    query = (
        select(WalletTransaction, User.email)
        .join(User, WalletTransaction.user_id == User.id)
    )
    if kind:
        query = query.where(WalletTransaction.kind == kind)
    if email:
        query = query.where(User.email.ilike(f"%{email}%"))
    if start_date:
        query = query.where(WalletTransaction.created_at >= start_date)
    if end_date:
        query = query.where(WalletTransaction.created_at <= end_date)
    res = await db.execute(query.order_by(WalletTransaction.created_at.desc()).offset(offset).limit(limit))
    rows = res.all()
    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = int(total_res.scalar_one())
    reference_ids = {_parse_uuid(record.reference) for record, _ in rows if record.reference}
    reference_ids.discard(None)
    amount_map: dict[uuid.UUID, int] = {}
    if reference_ids:
        payment_res = await db.execute(
            select(Payment.id, Payment.amount_kopecks).where(Payment.id.in_(reference_ids))
        )
        for pid, amount in payment_res.all():
            amount_map[pid] = amount
    items: list[AdminTransactionItem] = []
    by_kind: dict[str, int] = defaultdict(int)
    total_amount = 0
    for record, user_email in rows:
        ref_id = _parse_uuid(record.reference)
        amount = amount_map.get(ref_id) if ref_id else None
        amount_rub = int(amount // 100) if amount is not None else None
        items.append(
            AdminTransactionItem(
                transaction_id=record.id,
                email=user_email,
                delta=record.delta,
                kind=record.kind,
                comment=record.comment,
                amount_rub=amount_rub,
                created_at=record.created_at,
            )
        )
        by_kind[record.kind] += 1
        if amount_rub is not None:
            total_amount += amount_rub
    summary = AdminTransactionsSummary(
        by_kind=dict(by_kind),
        total_amount=total_amount,
        total_count=len(items),
    )
    return AdminTransactionsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        summary=summary,
    )


@router.get("/jobs", response_model=AdminJobsResponse)
async def list_jobs(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    status: str | None = Query(default=None),
    email: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> AdminJobsResponse:
    offset = (page - 1) * limit
    base_query = (
        select(UserJobReservation, User.email)
        .join(User, UserJobReservation.user_id == User.id)
    )
    if status:
        base_query = base_query.where(UserJobReservation.status == status)
    if email:
        base_query = base_query.where(User.email.ilike(f"%{email}%"))
    res = await db.execute(base_query.order_by(UserJobReservation.created_at.desc()).offset(offset).limit(limit))
    rows = res.all()
    total_res = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = int(total_res.scalar_one())
    backlog_res = await db.execute(
        select(UserJobReservation.status, func.count()).group_by(UserJobReservation.status)
    )
    backlog = {status: int(count) for status, count in backlog_res.all()}
    items = [
        AdminJobSummary(
            reservation_id=row.id,
            job_id=row.job_id,
            status=row.status,
            user_email=user_email,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row, user_email in rows
    ]
    return AdminJobsResponse(items=items, total=total, page=page, limit=limit, backlog=backlog)


@router.post("/jobs/{job_id}/rerun", response_model=MessageResponse)
async def rerun_job(
    job_id: str,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
    redis_client: Annotated[Redis, Depends(get_redis)],
    admin_user: Annotated[User, Depends(require_admin)],
    action: Annotated[str | None, Header(alias="x-admin-action")] = None,
) -> MessageResponse:
    job_uuid = _parse_uuid(job_id)
    if job_uuid is None:
        raise HTTPException(status_code=422, detail="Некорректный идентификатор задачи.")
    res = await db.execute(
        select(UserJobReservation).where(UserJobReservation.job_id == job_uuid).with_for_update()
    )
    reservation = res.scalar_one_or_none()
    if reservation is None:
        raise HTTPException(status_code=404, detail="Задача не найдена.")
    reservation.status = "reserved"
    await _log_admin_action(
        db,
        admin_user=admin_user,
        action=action or "job_rerun",
        target_type="job",
        target_id=job_uuid,
        details="Повторная постановка в очередь",
    )
    await db.commit()
    await redis_client.rpush(settings.queue_key, str(job_uuid))
    return MessageResponse(message="Задача помечена как повторная.")


@router.post("/jobs/{job_id}/cancel", response_model=MessageResponse)
async def cancel_job(
    job_id: str,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    admin_user: Annotated[User, Depends(require_admin)],
    action: Annotated[str | None, Header(alias="x-admin-action")] = None,
) -> MessageResponse:
    job_uuid = _parse_uuid(job_id)
    if job_uuid is None:
        raise HTTPException(status_code=422, detail="Некорректный идентификатор задачи.")
    res = await db.execute(
        select(UserJobReservation).where(UserJobReservation.job_id == job_uuid).with_for_update()
    )
    reservation = res.scalar_one_or_none()
    if reservation is None:
        raise HTTPException(status_code=404, detail="Задача не найдена.")
    reservation.status = "cancelled"
    await _log_admin_action(
        db,
        admin_user=admin_user,
        action=action or "job_cancel",
        target_type="job",
        target_id=job_uuid,
        details="Отмена задачи",
    )
    await db.commit()
    return MessageResponse(message="Задача отменена.")


@router.get("/metrics", response_model=AdminMetricsResponse)
async def admin_metrics(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    redis_client: Annotated[Redis, Depends(get_redis)],
) -> AdminMetricsResponse:
    metrics = await collect_metrics(redis_client=redis_client, db=db)
    return AdminMetricsResponse(**metrics)
