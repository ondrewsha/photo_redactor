from __future__ import annotations

from datetime import datetime
import logging

from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)


async def create_history_entry(
    collection: AsyncIOMotorCollection,
    *,
    job_id: str,
    user_id: str,
    prompt: str,
    width: int,
    height: int,
) -> None:
    doc = {
        "_id": job_id,
        "job_id": job_id,
        "user_id": user_id,
        "prompt": prompt,
        "width": width,
        "height": height,
        "created_at": datetime.utcnow(),
        "completed_at": None,
        "image_url": None,
        "status": "pending",
    }
    try:
        await collection.insert_one(doc)
    except PyMongoError:
        logger.exception("Не удалось сохранить историю генерации job_id=%s", job_id)


async def finalize_history_entry(
    collection: AsyncIOMotorCollection,
    *,
    job_id: str,
    image_url: str,
) -> None:
    if not image_url:
        return
    update = {
        "image_url": image_url,
        "completed_at": datetime.utcnow(),
        "status": "completed",
    }
    try:
        await collection.update_one({"_id": job_id}, {"$set": update})
    except PyMongoError:
        logger.exception("Не удалось обновить историю генерации job_id=%s", job_id)


async def get_history_for_user(
    collection: AsyncIOMotorCollection,
    *,
    user_id: str,
    limit: int,
) -> list[dict]:
    cursor = collection.find(
        {"user_id": user_id, "image_url": {"$ne": None}},
        sort=[("completed_at", -1)],
    ).limit(limit)
    results = []
    try:
        async for entry in cursor:
            results.append(entry)
    except PyMongoError:
        logger.exception("Не удалось получить историю для пользователя %s", user_id)
    return results
