"use client";

import { useCart } from "@/components/CartContext";
import { computePriceBreakdown } from "@/lib/pricing";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Banknote } from "lucide-react";

export default function CheckoutPage() {
  const { partnerId, lines, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState("Home · Marina Walk, Dubai Marina");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breakdown = computePriceBreakdown(subtotal, "AED");

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
    return <p className="text-sm text-muted">Your cart is empty — add something from a restaurant first.</p>;
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-bold text-ink">Checkout</h1>

      <div className="mb-4 rounded-2xl bg-paper p-4">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Delivery address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
      </div>

      <div className="mb-4 rounded-2xl bg-paper p-4">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">Payment method</label>
        <div className="flex gap-2">
          <button
            onClick={() => setPaymentMethod("card")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
              paymentMethod === "card" ? "border-teal bg-tealsoft text-teal" : "border-line text-muted"
            }`}
          >
            <CreditCard size={15} /> Card
          </button>
          <button
            onClick={() => setPaymentMethod("cash")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
              paymentMethod === "cash" ? "border-teal bg-tealsoft text-teal" : "border-line text-muted"
            }`}
          >
            <Banknote size={15} /> Cash on delivery
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Demo checkout — no real payment is processed. A production build wires this to a PSP supporting mada,
          Jaywan, NAPS or KNET depending on market.
        </p>
      </div>

      <div className="rounded-2xl bg-paper p-4 text-sm">
        <Row label="Subtotal" value={breakdown.subtotal} />
        <Row label="Delivery fee (flat)" value={breakdown.deliveryFee} />
        <Row label="Service fee" value={breakdown.serviceFee} />
        <div className="mt-2 flex justify-between border-t-2 border-ink pt-3 font-display text-base font-bold text-ink">
          <span>Total</span>
          <span className="font-mono">AED {breakdown.total.toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-clay">{error}</p>}

      <button
        onClick={placeOrder}
        disabled={submitting}
        className="mt-4 w-full rounded-2xl bg-ink py-3.5 text-center font-display text-sm font-bold text-sand disabled:opacity-60"
      >
        {submitting ? "Placing order…" : `Place order · AED ${breakdown.total.toFixed(2)}`}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between border-b border-line py-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-mono">AED {value.toFixed(2)}</span>
    </div>
  );
}
