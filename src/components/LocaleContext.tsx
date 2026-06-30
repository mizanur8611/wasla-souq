"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Locale = "en" | "ar";

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = "wasla-souq-locale";

const dictionary: Record<string, { en: string; ar: string }> = {
  "header.location": { en: "Dubai", ar: "دبي" },
  "header.cart": { en: "Cart", ar: "السلة" },
  "home.title": { en: "Restaurants near you", ar: "مطاعم بالقرب منك" },
  "home.subtitle": { en: "Dubai Marina · delivering now", ar: "مرسى دبي · التوصيل متاح الآن" },
  "home.trust.title": { en: "Flat delivery fee, always", ar: "رسوم توصيل ثابتة دائماً" },
  "home.trust.body": {
    en: "No surge pricing — the full price is shown before you order",
    ar: "بدون رسوم ذروة — السعر الكامل يظهر قبل الطلب",
  },
  "home.empty": { en: "No restaurants yet — run", ar: "لا توجد مطاعم بعد — شغّل" },
  "home.empty.or": { en: "or add one from", ar: "أو أضف مطعماً من" },
  "card.halal": { en: "Halal", ar: "حلال" },
  "card.min": { en: "min", ar: "د" },
  "restaurant.halalVerified": { en: "Halal verified", ar: "حلال موثّق" },
  "category.mains": { en: "Mains", ar: "الأطباق الرئيسية" },
  "category.sides": { en: "Sides", ar: "الأطباق الجانبية" },
  "category.drinks": { en: "Drinks", ar: "المشروبات" },
  "menu.add": { en: "Add", ar: "إضافة" },
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "ar") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: string) {
    return dictionary[key]?.[locale] ?? key;
  }

  const dir = locale === "ar" ? "rtl" : "ltr";

  return <LocaleContext.Provider value={{ locale, dir, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

