"use client";

import Link from "next/link";
import { ShoppingCart, Languages, History, User, MapPin, LocateFixed } from "lucide-react";
import { useCart } from "./CartContext";
import { useLocale } from "./LocaleContext";

export default function Header() {
  const { itemCount } = useCart();
  const { locale, setLocale, t, city, locating, locationSource } = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-sand/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-ink">Wasla Souq</span>
          <span className="font-display text-sm text-gold" style={{ fontFamily: "var(--font-arabic, var(--font-display))" }}>
            وصلة سوق
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Auto-detected location (GPS-based, no manual picker — matches Talabat/HungerStation UX) */}
          <div
            className="flex items-center gap-1 text-sm font-medium text-ink-soft"
            title={locationSource === "gps" ? (locale === "ar" ? "تم الكشف عبر GPS" : "Detected via GPS") : undefined}
          >
            {locating ? (
              <LocateFixed size={15} className="animate-pulse text-muted" />
            ) : (
              <MapPin size={15} />
            )}
            <span className="hidden sm:inline">
              {locating ? (locale === "ar" ? "جارٍ تحديد الموقع…" : "Locating…") : locale === "ar" ? city.nameAr : city.name}
            </span>
          </div>

          <Link href="/order/history" className="hidden items-center justify-center rounded-full p-2 text-ink-soft transition hover:bg-paper sm:flex">
            <History size={17} />
          </Link>
          <Link href="/profile" className="hidden items-center justify-center rounded-full p-2 text-ink-soft transition hover:bg-paper sm:flex">
            <User size={17} />
          </Link>

          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-2 text-xs font-bold text-ink-soft transition hover:border-gold"
          >
            <Languages size={14} />
            {locale === "en" ? "العربية" : "English"}
          </button>

          <Link href="/cart" className="relative flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand">
            <ShoppingCart size={16} />
            {t("header.cart")}
            {itemCount > 0 && (
              <span className="absolute -end-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
