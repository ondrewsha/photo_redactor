from __future__ import annotations

from contextlib import asynccontextmanager
import inspect
from uuid import uuid4
from typing import AsyncIterator

import httpx
import redis.asyncio as redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from app.api.router import router
from app.core.cookies import set_device_cookie
from app.core.security import DEVICE_COOKIE, new_token
from app.core.settings import Settings


async def _maybe_await(value: object) -> None:
    if inspect.isawaitable(value):
        await value  # type: ignore[no-any-return]


async def _close_redis(client: redis.Redis) -> None:
    close = getattr(client, "aclose", None)
    if callable(close):
        await _maybe_await(close())
        return
    close = getattr(client, "close", None)
    if callable(close):
        await _maybe_await(close())
    pool = getattr(client, "connection_pool", None)
    disconnect = getattr(pool, "disconnect", None) if pool is not None else None
    if callable(disconnect):
        await _maybe_await(disconnect())


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings()
    app.state.settings = settings
    app.state.http = httpx.AsyncClient(timeout=settings.http_timeout_s)
    engine: AsyncEngine = create_async_engine(settings.database_url, pool_pre_ping=True)
    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    app.state.db_engine = engine
    app.state.db_sessionmaker = sessionmaker

    from app.core.models import Base  # local import to avoid import-order surprises

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    redis_client = redis.from_url(settings.redis_url)
    mongo_client = AsyncIOMotorClient(settings.mongo_url)
    history_collection = mongo_client[settings.mongo_database][settings.mongo_history_collection]
    await history_collection.create_index([("user_id", 1), ("completed_at", -1)])
    app.state.redis = redis_client
    app.state.mongo_client = mongo_client
    app.state.history_collection = history_collection
    try:
        yield
    finally:
        await app.state.http.aclose()
        await _close_redis(redis_client)
        mongo_client.close()
        await engine.dispose()


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
        request_id = request.headers.get("x-request-id") or str(uuid4())
        request.state.request_id = request_id
        device_id = request.cookies.get(DEVICE_COOKIE)
        if not device_id:
            device_id = new_token(nbytes=16)
        request.state.device_id = device_id

        response = await call_next(request)
        response.headers.setdefault("x-request-id", request_id)
        response.headers.setdefault("x-content-type-options", "nosniff")
        response.headers.setdefault("x-frame-options", "DENY")
        response.headers.setdefault("referrer-policy", "no-referrer")
        response.headers.setdefault("cross-origin-resource-policy", "same-site")
        if request.cookies.get(DEVICE_COOKIE) != device_id:
            set_device_cookie(response, settings=request.app.state.settings, device_id=device_id)
        return response

    @app.exception_handler(httpx.HTTPStatusError)
    async def handle_upstream_status(_: Request, exc: httpx.HTTPStatusError) -> JSONResponse:
        request_id = getattr(_.state, "request_id", None)
        upstream_status = exc.response.status_code
        upstream_data: dict[str, object] | None = None
        upstream_text: str | None = None
        try:
            body = exc.response.json()
            upstream_data = body if isinstance(body, dict) else {"data": body}
        except Exception:
            upstream_text = exc.response.text

        code = None
        message = None
        if upstream_data is not None:
            code_val = upstream_data.get("code")
            msg_val = upstream_data.get("message") or upstream_data.get("detail")
            code = code_val if isinstance(code_val, str) else None
            message = msg_val if isinstance(msg_val, str) else None
        if message is None and upstream_text:
            message = upstream_text.strip()[:200]

        # Map upstream errors to user-friendly messages.
        status_code = 503 if upstream_status >= 500 else upstream_status
        out_code = code or "upstream_error"
        out_message = message or "Сервис временно недоступен. Попробуйте позже."

        if code == "style_not_found":
            status_code = 400
            out_code = "style_not_found"
            out_message = "Стиль не найден. Обнови список стилей и попробуй снова."
        elif code == "llm_not_configured":
            status_code = 503
            out_code = "llm_unavailable"
            out_message = "AI-улучшение сейчас недоступно. Попробуй позже."
        elif code == "queue_unavailable" or message == "Queue unavailable":
            status_code = 503
            out_code = "generation_unavailable"
            out_message = "Очередь генерации временно недоступна. Попробуй позже."
        elif code == "job_not_found":
            status_code = 404
            out_code = "job_not_found"
            out_message = "Задача не найдена."
        elif upstream_status == 422:
            status_code = 422
            out_code = "validation_error"
            out_message = "Проверь параметры запроса."
        elif upstream_status == 401:
            status_code = 502
            out_code = "upstream_auth_error"
            out_message = "Внутренняя ошибка авторизации."

        payload: dict[str, object] = {"code": out_code, "message": out_message}
        if request_id:
            payload["details"] = {"request_id": request_id}
        if settings.debug_errors:
            payload.setdefault("details", {})
            assert isinstance(payload["details"], dict)
            payload["details"]["upstream_status"] = upstream_status
            if upstream_data is not None:
                payload["details"]["upstream_data"] = upstream_data
            if upstream_text is not None:
                payload["details"]["upstream_text"] = upstream_text[:1000]
        return JSONResponse(
            status_code=status_code,
            content=payload,
        )

    @app.exception_handler(httpx.HTTPError)
    async def handle_upstream_error(_: Request, exc: httpx.HTTPError) -> JSONResponse:
        request_id = getattr(_.state, "request_id", None)
        status_code = 504 if isinstance(exc, httpx.TimeoutException) else 502
        message = (
            "Сервис отвечает слишком долго. Попробуй позже."
            if isinstance(exc, httpx.TimeoutException)
            else "Сервис временно недоступен. Попробуй позже."
        )
        payload: dict[str, object] = {
            "code": "upstream_unavailable",
            "message": message,
        }
        if request_id:
            payload["details"] = {"request_id": request_id}
        if settings.debug_errors:
            payload.setdefault("details", {})
            assert isinstance(payload["details"], dict)
            payload["details"]["error"] = str(exc)
        return JSONResponse(
            status_code=status_code,
            content=payload,
        )

    app.include_router(router)
    return app


app = create_app()
