from __future__ import annotations

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.billing import router as billing_router
from app.api.routes.generation import router as generation_router
from app.api.routes.history import router as history_router
from app.api.routes.oauth_google import router as google_oauth_router
from app.api.routes.public import router as public_router

router = APIRouter()
router.include_router(public_router)
router.include_router(auth_router)
router.include_router(google_oauth_router)
router.include_router(billing_router)
router.include_router(history_router)
router.include_router(generation_router)
