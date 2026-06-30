import { getOrderById } from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "accepted", label: "Restaurant accepted" },
  { key: "preparing", label: "Kitchen preparing" },
  { key: "ready_for_pickup", label: "Ready for pickup" },
  { key: "rider_assigned", label: "Rider assigned" },
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);

  if (!order || !order.partner) notFound();

  if (order.status === "rejected" || order.status === "cancelled") {
    return (
      <div>
        <h1 className="mb-1 font-display text-xl font-bold text-ink">Order #{order.id.slice(-8).toUpperCase()}</h1>
        <p className="mb-5 text-sm text-muted">{order.partner.name}</p>
        <div className="flex items-center gap-3 rounded-2xl bg-claysoft p-4 text-clay">
          <XCircle size={22} className="flex-shrink-0" />
          <div>
            <div className="font-display text-sm font-bold">
              {order.status === "rejected" ? "Order was declined by the restaurant" : "Order was cancelled"}
            </div>
            <div className="text-xs opacity-80">A full refund is issued automatically for this case.</div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = Math.max(STEPS.findIndex((s) => s.key === order.status), 0);
  const hasRider = !!order.fulfilment?.riderName;

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-bold text-ink">Order #{order.id.slice(-8).toUpperCase()}</h1>
      <p className="mb-5 text-sm text-muted">{order.partner.name}</p>

      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-ink p-4 text-sand">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-base">🛵</div>
        <div>
          <div className="text-sm font-bold">
            {hasRider ? `Rider: ${order.fulfilment!.riderName}` : "Rider not yet assigned"}
          </div>
          <div className="text-xs text-[#AFC2CC]">
            {hasRider ? `Arriving in ~${order.fulfilment!.etaMins} minutes` : "A rider will be assigned once the restaurant marks your order ready"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-paper p-4">
        {STEPS.map((step, i) => {
          const done = i <= currentStepIndex;
          return (
            <div key={step.key} className="flex items-start gap-3 pb-5 last:pb-0">
              {done ? (
                <CheckCircle2 size={20} className="flex-shrink-0 text-teal" />
              ) : (
                <Circle size={20} className="flex-shrink-0 text-line" />
              )}
              <span className={`text-sm font-semibold ${done ? "text-ink" : "text-muted"}`}>{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-paper p-4 text-sm">
        {order.items.map((item: any) => (
          <div key={item.id} className="flex justify-between border-b border-line py-2 last:border-0">
            <span>
              {item.nameSnapshot} × {item.quantity}
            </span>
            <span className="font-mono">AED {(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t-2 border-ink pt-3 font-display text-base font-bold">
          <span>Total</span>
          <span className="font-mono">AED {order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
