"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Languages, History, User, ChevronDown } from "lucide-react";
import { useCart } from "./CartContext";
import { useLocale } from "./LocaleContext";
import { MARKETS } from "@/lib/pricing";

export default function Header() {
  const { itemCount } = useCart();
  const { locale, setLocale, t, market, setMarket } = useLocale();
  const [showMarkets, setShowMarkets] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMarkets(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowMarkets((s) => !s)}
              className="flex items-center gap-1 text-sm font-medium text-ink-soft"
            >
              <span className="text-base">{market.flag}</span>
              <span className="hidden sm:inline">{locale === "ar" ? market.cityAr : market.city}</span>
              <ChevronDown size={13} className="text-muted" />
            </button>

            {showMarkets && (
              <div className="absolute start-0 top-full z-50 mt-2 w-52 rounded-2xl border border-line bg-paper shadow-lg">
                <div className="p-1">
                  {MARKETS.map((m) => (
                    <button
                      key={m.currency}
                      onClick={() => { setMarket(m); setShowMarkets(false); }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition hover:bg-sand ${
                        market.currency === m.currency ? "font-bold text-teal" : "text-ink"
                      }`}
                    >
                      <span className="text-base">{m.flag}</span>
                      <div className="text-start">
                        <div className="leading-none">{locale === "ar" ? m.countryAr : m.country}</div>
                        <div className="text-[11px] text-muted">{m.currency} · {locale === "ar" ? m.cityAr : m.city}</div>
                      </div>
                      {market.currency === m.currency && <span className="ms-auto text-teal">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
