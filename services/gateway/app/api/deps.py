from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

import httpx
import redis.asyncio as redis
from fastapi import Depends, Request
from motor.motor_asyncio import AsyncIOMotorCollection
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.settings import Settings


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_http(request: Request) -> httpx.AsyncClient:
    return request.app.state.http


def get_sessionmaker(request: Request) -> async_sessionmaker[AsyncSession]:
    return request.app.state.db_sessionmaker


async def get_db_session(
    sessionmaker: Annotated[async_sessionmaker[AsyncSession], Depends(get_sessionmaker)],
) -> AsyncIterator[AsyncSession]:
    async with sessionmaker() as session:
        yield session


def get_redis(request: Request) -> redis.Redis:
    return request.app.state.redis


def get_history_collection(request: Request) -> AsyncIOMotorCollection:
    return request.app.state.history_collection

def get_gallery_collection(request: Request) -> AsyncIOMotorCollection:
    return request.app.state.mongo_client[request.app.state.settings.mongo_database]["prompt_gallery"]
