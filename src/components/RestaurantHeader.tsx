"use client";

import { Star, Clock, ShieldCheck } from "lucide-react";
import { useLocale } from "./LocaleContext";

interface Props {
  heroEmoji: string;
  name: string;
  nameAr?: string | null;
  cuisineTag?: string | null;
  ratingAvg: number;
  etaMinsLow: number;
  etaMinsHigh: number;
  halalVerified: boolean;
}

export default function RestaurantHeader(p: Props) {
  const { locale, t } = useLocale();
  const displayName = locale === "ar" && p.nameAr ? p.nameAr : p.name;

  return (
    <div className="mb-5 rounded-2xl bg-paper p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-claysoft text-3xl">
          {p.heroEmoji}
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink">{displayName}</h1>
          <p className="text-sm text-muted">{p.cuisineTag}</p>
          <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-inksoft">
            <span className="flex items-center gap-1">
              <Star size={13} className="fill-gold text-gold" />
              {p.ratingAvg.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {p.etaMinsLow}–{p.etaMinsHigh} {t("card.min")}
            </span>
            {p.halalVerified && (
              <span className="flex items-center gap-1 text-teal">
                <ShieldCheck size={13} />
                {t("restaurant.halalVerified")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

