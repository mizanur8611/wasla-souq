"use client";

import { CheckCircle2, Circle, XCircle } from "lucide-react";
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
    </div>
  );
}

