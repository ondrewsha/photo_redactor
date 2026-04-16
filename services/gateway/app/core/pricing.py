from __future__ import annotations

import math

MAX_UNIT_PRICE = 37.77
MIN_UNIT_PRICE = 20
DISCOUNT_FACTOR = 4.0


def calculate_unit_price(count: int) -> int:
    if count <= 0:
        raise ValueError("count must be at least 1")
    raw = MAX_UNIT_PRICE - DISCOUNT_FACTOR * math.log1p(count)
    price = round(raw)
    if price < MIN_UNIT_PRICE:
        price = MIN_UNIT_PRICE
    return price
