"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleContext";
import { Star } from "lucide-react";

interface HistoryOrder {
  id: string;
  status: string;
  total: number;
  partnerId: string;
  partnerName: string;
  partnerNameAr: string | null;
  partnerHeroEmoji: string;
  createdAt: string;
  customerRating: number | null;
  items: { name: string; quantity: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  placed: "Order placed",
  accepted: "Accepted",
  rejected: "Rejected",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  rider_assigned: "Rider assigned",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderHistoryPage() {
  const { locale, t } = useLocale();
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders);
  }, []);

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">{t("history.title")}</h1>

      {orders === null && <p className="text-sm text-muted">…</p>}
      {orders?.length === 0 && <p className="text-sm text-muted">{t("history.empty")}</p>}

      <div className="space-y-3">
        {orders?.map((o) => {
          const name = locale === "ar" && o.partnerNameAr ? o.partnerNameAr : o.partnerName;
          return (
            <div key={o.id} className="rounded-2xl bg-paper p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-claysoft text-lg">
                    {o.partnerHeroEmoji}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink">{name}</div>
                    <div className="text-xs text-muted">
                      {new Date(o.createdAt).toLocaleDateString()} · {STATUS_LABEL[o.status] || o.status}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-ink">AED {o.total.toFixed(2)}</div>
                  {o.customerRating && (
                    <div className="mt-1 flex items-center justify-end gap-0.5 text-xs font-bold text-gold">
                      <Star size={12} className="fill-gold text-gold" />
                      {o.customerRating}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 text-xs text-muted">
                {o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href={`/order/${o.id}`}
                  className="flex-1 rounded-xl border border-line py-2 text-center text-xs font-bold text-ink-soft"
                >
                  {t("history.viewOrder")}
                </Link>
                <Link
                  href={`/restaurant/${o.partnerId}`}
                  className="flex-1 rounded-xl bg-tealsoft py-2 text-center text-xs font-bold text-teal"
                >
                  {t("history.reorder")}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

