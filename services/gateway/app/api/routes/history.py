from __future__ import annotations

from datetime import datetime
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo.errors import PyMongoError

from app.api.auth_deps import require_verified_user
from app.api.deps import get_history_collection
from app.api.schemas import (
    HistoryItem, 
    HistoryListResponse, 
    MessageResponse,
    ProjectItem,
    ProjectListResponse,
    CreateProjectRequest,
    MoveHistoryRequest
)
from app.core.models import User

router = APIRouter(tags=["history"])

def get_projects_collection(request: Request) -> AsyncIOMotorCollection:
    return request.app.state.mongo_client[request.app.state.settings.mongo_database]["projects"]

# --- ПРОЕКТЫ ---

@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    user: Annotated[User, Depends(require_verified_user)],
    projects_collection: AsyncIOMotorCollection = Depends(get_projects_collection),
):
    cursor = projects_collection.find({"user_id": str(user.id)}).sort("created_at", -1)
    items =[]
    async for doc in cursor:
        items.append(ProjectItem(
            id=str(doc["_id"]),
            name=doc["name"],
            created_at=doc["created_at"]
        ))
    return ProjectListResponse(items=items)

@router.post("/projects", response_model=ProjectItem)
async def create_project(
    payload: CreateProjectRequest,
    user: Annotated[User, Depends(require_verified_user)],
    projects_collection: AsyncIOMotorCollection = Depends(get_projects_collection),
):
    doc = {
        "user_id": str(user.id),
        "name": payload.name,
        "created_at": datetime.utcnow()
    }
    res = await projects_collection.insert_one(doc)
    return ProjectItem(
        id=str(res.inserted_id),
        name=payload.name,
        created_at=doc["created_at"]
    )

@router.delete("/projects/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: str,
    user: Annotated[User, Depends(require_verified_user)],
    projects_collection: AsyncIOMotorCollection = Depends(get_projects_collection),
    history_collection: AsyncIOMotorCollection = Depends(get_history_collection),
):
    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Неверный ID проекта")

    res = await projects_collection.delete_one({"_id": obj_id, "user_id": str(user.id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Отвязываем все картинки от удаленного проекта (переносим в "Несортированные")
    await history_collection.update_many(
        {"user_id": str(user.id), "project_id": project_id},
        {"$set": {"project_id": None}}
    )
    return MessageResponse(message="Проект удален")

# --- ИСТОРИЯ ---

@router.get("/history", response_model=HistoryListResponse)
async def list_history(
    user: Annotated[User, Depends(require_verified_user)],
    history_collection: AsyncIOMotorCollection = Depends(get_history_collection),
    project_id: str | None = Query(None, description="'all', 'none' или конкретный ID"),
    limit: int = Query(12, ge=1, le=50),
    page: int = Query(1, ge=1),
) -> HistoryListResponse:
    offset = (page - 1) * limit
    
    # Базовый фильтр
    filter_query = {"user_id": str(user.id), "image_url": {"$ne": None}}
    
    # Фильтрация по проектам
    if project_id == "none":
        filter_query["project_id"] = {"$in": [None, ""]}
    elif project_id and project_id != "all":
        filter_query["project_id"] = project_id

    cursor = history_collection.find(filter_query, sort=[("completed_at", -1)]).skip(offset).limit(limit)
    
    items =[]
    async for entry in cursor:
        items.append(HistoryItem.model_validate({
            "job_id": entry.get("job_id"),
            "user_prompt": entry.get("user_prompt") or entry.get("prompt") or "",
            "final_prompt": entry.get("final_prompt") or entry.get("prompt") or "",
            "style_ids": entry.get("style_ids") or[],
            "image_url": entry.get("image_url"),
            "width": entry.get("width", 0),
            "height": entry.get("height", 0),
            "created_at": entry.get("completed_at") or entry.get("created_at") or datetime.utcnow(),
            "project_id": entry.get("project_id")
        }))
        
    total = await history_collection.count_documents(filter_query)
    return HistoryListResponse(items=items, total=total, page=page, limit=limit)

@router.put("/history/{job_id}/project", response_model=MessageResponse)
async def move_history_item(
    job_id: str,
    payload: MoveHistoryRequest,
    user: Annotated[User, Depends(require_verified_user)],
    history_collection: AsyncIOMotorCollection = Depends(get_history_collection),
):
    res = await history_collection.update_one(
        {"_id": job_id, "user_id": str(user.id)},
        {"$set": {"project_id": payload.project_id}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Картинка не найдена")
    return MessageResponse(message="Перемещено")

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
