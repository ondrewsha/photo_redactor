from __future__ import annotations

from typing import Annotated, AsyncIterator

import redis.asyncio as redis
from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.errors import UnauthorizedError
from app.core.image_generators.base import ImageGenerator
from app.core.settings import Settings
from app.core.storage.base import Storage


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_redis(request: Request) -> redis.Redis:
    return request.app.state.redis


def get_db_sessionmaker(request: Request) -> async_sessionmaker[AsyncSession]:
    return request.app.state.db_sessionmaker


async def get_db_session(
    sessionmaker: Annotated[async_sessionmaker[AsyncSession], Depends(get_db_sessionmaker)],
) -> AsyncIterator[AsyncSession]:
    async with sessionmaker() as session:
        yield session


def get_storage(request: Request) -> Storage:
    return request.app.state.storage


def get_generator(request: Request) -> ImageGenerator:
    return request.app.state.generator


def require_internal_token(
    settings: Annotated[Settings, Depends(get_settings)],
    token: Annotated[str | None, Header(alias="X-NanoVisual-Internal-Token")] = None,
) -> None:
    if not settings.internal_token:
        return
    if token != settings.internal_token:
        raise UnauthorizedError("Missing or invalid X-NanoVisual-Internal-Token")
