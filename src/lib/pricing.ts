// Centralised pricing. The "no surge, ever" promise is enforced HERE — there is
// deliberately no demand, time-of-day, or weather multiplier anywhere in this function.
// If that ever needs to change, it should be a visible, deliberate product decision,
// not something that creeps in service-by-service.

export const FLAT_DELIVERY_FEE: Record<string, number> = {
  AED: 2.49,
  SAR: 2.49,
  QAR: 2.49,
  KWD: 0.21,
};

export const SERVICE_FEE_RATE = 0.025; // 2.5% of subtotal, capped below
export const SERVICE_FEE_CAP: Record<string, number> = {
  AED: 3.0,
  SAR: 3.0,
  QAR: 3.0,
  KWD: 0.25,
};

export interface PriceBreakdown {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  currency: string;
}

export function computePriceBreakdown(subtotal: number, currency: string): PriceBreakdown {
  const deliveryFee = FLAT_DELIVERY_FEE[currency] ?? FLAT_DELIVERY_FEE.AED;
  const cap = SERVICE_FEE_CAP[currency] ?? SERVICE_FEE_CAP.AED;
  const serviceFee = Math.min(subtotal * SERVICE_FEE_RATE, cap);
  const total = subtotal + deliveryFee + serviceFee;
  return {
    subtotal: round2(subtotal),
    deliveryFee: round2(deliveryFee),
    serviceFee: round2(serviceFee),
    total: round2(total),
    currency,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
