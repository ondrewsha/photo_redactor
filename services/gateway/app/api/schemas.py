from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field, model_validator

from nanovisual_shared.schemas import BaseSchema, JobStatus


class MessageResponse(BaseSchema):
    message: str = Field(..., min_length=1)


class AuthMeResponse(BaseSchema):
    email: str
    email_verified: bool
    balance: int = Field(..., ge=0)
    role: str


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
    project_id: str | None = Field(default=None, description="ID проекта для сохранения")

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


class BillingHistoryItem(BaseSchema):
    transaction_id: str
    delta: int
    kind: str
    comment: str | None = None
    created_at: datetime
    amount_rub: int | None = None


class BillingHistoryResponse(BaseSchema):
    items: list[BillingHistoryItem] = Field(default_factory=list)
    total: int
    page: int
    limit: int


class HistoryItem(BaseSchema):
    job_id: str
    user_prompt: str
    final_prompt: str
    style_ids: list[str]
    image_url: str
    width: int
    height: int
    created_at: datetime
    project_id: str | None = None


class HistoryListResponse(BaseSchema):
    items: list[HistoryItem] = Field(default_factory=list)
    total: int
    page: int
    limit: int


class AdminUserSummary(BaseSchema):
    user_id: UUID
    email: str
    role: str
    email_verified: bool
    is_active: bool
    balance: int
    created_at: datetime
    updated_at: datetime


class AdminUsersResponse(BaseSchema):
    items: list[AdminUserSummary] = Field(default_factory=list)
    total: int
    page: int
    limit: int


class AdminUserBalanceRequest(BaseSchema):
    amount: int
    comment: str | None = None


class AdminUserStatusRequest(BaseSchema):
    is_active: bool


class AdminTransactionItem(BaseSchema):
    transaction_id: UUID
    email: str
    delta: int
    kind: str
    comment: str | None = None
    amount_rub: int | None = None
    created_at: datetime


class AdminTransactionsSummary(BaseSchema):
    by_kind: dict[str, int] = Field(default_factory=dict)
    total_amount: int
    total_count: int


class AdminTransactionsResponse(BaseSchema):
    items: list[AdminTransactionItem] = Field(default_factory=list)
    total: int
    page: int
    limit: int
    summary: AdminTransactionsSummary


class AdminJobSummary(BaseSchema):
    reservation_id: UUID
    job_id: UUID | None
    status: str
    user_email: str
    created_at: datetime
    updated_at: datetime


class AdminJobsResponse(BaseSchema):
    items: list[AdminJobSummary] = Field(default_factory=list)
    total: int
    page: int
    limit: int
    backlog: dict[str, int] = Field(default_factory=dict)


class AdminMetricsResponse(BaseSchema):
    generation_series: list[dict[str, int]] = Field(default_factory=list)
    revenue_series: list[dict[str, int]] = Field(default_factory=list)
    backlog: dict[str, int] = Field(default_factory=dict)
    webhooks: dict[str, int] = Field(default_factory=dict)
    api_errors: int
    failure_rate: float

class ProjectItem(BaseSchema):
    id: str
    name: str
    created_at: datetime

class ProjectListResponse(BaseSchema):
    items: list[ProjectItem] = Field(default_factory=list)

class CreateProjectRequest(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100)

class MoveHistoryRequest(BaseSchema):
    project_id: str | None = Field(default=None, description="ID проекта или null для удаления из проекта")

class GalleryItem(BaseSchema):
    id: str
    prompt: str
    style_ids: list[str] = Field(default_factory=list)
    result_images: list[str] = Field(default_factory=list)
    input_images: list[str] = Field(default_factory=list)
    created_at: datetime

class GalleryListResponse(BaseSchema):
    items: list[GalleryItem] = Field(default_factory=list)

class AdminCreateGalleryRequest(BaseSchema):
    prompt: str
    style_ids: list[str] = Field(default_factory=list)
    result_images: list[str] = Field(default_factory=list)
    input_images: list[str] = Field(default_factory=list)
