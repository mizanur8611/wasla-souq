"use client";

import { useEffect, useState } from "react";
import RestaurantCard from "@/components/RestaurantCard";
import HomeIntro from "@/components/HomeIntro";
import { useLocale } from "@/components/LocaleContext";

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
}

export default function HomePage() {
  const { market } = useLocale();
  const [partners, setPartners] = useState<Partner[] | null>(null);

  useEffect(() => {
    setPartners(null);
    fetch(`/api/partners?city=${encodeURIComponent(market.city)}`)
      .then((r) => r.json())
      .then(setPartners)
      .catch(() => setPartners([]));
  }, [market.city]);

  return (
    <div>
      <HomeIntro hasPartners={!!partners && partners.length > 0} />

      {partners === null ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-paper" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-2xl bg-paper p-6 text-center text-sm text-muted">
          No restaurants yet in {market.city} — coming soon! 🚀
        </div>
      ) : (
        <div className="space-y-2">
          {partners.map((p) => (
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
