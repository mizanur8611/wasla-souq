"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Search, Map as MapIconOutline } from "lucide-react";
import RestaurantCard from "@/components/RestaurantCard";
import HomeIntro from "@/components/HomeIntro";
import { useLocale, distanceKm } from "@/components/LocaleContext";
import type { MapPartner } from "@/components/RestaurantsMap";

const RestaurantsMap = dynamic(() => import("@/components/RestaurantsMap"), { ssr: false });

interface Partner {
  id: string;
  name: string;
  nameAr: string | null;
  cuisineTag: string | null;
  heroEmoji: string;
  heroImageUrl: string | null;
  ratingAvg: number;
  etaMinsLow: number;
  etaMinsHigh: number;
  halalVerified: boolean;
  lat: number | null;
  lng: number | null;
  menuPreview: MapPartner["menuPreview"];
}

type SortOption = "recommended" | "rating" | "fastest" | "nearest";

export default function HomePage() {
  const { locale, t, city, userLocation } = useLocale();
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [query, setQuery] = useState("");
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("recommended");

  useEffect(() => {
    setPartners(null);
    setQuery("");
    setActiveCuisine(null);
    fetch(`/api/partners?city=${encodeURIComponent(city.name)}`)
      .then((r) => r.json())
      .then(setPartners)
      .catch(() => setPartners([]));
  }, [city.name]);

  // Cuisine chips — Talabat/HungerStation-style quick filters, built from whatever
  // cuisineTag values actually exist for this city (top 8 by frequency).
  const cuisines = useMemo(() => {
    if (!partners) return [];
    const counts = new Map<string, number>();
    for (const p of partners) {
      if (!p.cuisineTag) continue;
      counts.set(p.cuisineTag, (counts.get(p.cuisineTag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag]) => tag);
  }, [partners]);

  const withDistance = useMemo(() => {
    if (!partners) return [];
    return partners.map((p) => ({
      ...p,
      distanceKm:
        userLocation && p.lat != null && p.lng != null
          ? distanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng)
          : null,
    }));
  }, [partners, userLocation]);

  const filtered = useMemo(() => {
    let list = withDistance;
    if (activeCuisine) list = list.filter((p) => p.cuisineTag === activeCuisine);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameAr ?? "").includes(q) ||
          (p.cuisineTag ?? "").toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === "rating") sorted.sort((a, b) => b.ratingAvg - a.ratingAvg);
    else if (sort === "fastest") sorted.sort((a, b) => a.etaMinsLow - b.etaMinsLow);
    else if (sort === "nearest") sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return sorted;
  }, [withDistance, activeCuisine, query, sort]);

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "recommended", label: locale === "ar" ? "موصى به" : "Recommended" },
    { key: "rating", label: locale === "ar" ? "الأعلى تقييماً" : "Top rated" },
    { key: "fastest", label: locale === "ar" ? "الأسرع توصيلاً" : "Fastest delivery" },
    ...(userLocation ? [{ key: "nearest" as SortOption, label: locale === "ar" ? "الأقرب" : "Nearest" }] : []),
  ];

  return (
    <div>
      <HomeIntro hasPartners={!!partners && partners.length > 0} />

      {partners !== null && partners.length > 0 && (
        <>
          {/* Search bar */}
          <div className="mb-3 flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5">
            <Search size={16} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={locale === "ar" ? "ابحث عن مطعم أو مطبخ…" : "Search restaurants or cuisines…"}
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
          </div>

          {/* Cuisine filter chips */}
          {cuisines.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCuisine(null)}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  activeCuisine === null ? "bg-ink text-sand" : "bg-paper text-ink-soft"
                }`}
              >
                {locale === "ar" ? "الكل" : "All"}
              </button>
              {cuisines.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCuisine(c === activeCuisine ? null : c)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    activeCuisine === c ? "bg-ink text-sand" : "bg-paper text-ink-soft"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Sort chips + small map toggle (map is secondary here, not the primary browse mode) */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex gap-2 overflow-x-auto">
              {sortOptions.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                    sort === s.key ? "border-teal text-teal" : "border-line text-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setView(view === "list" ? "map" : "list")}
              className="flex flex-shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-bold text-ink-soft"
              title={locale === "ar" ? "عرض الخريطة" : "Map view"}
            >
              <MapIconOutline size={12} />
              {view === "list" ? (locale === "ar" ? "خريطة" : "Map") : (locale === "ar" ? "قائمة" : "List")}
            </button>
          </div>
        </>
      )}

      {partners === null ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-paper" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-2xl bg-paper p-6 text-center text-sm text-muted">
          No restaurants yet in {city.name} — coming soon! 🚀
        </div>
      ) : view === "map" ? (
        <RestaurantsMap partners={filtered} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-paper p-6 text-center text-sm text-muted">
          {locale === "ar" ? "لا توجد نتائج مطابقة" : "No restaurants match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <RestaurantCard
              key={p.id}
              id={p.id}
              name={p.name}
              nameAr={p.nameAr}
              cuisineTag={p.cuisineTag}
              heroEmoji={p.heroEmoji}
              heroImageUrl={p.heroImageUrl}
              ratingAvg={p.ratingAvg}
              etaMinsLow={p.etaMinsLow}
              etaMinsHigh={p.etaMinsHigh}
              halalVerified={p.halalVerified}
              distanceKm={p.distanceKm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
