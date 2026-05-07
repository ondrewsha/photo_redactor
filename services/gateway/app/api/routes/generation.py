from __future__ import annotations

from typing import Annotated
import uuid

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from motor.motor_asyncio import AsyncIOMotorCollection

from nanovisual_shared.schemas import ComposePromptRequest, ComposePromptResponse, CreateJobRequest, CreateJobResponse, JobStatusResponse, PromptMode

from app.api.auth_deps import parse_uuid, require_csrf, require_verified_user
from app.api.deps import get_db_session, get_redis, get_http, get_settings
from app.api.deps import get_history_collection
from app.api.schemas import GenerateImageRequest, GenerateImageResponse
from app.api.upstream import forward_headers
from app.core.admin_metrics import record_generation
from app.core.history import create_history_entry, finalize_history_entry
from app.core.models import User, UserJobReservation, Wallet, WalletTransaction
from app.core.settings import Settings

router = APIRouter()


async def _get_or_create_wallet_for_update(db: AsyncSession, *, user_id: uuid.UUID) -> Wallet:
    res = await db.execute(select(Wallet).where(Wallet.user_id == user_id).with_for_update())
    wallet = res.scalar_one_or_none()
    if wallet is not None:
        return wallet
    wallet = Wallet(user_id=user_id, balance=0, trial_granted=False)
    db.add(wallet)
    await db.flush()
    return wallet


async def _reserve_generation(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    redis_client: Redis,
) -> uuid.UUID:
    try:
        wallet = await _get_or_create_wallet_for_update(db, user_id=user_id)
        if wallet.balance <= 0:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Закончились генерации. Купи пакет, чтобы продолжить.",
            )
        wallet.balance -= 1
        db.add(WalletTransaction(user_id=user_id, delta=-1, kind="generation", reference=None, comment="Генерация"))
        reservation = UserJobReservation(user_id=user_id, job_id=None, status="reserved")
        db.add(reservation)
        await db.commit()
        await db.refresh(reservation)
        await record_generation(redis_client, count=1)
        return reservation.id
    except HTTPException:
        await db.rollback()
        raise
    except Exception:  # noqa: BLE001
        await db.rollback()
        raise


async def _link_job_to_reservation(
    db: AsyncSession,
    *,
    reservation_id: uuid.UUID,
    job_id: uuid.UUID,
) -> None:
    try:
        res = await db.execute(select(UserJobReservation).where(UserJobReservation.id == reservation_id).with_for_update())
        reservation = res.scalar_one()
        reservation.job_id = job_id
        reservation.status = "active"
        await db.commit()
    except Exception:  # noqa: BLE001
        await db.rollback()
        raise


async def _refund_reservation(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    reservation_id: uuid.UUID,
    comment: str,
) -> None:
    try:
        res = await db.execute(select(UserJobReservation).where(UserJobReservation.id == reservation_id).with_for_update())
        reservation = res.scalar_one_or_none()
        if reservation is None:
            await db.commit()
            return
        if reservation.status == "refunded":
            await db.commit()
            return
        wallet = await _get_or_create_wallet_for_update(db, user_id=user_id)
        wallet.balance += 1
        reservation.status = "refunded"
        db.add(
            WalletTransaction(
                user_id=user_id,
                delta=1,
                kind="refund",
                reference=str(reservation.job_id) if reservation.job_id else None,
                comment=comment,
            )
        )
        await db.commit()
    except Exception:  # noqa: BLE001
        await db.rollback()
        raise


