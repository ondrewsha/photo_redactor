from __future__ import annotations

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, Request

from nanovisual_shared.schemas import GenerationCapabilities, HealthResponse, StyleCategoryPublic

from app.api.deps import get_http, get_settings, get_gallery_collection
from app.api.upstream import forward_headers
from app.core.settings import Settings

from motor.motor_asyncio import AsyncIOMotorCollection
from app.api.schemas import GalleryItem, GalleryListResponse

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


@router.get("/capabilities", response_model=GenerationCapabilities)
async def capabilities(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
) -> GenerationCapabilities:
    resp = await http.get(
        f"{settings.generation_service_url.rstrip('/')}/capabilities",
        headers=forward_headers(request, settings),
    )
    resp.raise_for_status()
    return GenerationCapabilities.model_validate(resp.json())

@router.get("/gallery", response_model=GalleryListResponse)
async def get_gallery(
    gallery_collection: AsyncIOMotorCollection = Depends(get_gallery_collection)
):
    cursor = gallery_collection.find().sort("created_at", -1)
    items =[]
    async for doc in cursor:
        items.append(GalleryItem(
            id=str(doc["_id"]),
            prompt=doc["prompt"],
            style_ids=doc.get("style_ids",[]),
            result_images=doc.get("result_images",[]),
            input_image=doc.get("input_image"),
            created_at=doc["created_at"]
        ))
    return GalleryListResponse(items=items)
