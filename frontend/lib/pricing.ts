const MAX_UNIT_PRICE = 37.77;
const MIN_UNIT_PRICE = 20;
const DISCOUNT_FACTOR = 4.0;

export const calculateUnitPrice = (count: number): number => {
  if (count <= 0) {
    throw new Error("count must be at least 1");
  }
  const raw = MAX_UNIT_PRICE - DISCOUNT_FACTOR * Math.log1p(count);
  const price = Math.round(raw);
  return Math.max(price, MIN_UNIT_PRICE);
};

export const calculateTotalPrice = (count: number): number => {
  return calculateUnitPrice(count) * count;
};
