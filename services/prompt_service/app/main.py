from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator
import logging
import socket
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.router import router
from app.core.errors import StyleNotFoundError, UnauthorizedError
from app.core.llm.errors import LLMConfigurationError, LLMUpstreamResponseError
from app.core.settings import Settings

logger = logging.getLogger(__name__)


def _redact_proxy_url(proxy_url: str) -> str:
    parsed = urlparse(proxy_url)
    if parsed.username or parsed.password:
        host = parsed.hostname or ""
        if parsed.port is not None:
            host = f"{host}:{parsed.port}"
        return parsed._replace(netloc=host).geturl()
    return proxy_url


def _is_proxy_reachable(proxy_url: str, *, timeout_s: float = 1.5) -> bool:
    parsed = urlparse(proxy_url)
    host = parsed.hostname
    if not host:
        return False
    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme == "https" else 80
    try:
        with socket.create_connection((host, port), timeout=timeout_s):
            return True
    except OSError:
        return False


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings()
    app.state.settings = settings
    proxy = settings.openai_proxy_url or None
    if proxy and not _is_proxy_reachable(proxy):
        logger.warning("OpenAI proxy is not reachable, disabling proxy: %s", _redact_proxy_url(proxy))
        proxy = None

    timeout = httpx.Timeout(
        connect=min(5.0, settings.http_timeout_s),
        read=settings.http_timeout_s,
        write=settings.http_timeout_s,
        pool=settings.http_timeout_s,
    )
    app.state.http = httpx.AsyncClient(timeout=timeout, proxy=proxy)
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
