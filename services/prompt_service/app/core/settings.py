from __future__ import annotations

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PROMPT_SERVICE_", extra="ignore")

    llm_provider: Literal["mock", "openai"] = "mock"

    internal_token: str | None = Field(default=None, repr=False)

    openai_api_key: str | None = Field(default=None, repr=False)
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-5-mini"

    http_timeout_s: float = 30.0
