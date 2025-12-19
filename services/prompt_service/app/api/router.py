from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from nanovisual_shared.schemas import (
    ComposePromptRequest,
    ComposePromptResponse,
    HealthResponse,
    StyleCategoryPublic,
)

from app.api.deps import get_llm_client, get_style_registry, require_internal_token
from app.core.llm.base import LLMClient
from app.core.prompt_composer import PromptComposer
from app.core.styles_registry import StyleRegistry

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@router.get("/categories", response_model=list[StyleCategoryPublic])
async def list_categories(
    registry: Annotated[StyleRegistry, Depends(get_style_registry)],
) -> list[StyleCategoryPublic]:
    return registry.list_public()


@router.post(
    "/compose",
    response_model=ComposePromptResponse,
    dependencies=[Depends(require_internal_token)],
)
async def compose_prompt(
    payload: ComposePromptRequest,
    registry: Annotated[StyleRegistry, Depends(get_style_registry)],
    llm: Annotated[LLMClient, Depends(get_llm_client)],
) -> ComposePromptResponse:
    composer = PromptComposer(registry=registry, llm=llm)
    return await composer.compose(payload)
