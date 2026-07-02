"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { MARKETS, Market, DEFAULT_MARKET, DEFAULT_CITY, CityEntry, FLAT_DELIVERY_FEE } from "@/lib/pricing";

export type Locale = "en" | "ar";

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  market: Market;
  setMarket: (m: Market) => void;
  city: CityEntry;
  setCity: (c: CityEntry) => void;
  currency: string;
  fmt: (amount: number) => string;
  deliveryFee: number;
  locating: boolean;
  locationSource: "gps" | "cached" | "default";
  userLocation: { lat: number; lng: number } | null;
}

const LOCALE_KEY = "wasla-souq-locale";
const MARKET_KEY = "wasla-souq-market";
const CITY_KEY = "wasla-souq-city";

// Haversine distance in km between two lat/lng points
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Find the nearest city (and its market) across all supported markets
function findNearestCity(lat: number, lng: number): { market: Market; city: CityEntry } {
  let best: { market: Market; city: CityEntry; dist: number } | null = null;
  for (const m of MARKETS) {
    for (const c of m.cities) {
      const d = distanceKm(lat, lng, c.lat, c.lng);
      if (!best || d < best.dist) best = { market: m, city: c, dist: d };
    }
  }
  return best ? { market: best.market, city: best.city } : { market: DEFAULT_MARKET, city: DEFAULT_CITY };
}

