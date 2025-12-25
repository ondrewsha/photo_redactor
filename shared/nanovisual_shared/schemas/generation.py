from __future__ import annotations

from enum import Enum
from uuid import UUID

from pydantic import Field

from .common import BaseSchema


class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class CreateJobRequest(BaseSchema):
    prompt: str = Field(..., min_length=1)
    width: int = Field(1024, ge=64, le=4096)
    height: int = Field(1024, ge=64, le=4096)
    seed: int | None = Field(None, ge=0)


class CreateJobResponse(BaseSchema):
    job_id: UUID
    status: JobStatus = JobStatus.pending


class JobResult(BaseSchema):
    image_url: str = Field(..., min_length=1)
    mime_type: str = Field("image/png", min_length=1)
    width: int
    height: int


class JobStatusResponse(BaseSchema):
    job_id: UUID
    status: JobStatus
    progress: int = Field(0, ge=0, le=100)
    result: JobResult | None = None
    error_message: str | None = None
