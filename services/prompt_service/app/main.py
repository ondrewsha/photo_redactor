from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.router import router
from app.core.errors import StyleNotFoundError, UnauthorizedError
from app.core.llm.errors import LLMConfigurationError, LLMUpstreamResponseError
from app.core.settings import Settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings()
    app.state.settings = settings
    app.state.http = httpx.AsyncClient(
        timeout=settings.http_timeout_s,
        proxy=settings.openai_proxy_url or None,
    )
    try:
        yield
    finally:
        await app.state.http.aclose()


def create_app() -> FastAPI:
    app = FastAPI(title="NanoVisual Prompt Service", version="0.1.0", lifespan=lifespan)
    app.include_router(router)

    @app.exception_handler(StyleNotFoundError)
    async def handle_style_not_found(_: Request, exc: StyleNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={
                "code": "style_not_found",
                "message": f"Unknown style_id: {exc.style_id}",
                "details": {"style_id": exc.style_id},
            },
        )

    @app.exception_handler(UnauthorizedError)
    async def handle_unauthorized(_: Request, exc: UnauthorizedError) -> JSONResponse:
        return JSONResponse(
            status_code=401,
            content={
                "code": "unauthorized",
                "message": exc.message,
            },
        )

    @app.exception_handler(httpx.HTTPError)
    async def handle_http_error(_: Request, exc: httpx.HTTPError) -> JSONResponse:
        return JSONResponse(
            status_code=502,
            content={
                "code": "upstream_error",
                "message": "AI сервис временно недоступен. Попробуйте позже.",
                "details": {"error": str(exc)},
            },
        )

    @app.exception_handler(LLMConfigurationError)
    async def handle_llm_config_error(_: Request, exc: LLMConfigurationError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={
                "code": "llm_not_configured",
                "message": str(exc),
            },
        )

    @app.exception_handler(LLMUpstreamResponseError)
    async def handle_llm_bad_response(_: Request, exc: LLMUpstreamResponseError) -> JSONResponse:
        return JSONResponse(
            status_code=502,
            content={
                "code": "llm_upstream_error",
                "message": "AI сервис вернул некорректный ответ. Попробуйте позже.",
                "details": {"error": str(exc)},
            },
        )

    return app


app = create_app()
