from __future__ import annotations

import re


class MockLLMClient:
    async def enhance(self, text: str, *, style_context: str | None = None) -> str:
        cleaned = re.sub(r"\s+", " ", text).strip()
        if style_context and style_context.strip():
            style_cleaned = re.sub(r"\s+", " ", style_context).strip()
            if style_cleaned:
                if cleaned:
                    return f"{cleaned}. {style_cleaned}".strip()
                return style_cleaned
        return cleaned
