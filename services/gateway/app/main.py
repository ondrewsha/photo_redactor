from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import router
from app.core.settings import Settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings()
    app.state.settings = settings
    app.state.http = httpx.AsyncClient(timeout=settings.http_timeout_s)
    try:
        yield
    finally:
        await app.state.http.aclose()


def create_app() -> FastAPI:
    settings = Settings()
    app = FastAPI(title="NanoVisual API Gateway", version="0.1.0", lifespan=lifespan)

    origins = settings.cors_allow_origins_list
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):  # type: ignore[no-untyped-def]
        response = await call_next(request)
        response.headers.setdefault("x-content-type-options", "nosniff")
        response.headers.setdefault("x-frame-options", "DENY")
        response.headers.setdefault("referrer-policy", "no-referrer")
        response.headers.setdefault("cross-origin-resource-policy", "same-site")
        return response

    @app.exception_handler(httpx.HTTPStatusError)
    async def handle_upstream_status(_: Request, exc: httpx.HTTPStatusError) -> JSONResponse:
        try:
            data = exc.response.json()
        except Exception:
            data = {"raw": exc.response.text}
        return JSONResponse(
            status_code=502,
            content={
                "code": "upstream_bad_status",
                "message": "Upstream service returned an error",
                "details": {"status_code": exc.response.status_code, "data": data},
            },
        )

    @app.exception_handler(httpx.HTTPError)
    async def handle_upstream_error(_: Request, exc: httpx.HTTPError) -> JSONResponse:
        return JSONResponse(
            status_code=502,
            content={
                "code": "upstream_error",
                "message": "Upstream service request failed",
                "details": {"error": str(exc)},
            },
        )

    app.include_router(router)
    return app


app = create_app()
