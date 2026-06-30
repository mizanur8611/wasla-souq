import { listApprovedPartners } from "@/lib/db";
import RestaurantCard from "@/components/RestaurantCard";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const partners = await listApprovedPartners();

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-ink">Restaurants near you</h1>
        <p className="mt-1 text-sm text-muted">Dubai Marina · delivering now</p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-teal p-4 text-paper">
        <ShieldCheck size={22} className="flex-shrink-0" />
        <div>
          <div className="font-display text-sm font-bold">Flat delivery fee, always</div>
          <div className="text-xs opacity-85">No surge pricing — the full price is shown before you order</div>
        </div>
      </div>

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
        {partners.length === 0 && (
          <div className="rounded-2xl bg-paper p-6 text-center text-sm text-muted">
            No restaurants yet — run <code className="rounded bg-sanddeep px-1.5 py-0.5">npm run db:seed</code> or add
            one from <a href="/admin" className="text-teal underline">/admin</a>.
          </div>
        )}
      </div>
    </div>
  );
}
