"use client";

import Link from "next/link";
import { Star, Clock } from "lucide-react";
import { useLocale } from "./LocaleContext";

interface Props {
  id: string;
  name: string;
  nameAr?: string | null;
  cuisineTag?: string | null;
  heroEmoji: string;
  ratingAvg: number;
  etaMinsLow: number;
  etaMinsHigh: number;
  halalVerified: boolean;
}

export default function RestaurantCard(p: Props) {
  const { locale, t } = useLocale();
  const displayName = locale === "ar" && p.nameAr ? p.nameAr : p.name;

  return (
    <Link
      href={`/restaurant/${p.id}`}
      className="flex items-center gap-3 rounded-2xl border border-transparent bg-paper p-3 transition hover:border-gold"
    >
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-claysoft text-2xl">
        {p.heroEmoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-ink">{displayName}</span>
          {p.halalVerified && (
            <span className="rounded-full bg-tealsoft px-2 py-0.5 text-[10px] font-bold text-teal">
              {t("card.halal")}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted">{p.cuisineTag}</div>
        <div className="mt-1.5 flex items-center gap-3 text-xs font-semibold text-inksoft">
          <span className="flex items-center gap-1">
            <Star size={12} className="fill-gold text-gold" />
            {p.ratingAvg.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {p.etaMinsLow}–{p.etaMinsHigh} {t("card.min")}
          </span>
        </div>
      </div>
    </Link>
  );
}