const dictionary: Record<string, { en: string; ar: string }> = {
  "header.cart": { en: "Cart", ar: "السلة" },
  "home.title": { en: "Restaurants near you", ar: "مطاعم بالقرب منك" },
  "home.trust.title": { en: "Flat delivery fee, always", ar: "رسوم توصيل ثابتة دائماً" },
  "home.trust.body": { en: "No surge pricing — the full price is shown before you order", ar: "بدون رسوم ذروة — السعر الكامل يظهر قبل الطلب" },
  "home.empty": { en: "No restaurants yet — run", ar: "لا توجد مطاعم بعد — شغّل" },
  "home.empty.or": { en: "or add one from", ar: "أو أضف مطعماً من" },
  "card.halal": { en: "Halal", ar: "حلال" },
  "card.min": { en: "min", ar: "د" },
  "restaurant.halalVerified": { en: "Halal verified", ar: "حلال موثّق" },
  "category.mains": { en: "Mains", ar: "الأطباق الرئيسية" },
  "category.sides": { en: "Sides", ar: "الأطباق الجانبية" },
  "category.drinks": { en: "Drinks", ar: "المشروبات" },
  "menu.add": { en: "Add", ar: "إضافة" },
  "cart.empty": { en: "Your cart is empty.", ar: "سلتك فارغة." },
  "cart.browse": { en: "Browse restaurants", ar: "تصفح المطاعم" },
  "cart.title": { en: "Your order", ar: "طلبك" },
  "cart.trust": { en: "No surge. Flat fee. Always shown upfront.", ar: "بدون رسوم ذروة. رسوم ثابتة. تظهر دائماً مسبقاً." },
  "cart.subtotal": { en: "Subtotal", ar: "المجموع الفرعي" },
  "cart.deliveryFee": { en: "Delivery fee (flat)", ar: "رسوم التوصيل (ثابتة)" },
  "cart.serviceFee": { en: "Service fee", ar: "رسوم الخدمة" },
  "cart.total": { en: "Total", ar: "الإجمالي" },
  "cart.checkout": { en: "Go to checkout", ar: "إتمام الطلب" },
  "checkout.empty": { en: "Your cart is empty — add something from a restaurant first.", ar: "سلتك فارغة — أضف شيئاً من مطعم أولاً." },
  "checkout.title": { en: "Checkout", ar: "إتمام الطلب" },
  "checkout.address": { en: "Delivery address", ar: "عنوان التوصيل" },
  "checkout.payment": { en: "Payment method", ar: "طريقة الدفع" },
  "checkout.card": { en: "Card", ar: "بطاقة" },
  "checkout.cash": { en: "Cash on delivery", ar: "الدفع عند الاستلام" },
  "checkout.demoNote": {
    en: "Demo checkout — no real payment is processed. A production build wires this to a PSP supporting mada, Jaywan, NAPS or KNET depending on market.",
    ar: "دفع تجريبي — لا تتم معالجة أي دفعة حقيقية.",
  },
  "checkout.placing": { en: "Placing order…", ar: "جارٍ إرسال الطلب…" },
  "checkout.place": { en: "Place order", ar: "إرسال الطلب" },
  "order.title": { en: "Order", ar: "الطلب" },
  "order.declined": { en: "Order was declined by the restaurant", ar: "تم رفض الطلب من قبل المطعم" },
  "order.cancelled": { en: "Order was cancelled", ar: "تم إلغاء الطلب" },
  "order.autoRefund": { en: "A full refund is issued automatically for this case.", ar: "يتم إصدار استرداد كامل تلقائياً في هذه الحالة." },
  "order.riderAssigned": { en: "Rider", ar: "السائق" },
  "order.riderNotAssigned": { en: "Rider not yet assigned", ar: "لم يتم تعيين سائق بعد" },
  "order.arriving": { en: "Arriving in ~{mins} minutes", ar: "الوصول خلال ~{mins} دقيقة" },
  "order.riderPending": { en: "A rider will be assigned once the restaurant marks your order ready", ar: "سيتم تعيين سائق بمجرد أن يضع المطعم طلبك كجاهز" },
  "order.step.placed": { en: "Order placed", ar: "تم استلام الطلب" },
  "order.step.accepted": { en: "Restaurant accepted", ar: "وافق المطعم" },
  "order.step.preparing": { en: "Kitchen preparing", ar: "المطبخ يحضّر الطلب" },
  "order.step.ready_for_pickup": { en: "Ready for pickup", ar: "جاهز للاستلام" },
  "order.step.rider_assigned": { en: "Rider assigned", ar: "تم تعيين السائق" },
  "order.step.on_the_way": { en: "On the way", ar: "في الطريق" },
  "order.step.delivered": { en: "Delivered", ar: "تم التوصيل" },
  "order.rate.title": { en: "Rate this order", ar: "قيّم هذا الطلب" },
  "order.rate.subtitle": { en: "How was the food and delivery?", ar: "كيف كانت الوجبة والتوصيل؟" },
  "order.rate.placeholder": { en: "Leave a review (optional)…", ar: "اكتب تقييماً (اختياري)…" },
  "order.rate.submit": { en: "Submit rating", ar: "إرسال التقييم" },
  "history.title": { en: "Order History", ar: "سجل الطلبات" },
  "history.empty": { en: "No past orders yet.", ar: "لا توجد طلبات سابقة بعد." },
  "history.reorder": { en: "↻ Reorder", ar: "↻ إعادة الطلب" },
  "history.viewOrder": { en: "View order", ar: "عرض الطلب" },
  "profile.title": { en: "Profile", ar: "الملف الشخصي" },
  "profile.addresses": { en: "Saved Addresses", ar: "العناوين المحفوظة" },
  "profile.payment": { en: "Payment Methods", ar: "طرق الدفع" },
  "profile.language": { en: "Language", ar: "اللغة" },
  "profile.support": { en: "Help & Support", ar: "المساعدة والدعم" },
  "profile.orders": { en: "Order History", ar: "سجل الطلبات" },
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [market, setMarketState] = useState<Market>(DEFAULT_MARKET);
  const [city, setCityState] = useState<CityEntry>(DEFAULT_CITY);
  const [locating, setLocating] = useState(true);
  const [locationSource, setLocationSource] = useState<"gps" | "cached" | "default">("default");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "en" || savedLocale === "ar") setLocaleState(savedLocale);

    // 1. Show a cached market/city immediately (avoids a flash of the default
    //    while we wait on the (slower) GPS permission prompt / fix).
    const savedCurrency = localStorage.getItem(MARKET_KEY);
    if (savedCurrency) {
      const m = MARKETS.find((m) => m.currency === savedCurrency);
      if (m) {
        setMarketState(m);
        const savedCity = localStorage.getItem(CITY_KEY);
        const c = m.cities.find((c) => c.name === savedCity) ?? m.cities[0];
        setCityState(c);
        setLocationSource("cached");
      }
    }

    // 2. Auto-detect via browser GPS, like Talabat/HungerStation — no manual
    //    country/city picker. Silently falls back to cached/default on
    //    denial, timeout, or unsupported browsers.
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { market: nearestMarket, city: nearestCity } = findNearestCity(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setMarketState(nearestMarket);
          setCityState(nearestCity);
          setLocationSource("gps");
          setLocating(false);
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          localStorage.setItem(MARKET_KEY, nearestMarket.currency);
          localStorage.setItem(CITY_KEY, nearestCity.name);
        },
        () => {
          // Permission denied / unavailable — keep cached or default value.
          setLocating(false);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
      );
    } else {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
  }

  function setMarket(m: Market) {
    setMarketState(m);
    localStorage.setItem(MARKET_KEY, m.currency);
    const defaultCity = m.cities[0];
    setCityState(defaultCity);
    localStorage.setItem(CITY_KEY, defaultCity.name);
  }

  function setCity(c: CityEntry) {
    setCityState(c);
    localStorage.setItem(CITY_KEY, c.name);
  }

  function fmt(amount: number) {
    const threeDecimal = ["KWD", "BHD", "OMR", "JOD"].includes(market.currency);
    return `${market.currencySymbol} ${amount.toFixed(threeDecimal ? 3 : 2)}`;
  }

  function t(key: string) {
    return dictionary[key]?.[locale] ?? key;
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        dir: locale === "ar" ? "rtl" : "ltr",
        setLocale,
        t,
        market,
        setMarket,
        city,
        setCity,
        currency: market.currency,
        fmt,
        deliveryFee: FLAT_DELIVERY_FEE[market.currency] ?? FLAT_DELIVERY_FEE.AED,
        locating,
        locationSource,
        userLocation,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

