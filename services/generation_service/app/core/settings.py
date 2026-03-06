from __future__ import annotations

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GEN_SERVICE_", extra="ignore")

    database_url: str = "postgresql+asyncpg://nanovisual:nanovisual@postgres:5432/nanovisual"
    redis_url: str = "redis://redis:6379/0"
    queue_key: str = "nanovisual:queue:imggen"

    media_root: str = "/data/media"
    public_base_url: str = ""

    # Мы оставляем openrouter как основной, но для легаси можем оставить mock
    image_provider: Literal["mock", "openrouter"] = "openrouter"

    # Настройки OpenRouter
    openrouter_api_key: str | None = Field(default=None, repr=False)
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "google/gemini-3-pro-image-preview" 
    http_timeout_s: float = 120.0

    internal_token: str | None = Field(default=None, repr=False)

    worker_enabled: bool = True
    worker_poll_timeout_s: int = 1

    output_enabled: bool = True
    output_format: Literal["webp", "png", "jpeg"] = "jpeg"
    output_quality: int = Field(85, ge=1, le=100)
    output_max_side: int = Field(1280, ge=0)