from __future__ import annotations

from typing import Protocol
from uuid import UUID


class Storage(Protocol):
    async def save_image(self, *, job_id: UUID, content: bytes, mime_type: str) -> str: ...
