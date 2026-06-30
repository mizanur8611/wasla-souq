import { getPartnerById } from "@/lib/db";
import MenuList from "@/components/MenuList";
import RestaurantHeader from "@/components/RestaurantHeader";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ params }: { params: { id: string } }) {
  const partner = await getPartnerById(params.id);

  if (!partner) notFound();

  return (
    <div>
      <RestaurantHeader
        heroEmoji={partner.heroEmoji}
        name={partner.name}
        nameAr={partner.nameAr}
        cuisineTag={partner.cuisineTag}
        ratingAvg={partner.ratingAvg}
        etaMinsLow={partner.etaMinsLow}
        etaMinsHigh={partner.etaMinsHigh}
        halalVerified={partner.halalVerified}
      />

      <MenuList
        partnerId={partner.id}
        partnerName={partner.name}
        items={partner.catalogItems}
        currency={partner.city.currency}
      />
    </div>
  );
}

