from __future__ import annotations

from pydantic import Field

from nanovisual_shared.schemas import BaseSchema, PromptMode


class GenerateImageRequest(BaseSchema):
    style_id: str = Field(..., min_length=1)
    user_input: str = Field(..., min_length=1)
    mode: PromptMode = PromptMode.enhance
    width: int = Field(1024, ge=64, le=2048)
    height: int = Field(1024, ge=64, le=2048)
    seed: int | None = Field(None, ge=0)


class GenerateImageResponse(BaseSchema):
    job_id: str
    status: str
    enhanced_user_input: str
