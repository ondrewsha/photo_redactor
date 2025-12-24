from __future__ import annotations

from datetime import timedelta

import redis.asyncio as redis


class RateLimitExceededError(RuntimeError):
    pass


async def incr_with_ttl(
    client: redis.Redis,
    *,
    key: str,
    ttl: timedelta,
    limit: int,
) -> int:
    value = await client.incr(key)
    if value == 1:
        await client.expire(key, int(ttl.total_seconds()))
    if value > limit:
        raise RateLimitExceededError("Rate limit exceeded")
    return int(value)

