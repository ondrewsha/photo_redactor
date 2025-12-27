from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorCollection

from app.api.auth_deps import require_verified_user
from app.api.deps import get_history_collection
from app.api.schemas import HistoryItem, HistoryListResponse, MessageResponse
from app.core.history import get_history_for_user
from app.core.models import User

router = APIRouter(tags=["history"])


@router.get("/history", response_model=HistoryListResponse)
async def list_history(
    user: Annotated[User, Depends(require_verified_user)],
    history_collection: AsyncIOMotorCollection = Depends(get_history_collection),
    limit: int = Query(12, ge=1, le=50),
) -> HistoryListResponse:
    entries = await get_history_for_user(
        history_collection,
        user_id=str(user.id),
        limit=limit,
    )
    items = []
    for entry in entries:
        items.append(
            HistoryItem.model_validate(
                {
                    "job_id": entry.get("job_id"),
                    "user_prompt": entry.get("user_prompt") or entry.get("prompt") or "",
                    "final_prompt": entry.get("final_prompt") or entry.get("prompt") or "",
                    "style_ids": entry.get("style_ids") or [],
                    "image_url": entry.get("image_url"),
                    "width": entry.get("width", 0),
                    "height": entry.get("height", 0),
                    "created_at": entry.get("completed_at") or entry.get("created_at") or datetime.utcnow(),
                }
            )
        )
    return HistoryListResponse(items=items)


@router.delete("/history/{job_id}", response_model=MessageResponse)
async def delete_history(
    job_id: str,
    user: Annotated[User, Depends(require_verified_user)],
    history_collection: AsyncIOMotorCollection = Depends(get_history_collection),
) -> MessageResponse:
    res = await history_collection.delete_one({"_id": job_id, "user_id": str(user.id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="История не найдена.")
    return MessageResponse(message="История удалена.")
