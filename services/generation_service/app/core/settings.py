from __future__ import annotations

from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GEN_SERVICE_", extra="ignore")

    database_url: str = "postgresql+asyncpg://nanovisual:nanovisual@postgres:5432/nanovisual"
    redis_url: str = "redis://redis:6379/0"
    queue_key: str = "nanovisual:queue:imggen"

    media_root: str = "/data/media"
    public_base_url: str = ""

    image_provider: Literal["mock", "gemini", "openai"] = "mock"

    gemini_api_key: str | None = Field(default=None, repr=False)
    gemini_model: str = "gemini-2.5-flash-image"
    gemini_proxy_url: str | None = Field(default=None, repr=False)

    openai_api_key: str | None = Field(default=None, repr=False)
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-image-1"
    openai_proxy_url: str | None = Field(default=None, repr=False)
    openai_output_format: Literal["png", "jpeg", "webp"] = "png"
    openai_quality: Literal["standard", "hd", "low", "medium", "high", "auto"] = "auto"
    openai_style: Literal["vivid", "natural"] | None = None

    http_timeout_s: float = 60.0

    @field_validator("gemini_model", "gemini_proxy_url", mode="before")
    @classmethod
    def _strip_inline_comment(cls, value: object) -> object:
        if value is None:
            return None
        text = str(value).strip()
        if "#" in text:
            text = text.split("#", 1)[0].strip()
        return text or None

    @field_validator("openai_model", "openai_base_url", "openai_proxy_url", "openai_style", mode="before")
    @classmethod
    def _strip_inline_comment_openai(cls, value: object) -> object:
        if value is None:
            return None
        text = str(value).strip()
        if "#" in text:
            text = text.split("#", 1)[0].strip()
        return text or None

    internal_token: str | None = Field(default=None, repr=False)

    worker_enabled: bool = True
    worker_poll_timeout_s: int = 1

    output_enabled: bool = True
    output_format: Literal["webp", "png", "jpeg"] = "webp"
    output_quality: int = Field(85, ge=1, le=100)
    output_max_side: int = Field(1280, ge=0)
