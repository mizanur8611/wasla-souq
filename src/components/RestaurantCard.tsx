"use client";

import Link from "next/link";
import { Star, Clock, MapPinned, Truck } from "lucide-react";
import { useLocale } from "./LocaleContext";

interface Props {
  id: string;
  name: string;
  nameAr?: string | null;
  cuisineTag?: string | null;
  heroEmoji: string;
  heroImageUrl?: string | null;
  ratingAvg: number;
  etaMinsLow: number;
  etaMinsHigh: number;
  halalVerified: boolean;
  distanceKm?: number | null;
}

export default function RestaurantCard(p: Props) {
  const { locale, t, fmt, deliveryFee } = useLocale();
  const displayName = locale === "ar" && p.nameAr ? p.nameAr : p.name;

  return (
    <Link
      href={`/restaurant/${p.id}`}
      className="block overflow-hidden rounded-2xl border border-transparent bg-paper transition hover:border-gold"
    >
      {/* Hero image / emoji banner — Talabat/HungerStation-style image-forward card */}
      <div className="relative h-32 w-full bg-claysoft">
        {p.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.heroImageUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">{p.heroEmoji}</div>
        )}

        <div className="absolute inset-x-2 top-2 flex items-center justify-between">
          {p.halalVerified && (
            <span className="rounded-full bg-paper/95 px-2 py-0.5 text-[10px] font-bold text-teal shadow-sm">
              {t("card.halal")}
            </span>
          )}
          <span className="ms-auto flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-bold text-sand shadow-sm">
            <Star size={10} className="fill-gold text-gold" />
            {p.ratingAvg.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="p-3">
        <div className="font-display text-sm font-bold text-ink">{displayName}</div>
        {p.cuisineTag && <div className="mt-0.5 truncate text-xs text-muted">{p.cuisineTag}</div>}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-inksoft">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {p.etaMinsLow}–{p.etaMinsHigh} {t("card.min")}
          </span>
          <span className="flex items-center gap-1">
            <Truck size={12} />
            {fmt(deliveryFee)}
          </span>
          {p.distanceKm != null && (
            <span className="flex items-center gap-1 text-teal">
              <MapPinned size={12} />
              {p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

