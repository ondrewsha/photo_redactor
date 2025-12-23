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

    async def enhance(self, text: str, *, style_context: str | None = None) -> str:
        system = (
            "You are an expert prompt engineer for image generation.\n"
            "Input: user's request + optional style hints (names + descriptions).\n"
            "Task: produce ONE professional prompt suitable for AI image generation model.\n"
            "Rules:\n"
            "- Output in English.\n"
            "- Translate the user's request and style hints to English if needed.\n"
            "- Keep it concise but rich in visual detail (subject, scene, environment, lighting, mood, composition).\n"
            "- Blend the style hints naturally into the prompt (do NOT print them as a separate list).\n"
            "- No explanations, no disclaimers, no quotes.\n"
            "- Prefer a single line (comma-separated is fine).\n"
            "- Keep under 900 characters.\n"
            "Output: only the final prompt text."
        )
        user = self._format_user(text, style_context=style_context)
        return await self._generate(system=system, user=user)

    @staticmethod
    def _format_user(text: str, *, style_context: str | None) -> str:
        cleaned = text.strip()
        if not style_context or not style_context.strip():
            return cleaned
        return f"User request: {cleaned}\n\nStyle hints (use as guidance, do not list):\n{style_context.strip()}"

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
