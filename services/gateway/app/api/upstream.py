from __future__ import annotations

from fastapi import Request

from app.core.settings import Settings


def auth_headers(settings: Settings) -> dict[str, str]:
    headers: dict[str, str] = {}
    if settings.internal_token:
        headers["X-NanoVisual-Internal-Token"] = settings.internal_token
    return headers


def forward_headers(request: Request, settings: Settings) -> dict[str, str]:
    headers = auth_headers(settings)
    request_id = getattr(request.state, "request_id", None)
    if isinstance(request_id, str) and request_id:
        headers["X-Request-Id"] = request_id
    return headers

