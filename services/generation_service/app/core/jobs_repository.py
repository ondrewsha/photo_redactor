from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nanovisual_shared.schemas import JobResult, JobStatus, JobStatusResponse

from app.core.errors import JobNotFoundError
from app.core.models import Job


async def create_job(
    *,
    db: AsyncSession,
    prompt: str,
    width: int,
    height: int,
    seed: int | None,
) -> Job:
    job = Job(
        status=JobStatus.pending,
        progress=0,
        prompt=prompt,
        width=width,
        height=height,
        seed=seed,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


def _public_image_url(public_base_url: str, file_name: str) -> str:
    base = public_base_url.rstrip("/")
    if base:
        return f"{base}/media/{file_name}"
    return f"/media/{file_name}"


async def get_job(db: AsyncSession, job_id: UUID) -> Job:
    res = await db.execute(select(Job).where(Job.id == job_id))
    job = res.scalar_one_or_none()
    if job is None:
        raise JobNotFoundError(job_id)
    return job


async def get_job_status_response(
    *,
    db: AsyncSession,
    job_id: UUID,
    public_base_url: str,
) -> JobStatusResponse:
    job = await get_job(db, job_id)

    result: JobResult | None = None
    if job.status == JobStatus.completed and job.result_file_name and job.result_mime_type:
        result = JobResult(
            image_url=_public_image_url(public_base_url, job.result_file_name),
            mime_type=job.result_mime_type,
            width=job.width,
            height=job.height,
        )

    return JobStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        result=result,
        error_message=job.error_message,
    )


async def mark_processing(db: AsyncSession, job_id: UUID, progress: int) -> None:
    job = await get_job(db, job_id)
    job.status = JobStatus.processing
    job.progress = progress
    job.error_message = None
    await db.commit()


async def mark_completed(
    db: AsyncSession,
    *,
    job_id: UUID,
    file_name: str,
    mime_type: str,
) -> None:
    job = await get_job(db, job_id)
    job.status = JobStatus.completed
    job.progress = 100
    job.result_file_name = file_name
    job.result_mime_type = mime_type
    job.error_message = None
    await db.commit()


async def mark_failed(db: AsyncSession, *, job_id: UUID, error_message: str) -> None:
    job = await get_job(db, job_id)
    job.status = JobStatus.failed
    job.progress = 100
    job.error_message = error_message
    await db.commit()
