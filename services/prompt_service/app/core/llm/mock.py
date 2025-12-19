from __future__ import annotations

import re


class MockLLMClient:
    async def enhance(self, text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text).strip()
        if not cleaned:
            return ""
        return (
            f"{cleaned}. "
            "Add rich visual detail: lighting, materials, environment, composition, depth, and mood."
        )

    async def creative(self, keywords: str) -> str:
        cleaned = re.sub(r"\s+", " ", keywords).strip()
        if not cleaned:
            return ""
        return (
            f"Concept inspired by: {cleaned}. "
            "Describe a single striking scene with clear subject, setting, lighting, and mood."
        )
