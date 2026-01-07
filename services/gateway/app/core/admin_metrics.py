from __future__ import annotations

from datetime import datetime, timedelta
from typing import Annotated, Dict, Iterable, List

import redis.asyncio as redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import UserJobReservation

BASE_KEY = "nanovisual:admin:metrics"
DATE_FORMAT = "%Y%m%d"


def _date_key(prefix: str, date: datetime) -> str:
    return f"{BASE_KEY}:{prefix}:{date.strftime(DATE_FORMAT)}"


async def record_generation(redis_client: redis.Redis, count: int = 1) -> None:
    key = _date_key("generation", datetime.utcnow())
    await redis_client.incrby(key, count)
    await redis_client.expire(key, 60 * 60 * 24 * 35)


async def record_revenue(redis_client: redis.Redis, amount_rub: int) -> None:
    key = _date_key("revenue", datetime.utcnow())
    await redis_client.incrby(key, amount_rub)
    await redis_client.expire(key, 60 * 60 * 24 * 60)


async def record_webhook(redis_client: redis.Redis, success: bool) -> None:
    key = f"{BASE_KEY}:webhook:{'success' if success else 'failure'}"
    await redis_client.incr(key)


async def record_api_error(redis_client: redis.Redis) -> None:
    key = f"{BASE_KEY}:api:error"
    await redis_client.incr(key)


async def collect_metrics(
    *,
    redis_client: redis.Redis,
    db: AsyncSession,
    days: int = 7,
) -> dict[str, object]:
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days - 1)
    generation_series: List[Dict[str, object]] = []
    revenue_series: List[Dict[str, object]] = []
    for offset in range(days):
        current = start_date + timedelta(days=offset)
        gens_key = _date_key("generation", datetime(current.year, current.month, current.day))
        rev_key = _date_key("revenue", datetime(current.year, current.month, current.day))
        gen_count = await redis_client.get(gens_key) or b"0"
        rev_amount = await redis_client.get(rev_key) or b"0"
        date_int = int(current.strftime("%Y%m%d"))
        generation_series.append({"date": date_int, "value": int(gen_count)})
        revenue_series.append({"date": date_int, "value": int(rev_amount)})
    backlog_stats = {}
    res = await db.execute(
        select(
            UserJobReservation.status,
            func.count(),
        ).group_by(UserJobReservation.status)
    )
    for status, count in res.all():
        backlog_stats[status] = int(count)
    success_webhooks = int(await redis_client.get(f"{BASE_KEY}:webhook:success") or 0)
    failed_webhooks = int(await redis_client.get(f"{BASE_KEY}:webhook:failure") or 0)
    api_errors = int(await redis_client.get(f"{BASE_KEY}:api:error") or 0)
    total_requests = sum(backlog_stats.values()) or 1
    failure_rate = round(api_errors / total_requests * 100, 2)
    return {
        "generation_series": generation_series,
        "revenue_series": revenue_series,
        "backlog": backlog_stats,
        "webhooks": {
            "success": success_webhooks,
            "failure": failed_webhooks,
        },
        "api_errors": api_errors,
        "failure_rate": failure_rate,
    }
