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