@router.post("/generate", response_model=GenerateImageResponse)
async def generate(
    request: Request,
    payload: GenerateImageRequest,
    user: Annotated[User, Depends(require_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
    history_collection: AsyncIOMotorCollection = Depends(get_history_collection),
    redis_client: Redis = Depends(get_redis),
) -> GenerateImageResponse:
    require_csrf(request)
    reservation_id = await _reserve_generation(db, user_id=user.id, redis_client=redis_client)
    style_ids = payload.style_ids or ["none"]
    try:
        composed = await http.post(
            f"{settings.prompt_service_url.rstrip('/')}/compose",
            headers=forward_headers(request, settings),
            json=ComposePromptRequest(
                style_ids=style_ids,
                user_input=payload.user_input,
                mode=PromptMode.enhance,
            ).model_dump(mode="json"),
        )
        composed.raise_for_status()
        composed_data = ComposePromptResponse.model_validate(composed.json())

        job = await http.post(
            f"{settings.generation_service_url.rstrip('/')}/jobs",
            headers=forward_headers(request, settings),
            json=CreateJobRequest(
                prompt=composed_data.final_prompt,
                width=payload.width,
                height=payload.height,
            ).model_dump(mode="json"),
        )
        job.raise_for_status()
        job_data: CreateJobResponse = CreateJobResponse.model_validate(job.json())
        await create_history_entry(
            collection=history_collection,
            job_id=str(job_data.job_id),
            user_id=str(user.id),
            user_prompt=payload.user_input,
            final_prompt=composed_data.final_prompt,
            style_ids=style_ids,
            width=payload.width,
            height=payload.height,
            project_id=payload.project_id,
        )
        await _link_job_to_reservation(db, reservation_id=reservation_id, job_id=uuid.UUID(str(job_data.job_id)))
        return GenerateImageResponse(job_id=str(job_data.job_id), status=job_data.status)
    except Exception:  # noqa: BLE001 - refund + re-raise
        await _refund_reservation(db, user_id=user.id, reservation_id=reservation_id, comment="Возврат: не удалось создать задачу")
        raise


@router.post("/generate/image", response_model=GenerateImageResponse)
async def generate_with_image(
    request: Request,
    user_input: str = Form(...),
    image: list[UploadFile] = File(...),
    style_ids: list[str] | None = Form(None),
    width: int = Form(1024),
    height: int = Form(1024),
    project_id: str | None = Form(None),
    preserve_face: bool = Form(True),
    user: User = Depends(require_verified_user),
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    http: httpx.AsyncClient = Depends(get_http),
    history_collection: AsyncIOMotorCollection = Depends(get_history_collection),
    redis_client: Redis = Depends(get_redis),
) -> GenerateImageResponse:
    require_csrf(request)
    reservation_id = await _reserve_generation(db, user_id=user.id, redis_client=redis_client)
    cleaned_style_ids = [s.strip() for s in (style_ids or []) if isinstance(s, str) and s.strip()] or ["none"]

    try:
        composed = await http.post(
            f"{settings.prompt_service_url.rstrip('/')}/compose",
            headers=forward_headers(request, settings),
            json=ComposePromptRequest(
                style_ids=cleaned_style_ids,
                user_input=user_input,
                mode=PromptMode.enhance,
                preserve_face=preserve_face,
            ).model_dump(mode="json"),
        )
        composed.raise_for_status()
        composed_data = ComposePromptResponse.model_validate(composed.json())

        images = image[:4]
        files: list[tuple[str, tuple[str, bytes, str]]] = []
        for idx, img in enumerate(images):
            image_bytes = await img.read()
            files.append(
                (
                    "image",
                    (
                        img.filename or f"image_{idx}",
                        image_bytes,
                        img.content_type or "application/octet-stream",
                    ),
                )
            )
        data = {"prompt": composed_data.final_prompt, "width": str(width), "height": str(height)}
        job = await http.post(
            f"{settings.generation_service_url.rstrip('/')}/jobs/image",
            headers=forward_headers(request, settings),
            data=data,
            files=files,
        )
        job.raise_for_status()
        job_data: CreateJobResponse = CreateJobResponse.model_validate(job.json())
        await create_history_entry(
            collection=history_collection,
            job_id=str(job_data.job_id),
            user_id=str(user.id),
            user_prompt=user_input,
            final_prompt=composed_data.final_prompt,
            style_ids=cleaned_style_ids,
            width=width,
            height=height,
            project_id=project_id,
        )
        await _link_job_to_reservation(db, reservation_id=reservation_id, job_id=uuid.UUID(str(job_data.job_id)))
        return GenerateImageResponse(job_id=str(job_data.job_id), status=job_data.status)
    except Exception:  # noqa: BLE001
        await _refund_reservation(db, user_id=user.id, reservation_id=reservation_id, comment="Возврат: не удалось создать задачу")
        raise


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def job_status(
    request: Request,
    job_id: str,
    user: Annotated[User, Depends(require_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
    history_collection: AsyncIOMotorCollection = Depends(get_history_collection),
) -> JobStatusResponse:
    job_uuid = parse_uuid(job_id)
    res = await db.execute(
        select(UserJobReservation).where(
            UserJobReservation.user_id == user.id,
            UserJobReservation.job_id == job_uuid,
        )
    )
    reservation = res.scalar_one_or_none()
    if reservation is None:
        raise HTTPException(status_code=404, detail="Задача не найдена.")

    resp = await http.get(
        f"{settings.generation_service_url.rstrip('/')}/jobs/{job_id}",
        headers=forward_headers(request, settings),
    )
    resp.raise_for_status()
    data = JobStatusResponse.model_validate(resp.json())

    if data.status.value == "failed" and reservation.status != "refunded":
        await _refund_reservation(db, user_id=user.id, reservation_id=reservation.id, comment="Возврат: генерация завершилась с ошибкой")
    elif data.status.value == "completed" and reservation.status != "finalized":
        try:
            res2 = await db.execute(select(UserJobReservation).where(UserJobReservation.id == reservation.id).with_for_update())
            locked = res2.scalar_one_or_none()
            if locked is not None and locked.status not in {"finalized", "refunded"}:
                locked.status = "finalized"
            await db.commit()
        except Exception:  # noqa: BLE001
            await db.rollback()
            raise
    if data.status.value == "completed" and data.result and data.result.image_url:
        await finalize_history_entry(
            collection=history_collection,
            job_id=job_id,
            image_url=data.result.image_url,
        )

    return data


@router.get("/media/{path:path}")
async def media_proxy(
    request: Request,
    path: str,
    user: Annotated[User, Depends(require_verified_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
) -> Response:
    file_name = path.rsplit("/", 1)[-1]
    stem = file_name.split(".", 1)[0]

    if not stem.startswith("gallery_"):
        try:
            job_uuid = parse_uuid(stem)
        except HTTPException:
            raise HTTPException(status_code=404, detail="Файл не найден.") from None
        res = await db.execute(
            select(UserJobReservation.id).where(
                UserJobReservation.user_id == user.id,
                UserJobReservation.job_id == job_uuid,
            )
        )
        if res.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Файл не найден.")

    upstream = f"{settings.generation_service_url.rstrip('/')}/media/{path}"
    upstream_stream = http.stream("GET", upstream, headers=forward_headers(request, settings))
    upstream_resp = await upstream_stream.__aenter__()
    if upstream_resp.status_code >= 400:
        body = await upstream_resp.aread()
        await upstream_stream.__aexit__(None, None, None)
        return Response(
            status_code=upstream_resp.status_code,
            content=body,
            headers={
                "access-control-allow-origin": settings.frontend_base_url or "*",
                "access-control-allow-credentials": "true",
            },
        )

    content_type = upstream_resp.headers.get("content-type", "application/octet-stream")
    cache_control = upstream_resp.headers.get("cache-control", "public, max-age=31536000")
    content_length = upstream_resp.headers.get("content-length")

    async def body_iter():  # type: ignore[no-untyped-def]
        try:
            async for chunk in upstream_resp.aiter_bytes():
                yield chunk
        finally:
            await upstream_stream.__aexit__(None, None, None)

    headers: dict[str, str] = {
        "cache-control": cache_control,
        "access-control-allow-origin": settings.frontend_base_url or "*",
        "access-control-allow-credentials": "true",
    }
    if content_length:
        headers["content-length"] = content_length

    return StreamingResponse(body_iter(), media_type=content_type, headers=headers)
