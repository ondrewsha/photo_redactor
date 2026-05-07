from __future__ import annotations

from enum import Enum

from pydantic import Field, model_validator

from .common import BaseSchema


class PromptMode(str, Enum):
    enhance = "enhance"


class ComposePromptRequest(BaseSchema):
    style_ids: list[str] = Field(default_factory=list, description="One or more style ids.")
    # Backward-compatible field (deprecated): use style_ids instead.
    style_id: str | None = Field(default=None, description="Deprecated. Use style_ids.")
    user_input: str = Field(..., min_length=1)
    mode: PromptMode = PromptMode.enhance
    preserve_face: bool = Field(False, description="Добавить жесткую инструкцию по сохранению лица")

    @model_validator(mode="before")
    @classmethod
    def _coerce_style_ids(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        raw_style_ids = data.get("style_ids")
        if isinstance(raw_style_ids, list) and raw_style_ids:
            return data
        raw_style_id = data.get("style_id")
        if isinstance(raw_style_id, str) and raw_style_id.strip():
            copied = dict(data)
            copied["style_ids"] = [raw_style_id.strip()]
            return copied
        return data


class ComposePromptResponse(BaseSchema):
    style_ids: list[str]
    mode: PromptMode
    final_prompt: str
