from __future__ import annotations

import asyncio
from typing import Annotated
from pathlib import Path
from uuid import UUID

import redis.asyncio as redis
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from nanovisual_shared.schemas import (
    CreateJobRequest,
    CreateJobResponse,
    GenerationCapabilities,
    HealthResponse,
    JobStatusResponse,
)

from app.api.deps import get_db_session, get_redis, get_settings, require_internal_token
from app.core.capabilities import build_generation_capabilities
from app.core.errors import QueueUnavailableError
from app.core.jobs_repository import create_job, get_job_status_response, mark_failed
from app.core.settings import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@router.get(
    "/capabilities",
    response_model=GenerationCapabilities,
    dependencies=[Depends(require_internal_token)],
)
async def capabilities(
    settings: Annotated[Settings, Depends(get_settings)],
) -> GenerationCapabilities:
    return build_generation_capabilities(settings=settings)


@router.post(
    "/jobs",
    response_model=CreateJobResponse,
    dependencies=[Depends(require_internal_token)],
)
async def create_generation_job(
    payload: CreateJobRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    redis_client: Annotated[redis.Redis, Depends(get_redis)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CreateJobResponse:
    job = await create_job(
        db=db,
        prompt=payload.prompt,
        width=payload.width,
        height=payload.height,
        seed=payload.seed,
    )
    try:
        await redis_client.rpush(settings.queue_key, str(job.id))
    except Exception as exc:  # noqa: BLE001 - convert infra failure to API error
        await mark_failed(
            db=db,
            job_id=job.id,
            error_message="Очередь генерации временно недоступна. Попробуйте позже.",
        )
        raise QueueUnavailableError("Queue unavailable") from exc

    return CreateJobResponse(job_id=job.id, status=job.status)


@router.post(
    "/jobs/image",
    response_model=CreateJobResponse,
    dependencies=[Depends(require_internal_token)],
)
async def create_generation_job_with_image(
    prompt: str = Form(...),
    width: int = Form(1024),
    height: int = Form(1024),
    image: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db_session),
    redis_client: redis.Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> CreateJobResponse:
    job = await create_job(
        db=db,
        prompt=prompt,
        width=width,
        height=height,
        seed=None,
    )

    images = image[:4]
    inputs_dir = Path(settings.media_root) / "inputs" / str(job.id)
    inputs_dir.mkdir(parents=True, exist_ok=True)
    for idx, img in enumerate(images):
        content = await img.read()
        await asyncio.to_thread((inputs_dir / f"{idx}").write_bytes, content)

    try:
        await redis_client.rpush(settings.queue_key, str(job.id))
    except Exception as exc:  # noqa: BLE001 - convert infra failure to API error
        await mark_failed(
            db=db,
            job_id=job.id,
            error_message="Очередь генерации временно недоступна. Попробуйте позже.",
        )
        raise QueueUnavailableError("Queue unavailable") from exc

    return CreateJobResponse(job_id=job.id, status=job.status)


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    dependencies=[Depends(require_internal_token)],
)
async def get_job_status(
    job_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> JobStatusResponse:
    return await get_job_status_response(db=db, job_id=job_id, public_base_url=settings.public_base_url)
