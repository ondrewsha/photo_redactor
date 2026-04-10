from __future__ import annotations

from functools import lru_cache
from typing import Annotated

import httpx
from fastapi import Depends, Header, Request

from app.core.llm.base import LLMClient
from app.core.llm.mock import MockLLMClient
from app.core.llm.openai_client import OpenAILLMClient
from app.core.errors import UnauthorizedError
from app.core.settings import Settings
from app.core.styles_registry import StyleRegistry


@lru_cache(maxsize=1)
def get_style_registry() -> StyleRegistry:
    return StyleRegistry.default()


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http


def get_llm_client(
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> LLMClient:
    if settings.llm_provider == "mock":
        return MockLLMClient()
    if settings.llm_provider == "openai":
        return OpenAILLMClient(settings=settings)
    raise RuntimeError(f"Unsupported LLM provider: {settings.llm_provider}")


def require_internal_token(
    settings: Annotated[Settings, Depends(get_settings)],
    token: Annotated[str | None, Header(alias="X-NanoVisual-Internal-Token")] = None,
) -> None:
    if not settings.internal_token:
        return
    if token != settings.internal_token:
        raise UnauthorizedError("Missing or invalid X-NanoVisual-Internal-Token")
