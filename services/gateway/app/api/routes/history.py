from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorCollection

from app.api.auth_deps import require_verified_user
from app.api.deps import get_history_collection
from app.api.schemas import HistoryItem, HistoryListResponse
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
                    "prompt": entry.get("prompt"),
                    "image_url": entry.get("image_url"),
                    "width": entry.get("width", 0),
                    "height": entry.get("height", 0),
                    "created_at": entry.get("completed_at") or entry.get("created_at") or datetime.utcnow(),
                }
            )
        )
    return HistoryListResponse(items=items)
