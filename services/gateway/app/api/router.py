from __future__ import annotations

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import Response, StreamingResponse

from nanovisual_shared.schemas import (
    ComposePromptRequest,
    ComposePromptResponse,
    CreateJobRequest,
    CreateJobResponse,
    HealthResponse,
    JobStatusResponse,
    StyleCategoryPublic,
    PromptMode,
)

from app.api.schemas import GenerateImageRequest, GenerateImageResponse
from app.core.settings import Settings

router = APIRouter()


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_http(request: Request) -> httpx.AsyncClient:
    return request.app.state.http


def _auth_headers(settings: Settings) -> dict[str, str]:
    headers: dict[str, str] = {}
    if settings.internal_token:
        headers["X-NanoVisual-Internal-Token"] = settings.internal_token
    return headers


def _forward_headers(request: Request, settings: Settings) -> dict[str, str]:
    headers = _auth_headers(settings)
    request_id = getattr(request.state, "request_id", None)
    if isinstance(request_id, str) and request_id:
        headers["X-Request-Id"] = request_id
    return headers


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
        headers=_forward_headers(request, settings),
    )
    resp.raise_for_status()
    return resp.json()


@router.post("/generate", response_model=GenerateImageResponse)
async def generate(
    request: Request,
    payload: GenerateImageRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
) -> GenerateImageResponse:
    style_ids = payload.style_ids or ["none"]
    composed = await http.post(
        f"{settings.prompt_service_url.rstrip('/')}/compose",
        headers=_forward_headers(request, settings),
        json=ComposePromptRequest(
            style_ids=style_ids,
            user_input=payload.user_input,
            mode=PromptMode.enhance,
        ).model_dump(mode="json"),
    )
    composed.raise_for_status()
    composed_data = ComposePromptResponse.model_validate(composed.json())

    job = await http.post(
        f"{settings.generation_service_url.rstrip('/')}/jobs",
        headers=_forward_headers(request, settings),
        json=CreateJobRequest(
            prompt=composed_data.final_prompt,
            width=payload.width,
            height=payload.height,
        ).model_dump(mode="json"),
    )
    job.raise_for_status()
    job_data: CreateJobResponse = CreateJobResponse.model_validate(job.json())

    return GenerateImageResponse(
        job_id=str(job_data.job_id),
        status=job_data.status,
    )


@router.post("/generate/image", response_model=GenerateImageResponse)
async def generate_with_image(
    request: Request,
    user_input: str = Form(...),
    image: list[UploadFile] = File(...),
    style_ids: list[str] | None = Form(None),
    width: int = Form(1024),
    height: int = Form(1024),
    settings: Settings = Depends(get_settings),
    http: httpx.AsyncClient = Depends(get_http),
) -> GenerateImageResponse:
    cleaned_style_ids = [s.strip() for s in (style_ids or []) if isinstance(s, str) and s.strip()] or ["none"]

    composed = await http.post(
        f"{settings.prompt_service_url.rstrip('/')}/compose",
        headers=_forward_headers(request, settings),
        json=ComposePromptRequest(
            style_ids=cleaned_style_ids,
            user_input=user_input,
            mode=PromptMode.enhance,
        ).model_dump(mode="json"),
    )
    composed.raise_for_status()
    composed_data = ComposePromptResponse.model_validate(composed.json())

    images = image[:4]
    files: list[tuple[str, tuple[str, bytes, str]]] = []
    for idx, img in enumerate(images):
        image_bytes = await img.read()
        files.append(
            (
                "image",
                (
                    img.filename or f"image_{idx}",
                    image_bytes,
                    img.content_type or "application/octet-stream",
                ),
            )
        )
    data = {"prompt": composed_data.final_prompt, "width": str(width), "height": str(height)}
    job = await http.post(
        f"{settings.generation_service_url.rstrip('/')}/jobs/image",
        headers=_forward_headers(request, settings),
        data=data,
        files=files,
    )
    job.raise_for_status()
    job_data: CreateJobResponse = CreateJobResponse.model_validate(job.json())

    return GenerateImageResponse(job_id=str(job_data.job_id), status=job_data.status)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def job_status(
    request: Request,
    job_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
) -> JobStatusResponse:
    resp = await http.get(
        f"{settings.generation_service_url.rstrip('/')}/jobs/{job_id}",
        headers=_forward_headers(request, settings),
    )
    resp.raise_for_status()
    return JobStatusResponse.model_validate(resp.json())


@router.get("/media/{path:path}")
async def media_proxy(
    request: Request,
    path: str,
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http)],
) -> Response:
    upstream = f"{settings.generation_service_url.rstrip('/')}/media/{path}"
    upstream_stream = http.stream("GET", upstream, headers=_forward_headers(request, settings))
    upstream_resp = await upstream_stream.__aenter__()
    if upstream_resp.status_code >= 400:
        body = await upstream_resp.aread()
        await upstream_stream.__aexit__(None, None, None)
        return Response(status_code=upstream_resp.status_code, content=body)

    content_type = upstream_resp.headers.get("content-type", "application/octet-stream")
    cache_control = upstream_resp.headers.get("cache-control", "public, max-age=31536000")
    content_length = upstream_resp.headers.get("content-length")

    async def body_iter():  # type: ignore[no-untyped-def]
        try:
            async for chunk in upstream_resp.aiter_bytes():
                yield chunk
        finally:
            await upstream_stream.__aexit__(None, None, None)

    headers: dict[str, str] = {"cache-control": cache_control}
    if content_length:
        headers["content-length"] = content_length

    return StreamingResponse(body_iter(), media_type=content_type, headers=headers)
