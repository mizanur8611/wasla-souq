"use client";

import { useCart } from "@/components/CartContext";
import { useLocale } from "@/components/LocaleContext";
import { computePriceBreakdown } from "@/lib/pricing";
import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { CreditCard, Banknote, MapPin, LocateFixed } from "lucide-react";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

// Dubai Marina, used as the default pin/center when geolocation hasn't been used yet —
// matches the default address text below.
const DEFAULT_PIN: [number, number] = [25.0805, 55.1403];

export default function CheckoutPage() {
  const { partnerId, lines, subtotal, clearCart } = useCart();
  const { t, currency, fmt } = useLocale();
  const router = useRouter();
  const [address, setAddress] = useState("Home · Marina Walk, Dubai Marina");
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breakdown = computePriceBreakdown(subtotal, currency);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location — drop the pin on the map instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function placeOrder() {
    if (!partnerId || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          deliveryAddress: address,
          paymentMethod,
          lines: lines.map((l) => ({ catalogItemId: l.catalogItemId, quantity: l.quantity })),
          deliveryLat: pin ? pin[0] : null,
          deliveryLng: pin ? pin[1] : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Could not place order");
      }
      const order = await res.json();
      clearCart();
      router.push(`/order/${order.id}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong placing your order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return <p className="text-sm text-muted">{t("checkout.empty")}</p>;
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-bold text-ink">{t("checkout.title")}</h1>

      <div className="mb-4 rounded-2xl bg-paper p-4">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">
          {t("checkout.address")}
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mb-3 w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />

        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-semibold text-muted">
            <MapPin size={13} /> Drop a pin (tap the map, or use your location)
          </span>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="flex items-center gap-1 rounded-full bg-tealsoft px-2.5 py-1 text-[11px] font-bold text-teal disabled:opacity-60"
          >
            <LocateFixed size={12} /> {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        <LiveMap
          center={pin ?? DEFAULT_PIN}
          zoom={14}
          pins={[{ lat: (pin ?? DEFAULT_PIN)[0], lng: (pin ?? DEFAULT_PIN)[1], emoji: "📍", color: "#C68A3D" }]}
          onMapClick={(lat, lng) => setPin([lat, lng])}
        />
        {!pin && <p className="mt-2 text-[11px] text-muted">No exact pin set yet — the marker above is just the default map center.</p>}
      </div>

      <div className="mb-4 rounded-2xl bg-paper p-4">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">
          {t("checkout.payment")}
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setPaymentMethod("card")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
              paymentMethod === "card" ? "border-teal bg-tealsoft text-teal" : "border-line text-muted"
            }`}
          >
            <CreditCard size={15} /> {t("checkout.card")}
          </button>
          <button
            onClick={() => setPaymentMethod("cash")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
              paymentMethod === "cash" ? "border-teal bg-tealsoft text-teal" : "border-line text-muted"
            }`}
          >
            <Banknote size={15} /> {t("checkout.cash")}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted">{t("checkout.demoNote")}</p>
      </div>

      <div className="rounded-2xl bg-paper p-4 text-sm">
        <Row label={t("cart.subtotal")} value={breakdown.subtotal} fmt={fmt} />
        <Row label={t("cart.deliveryFee")} value={breakdown.deliveryFee} fmt={fmt} />
        <Row label={t("cart.serviceFee")} value={breakdown.serviceFee} fmt={fmt} />
        <div className="mt-2 flex justify-between border-t-2 border-ink pt-3 font-display text-base font-bold text-ink">
          <span>{t("cart.total")}</span>
          <span className="font-mono">{fmt(breakdown.total)}</span>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-clay">{error}</p>}

      <button
        onClick={placeOrder}
        disabled={submitting}
        className="mt-4 w-full rounded-2xl bg-ink py-3.5 text-center font-display text-sm font-bold text-sand disabled:opacity-60"
      >
        {submitting ? t("checkout.placing") : `${t("checkout.place")} · ${fmt(breakdown.total)}`}
      </button>
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
