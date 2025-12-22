from __future__ import annotations

from pydantic import Field, model_validator

from nanovisual_shared.schemas import BaseSchema, JobStatus


class GenerateImageRequest(BaseSchema):
    style_ids: list[str] = Field(default_factory=list, description="One or more style ids.")
    # Backward-compatible field (deprecated): use style_ids instead.
    style_id: str | None = Field(default=None)
    user_input: str = Field(..., min_length=1)
    width: int = Field(1024, ge=64, le=2048)
    height: int = Field(1024, ge=64, le=2048)

    @model_validator(mode="before")
    @classmethod
    def _coerce_style_ids(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        raw_style_ids = data.get("style_ids")
        if isinstance(raw_style_ids, list) and raw_style_ids:
            return data
        raw_style_id = data.get("style_id")
        if isinstance(raw_style_id, str) and raw_style_id.strip():
            copied = dict(data)
            copied["style_ids"] = [raw_style_id.strip()]
            return copied
        return data


class GenerateImageResponse(BaseSchema):
    job_id: str
    status: JobStatus
