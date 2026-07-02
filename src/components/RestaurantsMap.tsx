"use client";

// Home-page "map view" — shows every restaurant in the current city as a pin, and
// popping a pin open shows a quick menu preview (name/price for a few items) plus a
// link into the full restaurant page. Distance badges use the user's live GPS fix from
// LocaleContext when available (falls back to just showing the city, no distance, if the
// person denied location access).

import dynamic from "next/dynamic";
import Link from "next/link";
import { Star, Clock, MapPinned } from "lucide-react";
import { useLocale, distanceKm } from "./LocaleContext";
import type { MapPin } from "./LiveMap";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

interface MenuPreviewItem {
  name: string;
  nameAr: string | null;
  price: number;
}

export interface MapPartner {
  id: string;
  name: string;
  nameAr: string | null;
  cuisineTag: string | null;
  heroEmoji: string;
  ratingAvg: number;
  etaMinsLow: number;
  etaMinsHigh: number;
  halalVerified: boolean;
  lat: number | null;
  lng: number | null;
  menuPreview: MenuPreviewItem[];
}

function PartnerPopup({ p, distance }: { p: MapPartner; distance: number | null }) {
  const { locale, t, fmt } = useLocale();
  const displayName = locale === "ar" && p.nameAr ? p.nameAr : p.name;

  return (
    <div className="min-w-[190px] space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-lg leading-none">{p.heroEmoji}</span>
        <span className="font-display text-sm font-bold text-ink">{displayName}</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-inksoft">
        <span className="flex items-center gap-1">
          <Star size={11} className="fill-gold text-gold" />
          {p.ratingAvg.toFixed(1)}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {p.etaMinsLow}–{p.etaMinsHigh} {t("card.min")}
        </span>
        {distance !== null && (
          <span className="flex items-center gap-1 text-teal">
            <MapPinned size={11} />
            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
          </span>
        )}
      </div>
      {p.cuisineTag && <div className="text-[11px] text-muted">{p.cuisineTag}</div>}

      {p.menuPreview.length > 0 && (
        <ul className="space-y-0.5 border-t border-line pt-1.5">
          {p.menuPreview.map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-[11px] text-ink-soft">
              <span className="truncate">{locale === "ar" && item.nameAr ? item.nameAr : item.name}</span>
              <span className="flex-shrink-0 font-semibold text-ink">{fmt(item.price)}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/restaurant/${p.id}`}
        className="mt-1.5 block rounded-full bg-ink px-3 py-1.5 text-center text-[11px] font-bold text-sand"
      >
        {locale === "ar" ? "عرض القائمة الكاملة" : "View full menu"}
      </Link>
    </div>
  );
}

export default function RestaurantsMap({ partners }: { partners: MapPartner[] }) {
  const { city, userLocation } = useLocale();

  const withLocation = partners.filter((p): p is MapPartner & { lat: number; lng: number } => p.lat != null && p.lng != null);

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [city.lat, city.lng];

  const pins: MapPin[] = withLocation.map((p) => {
    const distance = userLocation ? distanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng) : null;
    return {
      lat: p.lat,
      lng: p.lng,
      emoji: p.heroEmoji,
      color: "#11645B",
      popupContent: <PartnerPopup p={p} distance={distance} />,
    };
  });

  if (userLocation) {
    pins.push({ lat: userLocation.lat, lng: userLocation.lng, emoji: "📍", color: "#C99A3C", label: "You" });
  }

  if (withLocation.length === 0) {
    return (
      <div className="rounded-2xl bg-paper p-6 text-center text-sm text-muted">
        No restaurant locations to show in {city.name} yet.
      </div>
    );
  }

  return <LiveMap pins={pins} center={center} zoom={12} height={420} />;
}
