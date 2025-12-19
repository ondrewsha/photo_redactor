from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class HealthResponse(BaseSchema):
    status: Literal["ok"] = "ok"


class APIError(BaseSchema):
    code: str = Field(..., min_length=1, examples=["validation_error"])
    message: str = Field(..., min_length=1)
    details: dict[str, Any] | None = None
