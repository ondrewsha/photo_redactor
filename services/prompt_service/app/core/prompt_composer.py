from __future__ import annotations

from nanovisual_shared.schemas import ComposePromptRequest, ComposePromptResponse, PromptMode

from app.core.errors import StyleNotFoundError
from app.core.llm.base import LLMClient
from app.core.llm.errors import LLMConfigurationError, LLMUpstreamResponseError
from app.core.styles_registry import StyleRegistry


def _join_prompt_parts(*parts: str) -> str:
    cleaned = [p.strip() for p in parts if p and p.strip()]
    return "\n".join(cleaned)


class PromptComposer:
    def __init__(self, registry: StyleRegistry, llm: LLMClient) -> None:
        self._registry = registry
        self._llm = llm

    async def compose(self, payload: ComposePromptRequest) -> ComposePromptResponse:
        try:
            style = self._registry.get(payload.style_id)
        except StyleNotFoundError:
            raise

        try:
            if payload.mode == PromptMode.enhance:
                enhanced = await self._llm.enhance(payload.user_input)
            elif payload.mode == PromptMode.creative:
                enhanced = await self._llm.creative(payload.user_input)
            else:
                enhanced = payload.user_input
        except (LLMConfigurationError, LLMUpstreamResponseError):
            enhanced = payload.user_input

        final_prompt = _join_prompt_parts(style.hidden_prefix, enhanced, style.hidden_suffix)
        return ComposePromptResponse(
            style_id=payload.style_id,
            mode=payload.mode,
            enhanced_user_input=enhanced,
            final_prompt=final_prompt,
        )
