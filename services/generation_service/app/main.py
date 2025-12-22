from __future__ import annotations

import asyncio
import inspect
from contextlib import asynccontextmanager, suppress
from pathlib import Path
from typing import AsyncIterator

import redis.asyncio as redis
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from app.api.router import router
from app.core.errors import GeneratorConfigurationError, JobNotFoundError, QueueUnavailableError, UnauthorizedError
from app.core.image_generators.base import ImageGenerator
from app.core.image_generators.gemini import GeminiImageGenerator
from app.core.image_generators.mock import MockImageGenerator
from app.core.settings import Settings
from app.core.storage.local import LocalStorage
from app.core.worker import GenerationWorker


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


def _build_image_generator(settings: Settings) -> ImageGenerator:
    if settings.image_provider == "mock":
        return MockImageGenerator()
    if settings.image_provider == "gemini":
        return GeminiImageGenerator(settings=settings)
    raise RuntimeError(f"Unsupported image provider: {settings.image_provider}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings()
    app.state.settings = settings

    engine: AsyncEngine = create_async_engine(settings.database_url, pool_pre_ping=True)
    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    app.state.db_engine = engine
    app.state.db_sessionmaker = sessionmaker

    from app.core.models import Base  # local import to avoid import-order surprises

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    redis_client = redis.from_url(settings.redis_url)
    app.state.redis = redis_client

    media_root = Path(settings.media_root)
    media_root.mkdir(parents=True, exist_ok=True)
    storage = LocalStorage(media_root=media_root)
    app.state.storage = storage
    # Local media hosting for development (S3 adapter can replace it later).
    if not any(getattr(r, "path", None) == "/media" for r in app.router.routes):
        app.mount("/media", StaticFiles(directory=str(media_root)), name="media")

    generator = _build_image_generator(settings=settings)
    app.state.generator = generator

    worker_task: asyncio.Task[None] | None = None
    if settings.worker_enabled:
        worker = GenerationWorker(
            settings=settings,
            redis_client=redis_client,
            db_sessionmaker=sessionmaker,
            generator=generator,
            storage=storage,
        )
        worker_task = asyncio.create_task(worker.run(), name="generation-worker")
        app.state.worker_task = worker_task

    try:
        yield
    finally:
        if worker_task is not None:
            worker_task.cancel()
            with suppress(asyncio.CancelledError):
                await worker_task
        await _close_redis(redis_client)
        await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(title="NanoVisual Generation Service", version="0.1.0", lifespan=lifespan)

    @app.exception_handler(JobNotFoundError)
    async def handle_job_not_found(_: Request, exc: JobNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={
                "code": "job_not_found",
                "message": f"Unknown job_id: {exc.job_id}",
                "details": {"job_id": str(exc.job_id)},
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

    @app.exception_handler(QueueUnavailableError)
    async def handle_queue_unavailable(_: Request, __: QueueUnavailableError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={
                "code": "queue_unavailable",
                "message": "Очередь генерации временно недоступна. Попробуйте позже.",
            },
        )

    @app.exception_handler(GeneratorConfigurationError)
    async def handle_generator_not_configured(_: Request, __: GeneratorConfigurationError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={
                "code": "generator_not_configured",
                "message": "Сервис генерации не настроен.",
            },
        )

    app.include_router(router)

    return app


app = create_app()
