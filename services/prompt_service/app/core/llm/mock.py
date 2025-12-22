from __future__ import annotations

import re


class MockLLMClient:
    async def enhance(self, text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text).strip()
        return cleaned

    async def creative(self, keywords: str) -> str:
        cleaned = re.sub(r"\s+", " ", keywords).strip()
        return cleaned
