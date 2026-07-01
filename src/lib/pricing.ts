// Centralised pricing. The "no surge, ever" promise is enforced HERE — there is
// deliberately no demand, time-of-day, or weather multiplier anywhere in this function.
// If that ever needs to change, it should be a visible, deliberate product decision,
// not something that creeps in service-by-service.

export interface Market {
  country: string;
  countryAr: string;
  flag: string;
  city: string;
  cityAr: string;
  currency: string;
  currencySymbol: string;
  // PSP note: each market has a preferred local payment method that should replace the
  // generic "card" label in the checkout UI and be wired to the right PSP in production.
  preferredPsp: string;
}

export const MARKETS: Market[] = [
  { country: "UAE", countryAr: "الإمارات", flag: "🇦🇪", city: "Dubai", cityAr: "دبي", currency: "AED", currencySymbol: "AED", preferredPsp: "mada/Jaywan" },
  { country: "Saudi Arabia", countryAr: "السعودية", flag: "🇸🇦", city: "Riyadh", cityAr: "الرياض", currency: "SAR", currencySymbol: "SAR", preferredPsp: "mada" },
  { country: "Kuwait", countryAr: "الكويت", flag: "🇰🇼", city: "Kuwait City", cityAr: "مدينة الكويت", currency: "KWD", currencySymbol: "KWD", preferredPsp: "KNET" },
  { country: "Qatar", countryAr: "قطر", flag: "🇶🇦", city: "Doha", cityAr: "الدوحة", currency: "QAR", currencySymbol: "QAR", preferredPsp: "NAPS" },
  { country: "Jordan", countryAr: "الأردن", flag: "🇯🇴", city: "Amman", cityAr: "عمّان", currency: "JOD", currencySymbol: "JOD", preferredPsp: "eFAWATEERcom" },
  { country: "Bahrain", countryAr: "البحرين", flag: "🇧🇭", city: "Manama", cityAr: "المنامة", currency: "BHD", currencySymbol: "BHD", preferredPsp: "BenefitPay" },
  { country: "Oman", countryAr: "عُمان", flag: "🇴🇲", city: "Muscat", cityAr: "مسقط", currency: "OMR", currencySymbol: "OMR", preferredPsp: "OmanNet" },
  { country: "Egypt", countryAr: "مصر", flag: "🇪🇬", city: "Cairo", cityAr: "القاهرة", currency: "EGP", currencySymbol: "EGP", preferredPsp: "Fawry/instaPay" },
];

export const DEFAULT_MARKET = MARKETS[0]; // UAE/AED

export function getMarketByCurrency(currency: string): Market {
  return MARKETS.find((m) => m.currency === currency) ?? DEFAULT_MARKET;
}

export const FLAT_DELIVERY_FEE: Record<string, number> = {
  AED: 2.49,
  SAR: 2.49,
  KWD: 0.21,
  QAR: 2.49,
  JOD: 0.79,
  BHD: 0.24,
  OMR: 0.24,
  EGP: 39.00,
};

export const SERVICE_FEE_RATE = 0.025; // 2.5% of subtotal, capped below

export const SERVICE_FEE_CAP: Record<string, number> = {
  AED: 3.0,
  SAR: 3.0,
  KWD: 0.25,
  QAR: 3.0,
  JOD: 0.95,
  BHD: 0.29,
  OMR: 0.29,
  EGP: 47.00,
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

