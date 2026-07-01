"use client";

import { useCart } from "@/components/CartContext";
import { useLocale } from "@/components/LocaleContext";
import { computePriceBreakdown } from "@/lib/pricing";
import Link from "next/link";
import { Minus, Plus, Trash2, ShieldCheck } from "lucide-react";

export default function CartPage() {
  const { lines, partnerName, subtotal, updateQty, removeItem } = useCart();
  const { locale, t, currency, fmt } = useLocale();
  const breakdown = computePriceBreakdown(subtotal, currency);

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl bg-paper p-8 text-center">
        <p className="text-sm text-muted">{t("cart.empty")}</p>
        <Link href="/" className="mt-3 inline-block rounded-full bg-ink px-5 py-2 text-sm font-semibold text-sand">
          {t("cart.browse")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-bold text-ink">{t("cart.title")}</h1>
      <p className="mb-4 text-sm text-muted">{partnerName}</p>

      <div className="space-y-2">
        {lines.map((line) => {
          const displayName = locale === "ar" && line.nameAr ? line.nameAr : line.name;
          return (
            <div key={line.catalogItemId} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">{displayName}</div>
                <div className="mt-0.5 font-mono text-xs text-teal">{fmt(line.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(line.catalogItemId, line.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-sanddeep text-ink"
                  aria-label={`Decrease ${displayName} quantity`}
                >
                  <Minus size={13} />
                </button>
                <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                <button
                  onClick={() => updateQty(line.catalogItemId, line.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-sanddeep text-ink"
                  aria-label={`Increase ${displayName} quantity`}
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => removeItem(line.catalogItemId)}
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-clay"
                  aria-label={`Remove ${displayName}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-goldsoft p-3 text-xs font-bold text-[#8a611f]">
        <ShieldCheck size={16} className="flex-shrink-0" />
        {t("cart.trust")}
      </div>

      <div className="mt-4 rounded-2xl bg-paper p-4 text-sm">
        <Row label={t("cart.subtotal")} value={breakdown.subtotal} fmt={fmt} />
        <Row label={t("cart.deliveryFee")} value={breakdown.deliveryFee} fmt={fmt} />
        <Row label={t("cart.serviceFee")} value={breakdown.serviceFee} fmt={fmt} />
        <div className="mt-2 flex justify-between border-t-2 border-ink pt-3 font-display text-base font-bold text-ink">
          <span>{t("cart.total")}</span>
          <span className="font-mono">{fmt(breakdown.total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-4 block rounded-2xl bg-ink py-3.5 text-center font-display text-sm font-bold text-sand"
      >
        {t("cart.checkout")}
      </Link>
    </div>
  );
}

function Row({ label, value, fmt }: { label: string; value: number; fmt: (n: number) => string }) {
  return (
    <div className="flex justify-between border-b border-line py-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-mono">{fmt(value)}</span>
    </div>
  );
}

