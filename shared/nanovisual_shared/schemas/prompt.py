from __future__ import annotations

from enum import Enum

from pydantic import Field

from .common import BaseSchema


class PromptMode(str, Enum):
    enhance = "enhance"
    creative = "creative"


class ComposePromptRequest(BaseSchema):
    style_id: str = Field(..., min_length=1)
    user_input: str = Field(..., min_length=1)
    mode: PromptMode = PromptMode.enhance


class ComposePromptResponse(BaseSchema):
    style_id: str
    mode: PromptMode
    enhanced_user_input: str
    final_prompt: str
