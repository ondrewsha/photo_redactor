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
            "Ты помогаешь составить короткое описание для генерации изображения.\n"
            "На входе: текст пользователя и (иногда) выбранные стили с описанием.\n"
            "Задача: сохранить смысл пользователя, добавить конкретики (что, где, свет, цвет, материалы, настроение, ракурс) "
            "и аккуратно вплести стиль в текст.\n"
            "Правила:\n"
            "- Пиши на том же языке, что и пользователь.\n"
            "- Не используй профессиональный жаргон.\n"
            "- Не пиши служебные слова вроде «промпт», «стиль:», «модель», «система».\n"
            "- Не выводи список стилей отдельными строками — используй его как подсказку и вплетай в текст.\n"
            "- Не добавляй предупреждения и пояснения.\n"
            "- Сделай текст коротким: до 600 символов.\n"
            "Ответ: только готовое описание."
        )
        user = self._format_user(text, style_context=style_context)
        return await self._generate(system=system, user=user)

    async def creative(self, keywords: str, *, style_context: str | None = None) -> str:
        system = (
            "Ты придумываешь короткую идею картинки по 2–3 словам пользователя.\n"
            "Если есть выбранные стили с описанием — вплети их в результат.\n"
            "Правила:\n"
            "- Пиши на том же языке, что и пользователь.\n"
            "- Добавь конкретики (что происходит, где, свет, цвет, настроение), но без лишних слов.\n"
            "- Не используй профессиональный жаргон.\n"
            "- Не пиши служебные слова вроде «промпт», «стиль:», «модель», «система».\n"
            "- Не выводи список стилей отдельными строками — используй его как подсказку и вплетай в текст.\n"
            "- Не добавляй предупреждения и пояснения.\n"
            "- Сделай текст коротким: до 600 символов.\n"
            "Ответ: только готовое описание."
        )
        user = self._format_user(keywords, style_context=style_context)
        return await self._generate(system=system, user=user)

    @staticmethod
    def _format_user(text: str, *, style_context: str | None) -> str:
        cleaned = text.strip()
        if not style_context or not style_context.strip():
            return cleaned
        return f"Текст пользователя: {cleaned}\n\nВыбранные стили:\n{style_context.strip()}"

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
