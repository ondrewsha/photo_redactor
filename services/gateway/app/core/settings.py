from __future__ import annotations

from typing import Literal

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GATEWAY_", extra="ignore")

    prompt_service_url: str = "http://prompt_service:8000"
    generation_service_url: str = "http://generation_service:8000"

    database_url: str = "postgresql+asyncpg://nanovisual:nanovisual@postgres:5432/nanovisual"
    redis_url: str = "redis://redis:6379/0"
    mongo_url: str = "mongodb://mongo:27017"
    mongo_database: str = "nanovisual_history"
    mongo_history_collection: str = "generation_history"

    internal_token: str | None = Field(default=None, repr=False)

    cors_allow_origins: str = "http://localhost:5173"
    http_timeout_s: float = 30.0
    debug_errors: bool = False

    cookie_secure: bool = False
    cookie_domain: str | None = None
    public_base_url: str = "http://localhost:8080"
    frontend_base_url: str = "http://localhost:5173"

    jwt_secret: str = Field(default="change-me", repr=False)
    jwt_ttl_minutes: int = 60 * 24 * 14

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = Field(default=None, repr=False)
    smtp_password: str | None = Field(default=None, repr=False)
    smtp_from: str | None = None
    smtp_use_tls: bool = True

    google_client_id: str | None = Field(default=None, repr=False)
    google_client_secret: str | None = Field(default=None, repr=False)
    google_redirect_url: str | None = None

    payment_provider: Literal["mock", "yookassa"] = "mock"
    yookassa_shop_id: str | None = Field(default=None, repr=False)
    yookassa_secret_key: str | None = Field(default=None, repr=False)
    yookassa_return_url: str | None = None
    yookassa_webhook_secret: str | None = Field(default=None, repr=False)

    antifraud_register_ip_daily_limit: int = 5
    antifraud_trial_ip_daily_limit: int = 2
    antifraud_trial_device_limit: int = 1

    @field_validator(
        "prompt_service_url",
        "generation_service_url",
        "database_url",
        "redis_url",
        "cors_allow_origins",
        "public_base_url",
        "frontend_base_url",
        "google_redirect_url",
        "yookassa_return_url",
        "mongo_url",
        "mongo_database",
        "mongo_history_collection",
        mode="before",
    )
    @classmethod
    def _strip_inline_comment(cls, value: object) -> object:
        if value is None:
            return None
        text = str(value).strip()
        if "#" in text:
            text = text.split("#", 1)[0].strip()
        return text or None

    @property
    def cors_allow_origins_list(self) -> list[str]:
        raw = self.cors_allow_origins.strip()
        if not raw:
            return []
        return [item.strip() for item in raw.split(",") if item.strip()]
