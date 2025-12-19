from __future__ import annotations

import asyncio
from pathlib import Path
from uuid import UUID

from app.core.storage.base import Storage


_MIME_EXT: dict[str, str] = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}


class LocalStorage(Storage):
    def __init__(self, *, media_root: Path) -> None:
        self._media_root = media_root

    async def save_image(self, *, job_id: UUID, content: bytes, mime_type: str) -> str:
        ext = _MIME_EXT.get(mime_type, ".bin")
        file_name = f"{job_id}{ext}"
        path = self._media_root / file_name
        await asyncio.to_thread(path.write_bytes, content)
        return file_name
