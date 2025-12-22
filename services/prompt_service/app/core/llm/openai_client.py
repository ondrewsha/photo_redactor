from __future__ import annotations

import re

import httpx

from app.core.settings import Settings
from app.core.llm.errors import LLMConfigurationError, LLMUpstreamResponseError


class OpenAILLMClient:
    def __init__(self, http: httpx.AsyncClient, settings: Settings) -> None:
        self._http = http
        self._settings = settings

    async def enhance(self, text: str) -> str:
        system = (
            "You are a prompt enhancer for image generation. "
            "Take the user's text and improve it with concrete visual details "
            "(subject, environment, lighting, composition, textures, depth). "
            "Keep the original intent, avoid naming art styles (they are applied separately), "
            "do not add safety disclaimers, output in the same language as the input, "
            "and output ONLY the improved text."
        )
        return await self._generate(system=system, user=text)

    async def creative(self, keywords: str) -> str:
        system = (
            "You turn 2-3 keywords into a strong image idea. "
            "Create a short, vivid scene description suitable for an image model. "
            "Do not mention cameras unless the user asked, do not add safety disclaimers, "
            "avoid naming art styles (they are applied separately), output in the same language as the input, "
            "and output ONLY the scene description."
        )
        return await self._generate(system=system, user=keywords)

    async def _generate(self, system: str, user: str) -> str:
        if not self._settings.openai_api_key:
            raise LLMConfigurationError(
                "Не задан PROMPT_SERVICE_OPENAI_API_KEY (нужно для llm_provider=openai)"
            )

        url = f"{self._settings.openai_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._settings.openai_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.5,
        }

        resp = await self._http.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        try:
            data = resp.json()
        except Exception as exc:  # noqa: BLE001
            raise LLMUpstreamResponseError("LLM returned non-JSON response") from exc

        content: str | None = None
        choices = data.get("choices")
        if isinstance(choices, list) and choices:
            message = choices[0].get("message")
            if isinstance(message, dict):
                content = message.get("content")

        if not content or not isinstance(content, str):
            raise LLMUpstreamResponseError("LLM response did not contain text content")

        return re.sub(r"\s+", " ", content).strip()
