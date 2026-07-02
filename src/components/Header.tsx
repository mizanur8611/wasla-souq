"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Languages, History, User, ChevronDown, MapPin, ChevronRight } from "lucide-react";
import { useCart } from "./CartContext";
import { useLocale } from "./LocaleContext";
import { MARKETS } from "@/lib/pricing";

export default function Header() {
  const { itemCount } = useCart();
  const { locale, setLocale, t, market, setMarket, city, setCity } = useLocale();
  const [showMarkets, setShowMarkets] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMarkets(false);
        setHoveredCountry(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hoveredMarket = MARKETS.find((m) => m.currency === hoveredCountry) ?? null;

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
          {/* Country + City selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setShowMarkets((s) => !s); setHoveredCountry(market.currency); }}
              className="flex items-center gap-1 text-sm font-medium text-ink-soft"
            >
              <MapPin size={15} />
              <span className="hidden sm:inline">{locale === "ar" ? city.nameAr : city.name}</span>
              <ChevronDown size={13} className="text-muted" />
            </button>

            {showMarkets && (
              <div className="absolute start-0 top-full z-50 mt-2 flex rounded-2xl border border-line bg-paper shadow-lg">
                {/* Country list */}
                <div className="w-48 border-e border-line p-1">
                  {MARKETS.map((m) => (
                    <button
                      key={m.currency}
                      onMouseEnter={() => setHoveredCountry(m.currency)}
                      onClick={() => setHoveredCountry(m.currency)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-sand ${
                        market.currency === m.currency ? "font-bold text-teal" : "text-ink"
                      }`}
                    >
                      <span className="text-lg leading-none">{m.flag}</span>
                      <span className="flex-1 text-start text-xs">{locale === "ar" ? m.countryAr : m.country}</span>
                      <ChevronRight size={12} className="text-muted" />
                    </button>
                  ))}
                </div>

                {/* City list */}
                {hoveredMarket && (
                  <div className="w-44 p-1">
                    <div className="mb-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                      {hoveredMarket.flag} {locale === "ar" ? hoveredMarket.countryAr : hoveredMarket.country} · {hoveredMarket.currency}
                    </div>
                    {hoveredMarket.cities.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          if (hoveredMarket.currency !== market.currency) setMarket(hoveredMarket);
                          setCity(c);
                          setShowMarkets(false);
                          setHoveredCountry(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition hover:bg-sand ${
                          market.currency === hoveredMarket.currency && city.name === c.name
                            ? "font-bold text-teal"
                            : "text-ink"
                        }`}
                      >
                        <span>{locale === "ar" ? c.nameAr : c.name}</span>
                        {market.currency === hoveredMarket.currency && city.name === c.name && (
                          <span className="text-teal">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
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
