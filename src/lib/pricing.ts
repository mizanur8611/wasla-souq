// Centralised pricing. The "no surge, ever" promise is enforced HERE.

export interface CityEntry {
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
}

export interface Market {
  country: string;
  countryAr: string;
  flag: string;
  cities: CityEntry[];
  currency: string;
  currencySymbol: string;
  preferredPsp: string;
}

export const MARKETS: Market[] = [
  {
    country: "UAE", countryAr: "الإمارات", flag: "🇦🇪", currency: "AED", currencySymbol: "AED", preferredPsp: "Jaywan/mada",
    cities: [
      { name: "Dubai", nameAr: "دبي", lat: 25.2048, lng: 55.2708 },
      { name: "Abu Dhabi", nameAr: "أبوظبي", lat: 24.4539, lng: 54.3773 },
      { name: "Sharjah", nameAr: "الشارقة", lat: 25.3462, lng: 55.4209 },
      { name: "Ajman", nameAr: "عجمان", lat: 25.4052, lng: 55.5136 },
      { name: "Ras Al Khaimah", nameAr: "رأس الخيمة", lat: 25.7895, lng: 55.9432 },
    ],
  },
  {
    country: "Saudi Arabia", countryAr: "السعودية", flag: "🇸🇦", currency: "SAR", currencySymbol: "SAR", preferredPsp: "mada",
    cities: [
      { name: "Riyadh", nameAr: "الرياض", lat: 24.7136, lng: 46.6753 },
      { name: "Jeddah", nameAr: "جدة", lat: 21.4858, lng: 39.1925 },
      { name: "Mecca", nameAr: "مكة المكرمة", lat: 21.3891, lng: 39.8579 },
      { name: "Medina", nameAr: "المدينة المنورة", lat: 24.5247, lng: 39.5692 },
      { name: "Dammam", nameAr: "الدمام", lat: 26.4207, lng: 50.0888 },
      { name: "Al Khobar", nameAr: "الخبر", lat: 26.2172, lng: 50.1971 },
      { name: "Abha", nameAr: "أبها", lat: 18.2164, lng: 42.5053 },
      { name: "Taif", nameAr: "الطائف", lat: 21.2854, lng: 40.4152 },
      { name: "Tabuk", nameAr: "تبوك", lat: 28.3835, lng: 36.5662 },
      { name: "Najran", nameAr: "نجران", lat: 17.4927, lng: 44.1277 },
    ],
  },
  {
    country: "Kuwait", countryAr: "الكويت", flag: "🇰🇼", currency: "KWD", currencySymbol: "KWD", preferredPsp: "KNET",
    cities: [
      { name: "Kuwait City", nameAr: "مدينة الكويت", lat: 29.3697, lng: 47.9783 },
      { name: "Salmiya", nameAr: "السالمية", lat: 29.3399, lng: 48.0762 },
      { name: "Hawalli", nameAr: "حولي", lat: 29.3372, lng: 48.0288 },
      { name: "Farwaniya", nameAr: "الفروانية", lat: 29.2768, lng: 47.9596 },
      { name: "Ahmadi", nameAr: "الأحمدي", lat: 29.0769, lng: 48.0838 },
      { name: "Jahra", nameAr: "الجهراء", lat: 29.3378, lng: 47.6581 },
    ],
  },
  {
    country: "Qatar", countryAr: "قطر", flag: "🇶🇦", currency: "QAR", currencySymbol: "QAR", preferredPsp: "NAPS",
    cities: [
      { name: "Doha", nameAr: "الدوحة", lat: 25.2854, lng: 51.5310 },
      { name: "Al Rayyan", nameAr: "الريان", lat: 25.2568, lng: 51.4311 },
      { name: "Al Wakrah", nameAr: "الوكرة", lat: 25.1656, lng: 51.6031 },
      { name: "Lusail", nameAr: "لوسيل", lat: 25.4231, lng: 51.4897 },
    ],
  },
  {
    country: "Jordan", countryAr: "الأردن", flag: "🇯🇴", currency: "JOD", currencySymbol: "JOD", preferredPsp: "eFAWATEERcom",
    cities: [
      { name: "Amman", nameAr: "عمّان", lat: 31.9554, lng: 35.9234 },
      { name: "Zarqa", nameAr: "الزرقاء", lat: 32.0728, lng: 36.0879 },
      { name: "Irbid", nameAr: "إربد", lat: 32.5556, lng: 35.8500 },
      { name: "Aqaba", nameAr: "العقبة", lat: 29.5316, lng: 35.0063 },
    ],
  },
  {
    country: "Bahrain", countryAr: "البحرين", flag: "🇧🇭", currency: "BHD", currencySymbol: "BHD", preferredPsp: "BenefitPay",
    cities: [
      { name: "Manama", nameAr: "المنامة", lat: 26.2235, lng: 50.5876 },
      { name: "Riffa", nameAr: "الرفاع", lat: 26.1297, lng: 50.5550 },
      { name: "Muharraq", nameAr: "المحرق", lat: 26.2576, lng: 50.6128 },
      { name: "Hamad Town", nameAr: "مدينة حمد", lat: 26.1106, lng: 50.5071 },
    ],
  },
  {
    country: "Oman", countryAr: "عُمان", flag: "🇴🇲", currency: "OMR", currencySymbol: "OMR", preferredPsp: "OmanNet",
    cities: [
      { name: "Muscat", nameAr: "مسقط", lat: 23.5880, lng: 58.3829 },
      { name: "Salalah", nameAr: "صلالة", lat: 17.0151, lng: 54.0924 },
      { name: "Nizwa", nameAr: "نزوى", lat: 22.9333, lng: 57.5333 },
      { name: "Sohar", nameAr: "صحار", lat: 24.3470, lng: 56.7395 },
    ],
  },
  {
    country: "Egypt", countryAr: "مصر", flag: "🇪🇬", currency: "EGP", currencySymbol: "EGP", preferredPsp: "Fawry/instaPay",
    cities: [
      { name: "Cairo", nameAr: "القاهرة", lat: 30.0444, lng: 31.2357 },
      { name: "Alexandria", nameAr: "الإسكندرية", lat: 31.2001, lng: 29.9187 },
      { name: "Giza", nameAr: "الجيزة", lat: 30.0131, lng: 31.2089 },
      { name: "Sharm El Sheikh", nameAr: "شرم الشيخ", lat: 27.9158, lng: 34.3299 },
      { name: "Hurghada", nameAr: "الغردقة", lat: 27.2579, lng: 33.8116 },
    ],
  },
];

export const DEFAULT_MARKET = MARKETS[0];
export const DEFAULT_CITY = MARKETS[0].cities[0];

export function getMarketByCurrency(currency: string): Market {
  return MARKETS.find((m) => m.currency === currency) ?? DEFAULT_MARKET;
}

export const FLAT_DELIVERY_FEE: Record<string, number> = {
  AED: 2.49, SAR: 2.49, KWD: 0.21, QAR: 2.49, JOD: 0.79, BHD: 0.24, OMR: 0.24, EGP: 39.00,
};

export const SERVICE_FEE_RATE = 0.025;

export const SERVICE_FEE_CAP: Record<string, number> = {
  AED: 3.0, SAR: 3.0, KWD: 0.25, QAR: 3.0, JOD: 0.95, BHD: 0.29, OMR: 0.29, EGP: 47.00,
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
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    serviceFee: Math.round(serviceFee * 100) / 100,
    total: Math.round((subtotal + deliveryFee + serviceFee) * 100) / 100,
    currency,
  };
}

