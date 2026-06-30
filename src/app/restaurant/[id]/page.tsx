import { getPartnerById } from "@/lib/db";
import MenuList from "@/components/MenuList";
import { notFound } from "next/navigation";
import { Star, Clock, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ params }: { params: { id: string } }) {
  const partner = await getPartnerById(params.id);

  if (!partner) notFound();

  return (
    <div>
      <div className="mb-5 rounded-2xl bg-paper p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-claysoft text-3xl">
            {partner.heroEmoji}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink">{partner.name}</h1>
            <p className="text-sm text-muted">{partner.cuisineTag}</p>
            <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-inksoft">
              <span className="flex items-center gap-1">
                <Star size={13} className="fill-gold text-gold" />
                {partner.ratingAvg.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {partner.etaMinsLow}–{partner.etaMinsHigh} min
              </span>
              {partner.halalVerified && (
                <span className="flex items-center gap-1 text-teal">
                  <ShieldCheck size={13} />
                  Halal verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <MenuList
        partnerId={partner.id}
        partnerName={partner.name}
        items={partner.catalogItems}
        currency={partner.city.currency}
      />
    </div>
  );
}
