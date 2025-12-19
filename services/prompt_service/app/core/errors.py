from __future__ import annotations


class StyleNotFoundError(KeyError):
    def __init__(self, style_id: str) -> None:
        super().__init__(style_id)
        self.style_id = style_id


class UnauthorizedError(Exception):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message)
        self.message = message
