from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GATEWAY_", extra="ignore")

    prompt_service_url: str = "http://prompt_service:8000"
    generation_service_url: str = "http://generation_service:8000"

    internal_token: str | None = Field(default=None, repr=False)

    cors_allow_origins: str = "http://localhost:5173"
    http_timeout_s: float = 30.0

    @property
    def cors_allow_origins_list(self) -> list[str]:
        raw = self.cors_allow_origins.strip()
        if not raw:
            return []
        return [item.strip() for item in raw.split(",") if item.strip()]
