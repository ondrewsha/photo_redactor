from __future__ import annotations

from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PROMPT_SERVICE_", extra="ignore")

    llm_provider: Literal["mock", "openai"] = "mock"

    internal_token: str | None = Field(default=None, repr=False)

    openai_api_key: str | None = Field(default=None, repr=False)
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-5-mini"
    openai_proxy_url: str | None = Field(default=None, repr=False)
    openai_proxy_enabled: bool = True

    http_timeout_s: float = 30.0

    @field_validator("openai_model", "openai_base_url", "openai_proxy_url", mode="before")
    @classmethod
    def _strip_inline_comment(cls, value: object) -> object:
        if value is None:
            return None
        text = str(value).strip()
        if "#" in text:
            text = text.split("#", 1)[0].strip()
        return text or None
