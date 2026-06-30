import { listApprovedPartners } from "@/lib/db";
import RestaurantCard from "@/components/RestaurantCard";
import HomeIntro from "@/components/HomeIntro";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const partners = await listApprovedPartners();

  return (
    <div>
      <HomeIntro hasPartners={partners.length > 0} />

      <div className="space-y-2">
        {partners.map((p) => (
          <RestaurantCard
            key={p.id}
            id={p.id}
            name={p.name}
            nameAr={p.nameAr}
            cuisineTag={p.cuisineTag}
            heroEmoji={p.heroEmoji}
            ratingAvg={p.ratingAvg}
            etaMinsLow={p.etaMinsLow}
            etaMinsHigh={p.etaMinsHigh}
            halalVerified={p.halalVerified}
          />
        ))}
      </div>
    </div>
  );
}

