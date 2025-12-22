from __future__ import annotations

import re

import httpx

from app.core.settings import Settings
from app.core.llm.errors import LLMConfigurationError, LLMUpstreamResponseError


class OpenAILLMClient:
    def __init__(self, http: httpx.AsyncClient, settings: Settings) -> None:
        self._settings = settings
        try:
            from openai import AsyncOpenAI
        except Exception as exc:  # noqa: BLE001
            raise LLMConfigurationError(
                "Не установлена библиотека openai. Добавьте зависимость `openai` и пересоберите prompt_service."
            ) from exc

        self._client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            http_client=http,
            max_retries=0,
            timeout=settings.http_timeout_s,
        )

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

        try:
            response = await self._client.chat.completions.create(
                model=self._settings.openai_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
        except Exception as exc:  # noqa: BLE001
            raise LLMUpstreamResponseError(f"OpenAI request failed: {exc}") from exc

        content: str | None = None
        if response.choices:
            content = response.choices[0].message.content
        if not content or not isinstance(content, str):
            raise LLMUpstreamResponseError("LLM response did not contain text content")

        return re.sub(r"\s+", " ", content).strip()
