"use client";

import { useState } from "react";
import { CheckCircle2, Circle, XCircle, Star } from "lucide-react";
import { useLocale } from "@/components/LocaleContext";

const STEP_KEYS = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "on_the_way",
  "delivered",
] as const;

interface OrderData {
  id: string;
  status: string;
  total: number;
  partner: { name: string; nameAr?: string | null };
  fulfilment: { riderName: string; etaMins: number } | null;
  items: { id: string; nameSnapshot: string; quantity: number; unitPrice: number }[];
  customerRating?: number | null;
}

export default function OrderStatus({ order }: { order: OrderData }) {
  const { locale, t } = useLocale();
  const partnerName = locale === "ar" && order.partner.nameAr ? order.partner.nameAr : order.partner.name;
  const orderRef = order.id.slice(-8).toUpperCase();

  if (order.status === "rejected" || order.status === "cancelled") {
    return (
      <div>
        <h1 className="mb-1 font-display text-xl font-bold text-ink">
          {t("order.title")} #{orderRef}
        </h1>
        <p className="mb-5 text-sm text-muted">{partnerName}</p>
        <div className="flex items-center gap-3 rounded-2xl bg-claysoft p-4 text-clay">
          <XCircle size={22} className="flex-shrink-0" />
          <div>
            <div className="font-display text-sm font-bold">
              {order.status === "rejected" ? t("order.declined") : t("order.cancelled")}
            </div>
            <div className="text-xs opacity-80">{t("order.autoRefund")}</div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = Math.max(STEP_KEYS.findIndex((s) => s === order.status), 0);
  const hasRider = !!order.fulfilment?.riderName;
  const isDelivered = order.status === "delivered";

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-bold text-ink">
        {t("order.title")} #{orderRef}
      </h1>
      <p className="mb-5 text-sm text-muted">{partnerName}</p>

      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-ink p-4 text-sand">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-base">🛵</div>
        <div>
          <div className="text-sm font-bold">
            {hasRider ? `${t("order.riderAssigned")}: ${order.fulfilment!.riderName}` : t("order.riderNotAssigned")}
          </div>
          <div className="text-xs text-[#AFC2CC]">
            {hasRider
              ? t("order.arriving").replace("{mins}", String(order.fulfilment!.etaMins))
              : t("order.riderPending")}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-paper p-4">
        {STEP_KEYS.map((key, i) => {
          const done = i <= currentStepIndex;
          return (
            <div key={key} className="flex items-start gap-3 pb-5 last:pb-0">
              {done ? (
                <CheckCircle2 size={20} className="flex-shrink-0 text-teal" />
              ) : (
                <Circle size={20} className="flex-shrink-0 text-line" />
              )}
              <span className={`text-sm font-semibold ${done ? "text-ink" : "text-muted"}`}>
                {t(`order.step.${key}`)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-paper p-4 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-line py-2 last:border-0">
            <span>
              {item.nameSnapshot} × {item.quantity}
            </span>
            <span className="font-mono">AED {(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t-2 border-ink pt-3 font-display text-base font-bold">
          <span>{t("cart.total")}</span>
          <span className="font-mono">AED {order.total.toFixed(2)}</span>
        </div>
      </div>

      {isDelivered && <RateOrder orderId={order.id} existingRating={order.customerRating} />}
    </div>
  );
}

function RateOrder({ orderId, existingRating }: { orderId: string; existingRating?: number | null }) {
  const { t } = useLocale();
  const [rating, setRating] = useState(existingRating || 0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(!!existingRating);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetch(`/api/orders/${orderId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review }),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-5 rounded-2xl bg-tealsoft p-4 text-center text-sm font-semibold text-teal">
        ✓ Thanks for rating this order {rating ? `(${rating}/5)` : ""}!
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl bg-paper p-4">
      <div className="mb-1 font-display text-sm font-bold text-ink">{t("order.rate.title")}</div>
      <p className="mb-3 text-xs text-muted">{t("order.rate.subtitle")}</p>
      <div className="mb-3 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star size={28} className={n <= rating ? "fill-gold text-gold" : "text-line"} />
          </button>
        ))}
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder={t("order.rate.placeholder")}
        className="h-16 w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
      <button
        onClick={submit}
        disabled={!rating || submitting}
        className="mt-3 w-full rounded-xl bg-ink py-2.5 text-sm font-bold text-sand disabled:opacity-60"
      >
        {submitting ? "…" : t("order.rate.submit")}
      </button>
    </div>
  );
}

