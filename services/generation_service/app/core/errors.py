from __future__ import annotations

from uuid import UUID


class JobNotFoundError(KeyError):
    def __init__(self, job_id: UUID) -> None:
        super().__init__(str(job_id))
        self.job_id = job_id


class UnauthorizedError(Exception):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message)
        self.message = message


class GeneratorConfigurationError(RuntimeError):
    pass


class QueueUnavailableError(RuntimeError):
    pass


class UnsupportedImageSizeError(ValueError):
    def __init__(self, *, width: int, height: int) -> None:
        super().__init__(f"Unsupported image size: {width}x{height}")
        self.width = width
        self.height = height


class UnsupportedSourceImagesError(ValueError):
    def __init__(self, *, model: str) -> None:
        super().__init__(f"Source images are not supported for model: {model}")
        self.model = model
