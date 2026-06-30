"use client";

import Link from "next/link";
import { ShoppingCart, MapPin, Languages, History, User } from "lucide-react";
import { useCart } from "./CartContext";
import { useLocale } from "./LocaleContext";

export default function Header() {
  const { itemCount } = useCart();
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-sand/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-ink">Wasla Souq</span>
          <span
            className="font-display text-sm text-gold"
            style={{ fontFamily: "var(--font-arabic, var(--font-display))" }}
          >
            وصلة سوق
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 text-sm font-medium text-ink-soft sm:flex">
            <MapPin size={15} />
            {t("header.location")}
          </div>

          <Link
            href="/order/history"
            className="hidden items-center justify-center rounded-full p-2 text-ink-soft transition hover:bg-paper sm:flex"
            aria-label="Order history"
          >
            <History size={17} />
          </Link>

          <Link
            href="/profile"
            className="hidden items-center justify-center rounded-full p-2 text-ink-soft transition hover:bg-paper sm:flex"
            aria-label="Profile"
          >
            <User size={17} />
          </Link>

          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-2 text-xs font-bold text-ink-soft transition hover:border-gold"
            aria-label="Switch language"
          >
            <Languages size={14} />
            {locale === "en" ? "العربية" : "English"}
          </button>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand"
          >
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

