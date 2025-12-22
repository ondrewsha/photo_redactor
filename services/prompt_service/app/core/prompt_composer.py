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
        style_ids = payload.style_ids
        if not style_ids and payload.style_id:
            style_ids = [payload.style_id]
        if not style_ids:
            style_ids = ["none"]

        try:
            styles = [self._registry.get(style_id) for style_id in style_ids]
        except StyleNotFoundError:
            raise

        try:
            enhanced = await self._llm.enhance(payload.user_input)
        except (LLMConfigurationError, LLMUpstreamResponseError):
            enhanced = payload.user_input

        prefixes = [s.hidden_prefix for s in styles if s.hidden_prefix and s.hidden_prefix.strip()]
        suffixes = [s.hidden_suffix for s in styles if s.hidden_suffix and s.hidden_suffix.strip()]
        final_prompt = _join_prompt_parts(*prefixes, enhanced, *suffixes)
        return ComposePromptResponse(
            style_ids=[s.id for s in styles],
            mode=PromptMode.enhance,
            enhanced_user_input=enhanced,
            final_prompt=final_prompt,
        )
