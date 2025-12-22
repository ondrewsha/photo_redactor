from __future__ import annotations

from typing import Protocol


class LLMClient(Protocol):
    async def enhance(self, text: str, *, style_context: str | None = None) -> str: ...

    async def creative(self, keywords: str, *, style_context: str | None = None) -> str: ...
