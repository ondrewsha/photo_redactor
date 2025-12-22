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

        style_context_lines: list[str] = []
        for style in styles:
            if style.description and style.description.strip():
                style_context_lines.append(f"{style.display_name} — {style.description.strip()}")
        style_context = "\n".join(style_context_lines) if style_context_lines else None

        used_llm = True
        try:
            enhanced = await self._llm.enhance(payload.user_input, style_context=style_context)
        except (LLMConfigurationError, LLMUpstreamResponseError):
            used_llm = False
            enhanced = payload.user_input

        final_prompt = enhanced
        if style_context and not used_llm:
            final_prompt = _join_prompt_parts(enhanced, style_context)

        return ComposePromptResponse(
            style_ids=[s.id for s in styles],
            mode=PromptMode.enhance,
            enhanced_user_input=enhanced,
            final_prompt=final_prompt,
        )
