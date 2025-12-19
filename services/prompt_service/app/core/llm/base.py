from __future__ import annotations

from typing import Protocol


class LLMClient(Protocol):
    async def enhance(self, text: str) -> str: ...

    async def creative(self, keywords: str) -> str: ...
