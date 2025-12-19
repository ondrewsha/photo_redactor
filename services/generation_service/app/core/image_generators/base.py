from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class GeneratedImage:
    content: bytes
    mime_type: str


class ImageGenerator(Protocol):
    async def generate(self, *, prompt: str, width: int, height: int, seed: int | None) -> GeneratedImage: ...
