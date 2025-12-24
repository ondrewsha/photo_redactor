from __future__ import annotations

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, Request

from nanovisual_shared.schemas import HealthResponse, StyleCategoryPublic

from app.api.deps import get_http, get_settings
from app.api.upstream import forward_headers
from app.core.settings import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


@router.get("/categories", response_model=list[StyleCategoryPublic])
async def categories(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
) -> list[StyleCategoryPublic]:
    resp = await http.get(
        f"{settings.prompt_service_url.rstrip('/')}/categories",
        headers=forward_headers(request, settings),
    )
    resp.raise_for_status()
    return resp.json()

