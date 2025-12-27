from __future__ import annotations

from datetime import datetime

from pydantic import Field, model_validator

from nanovisual_shared.schemas import BaseSchema, JobStatus


class MessageResponse(BaseSchema):
    message: str = Field(..., min_length=1)


class AuthMeResponse(BaseSchema):
    email: str
    email_verified: bool
    balance: int = Field(..., ge=0)


class RegisterRequest(BaseSchema):
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=8, max_length=200)


class LoginRequest(BaseSchema):
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=1, max_length=200)


class ChangePasswordRequest(BaseSchema):
    current_password: str = Field(..., min_length=1, max_length=200)
    new_password: str = Field(..., min_length=8, max_length=200)


class GenerateImageRequest(BaseSchema):
    style_ids: list[str] = Field(default_factory=list, description="One or more style ids.")
    # Backward-compatible field (deprecated): use style_ids instead.
    style_id: str | None = Field(default=None)
    user_input: str = Field(..., min_length=1)
    width: int = Field(1024, ge=64, le=4096)
    height: int = Field(1024, ge=64, le=4096)

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


class BillingQuoteResponse(BaseSchema):
    count: int = Field(..., ge=1, le=1000)
    currency: str = Field("RUB", min_length=1, max_length=10)
    unit_price_rub: int = Field(..., ge=0)
    total_price_rub: int = Field(..., ge=0)
    suggestions: list[int] = Field(default_factory=list)


class CreatePaymentRequest(BaseSchema):
    generation_count: int = Field(..., ge=1, le=1000)


class CreatePaymentResponse(BaseSchema):
    payment_id: str
    status: str
    confirmation_url: str | None = None
    generation_count: int = Field(..., ge=1)
    amount_rub: int = Field(..., ge=0)
    currency: str = Field("RUB", min_length=1, max_length=10)


class HistoryItem(BaseSchema):
    job_id: str
    prompt: str
    image_url: str
    width: int
    height: int
    created_at: datetime


class HistoryListResponse(BaseSchema):
    items: list[HistoryItem] = Field(default_factory=list)
