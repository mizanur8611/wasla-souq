"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ChefHat, Package, LogOut, RefreshCw } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
}
interface Order {
  id: string;
  status: string;
  total: number;
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  placed: "New",
  accepted: "Accepted",
  rejected: "Rejected",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  rider_assigned: "Rider assigned",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  placed: "bg-goldsoft text-[#8a611f]",
  accepted: "bg-tealsoft text-teal",
  rejected: "bg-claysoft text-clay",
  preparing: "bg-tealsoft text-teal",
  ready_for_pickup: "bg-tealsoft text-teal",
  delivered: "bg-sanddeep text-ink",
};

export default function RestaurantDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/restaurant/orders");
    if (res.status === 401) {
      router.push("/restaurant-panel/login");
      return;
    }
    const data = await res.json();
    setOrders(data);
  }, [router]);

  useEffect(() => {
    loadOrders();
    // Simple polling stands in for real-time push until a WebSocket/SSE layer exists —
    // good enough for a restaurant owner watching a queue, not pretending to be instant.
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  async function act(orderId: string, newStatus: string) {
    setActingOn(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not update order");
      await loadOrders();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActingOn(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/restaurant-panel/login");
  }

  if (orders === null) {
    return <div className="flex min-h-screen items-center justify-center bg-sand text-sm text-muted">Loading…</div>;
  }

  const newOrders = orders.filter((o) => o.status === "placed");
  const inProgress = orders.filter((o) => ["accepted", "preparing", "ready_for_pickup"].includes(o.status));
  const history = orders.filter((o) =>
    ["delivered", "rejected", "cancelled"].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-line bg-paper px-5 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <div className="font-display text-base font-bold text-ink">Restaurant Panel</div>
            <div className="text-xs text-muted">Order queue</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadOrders} className="flex items-center gap-1 rounded-full bg-sanddeep px-3 py-1.5 text-xs font-semibold text-ink">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={logout} className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-sand">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6">
        {error && <p className="mb-4 text-sm font-semibold text-clay">{error}</p>}

        <section className="mb-8">
          <h2 className="mb-3 font-display text-base font-bold text-ink">
            New orders {newOrders.length > 0 && <span className="text-gold">({newOrders.length})</span>}
          </h2>
          {newOrders.length === 0 && <p className="text-sm text-muted">No new orders right now.</p>}
          <div className="space-y-3">
            {newOrders.map((o) => (
              <div key={o.id} className="rounded-2xl bg-paper p-4">
                <OrderHeader order={o} />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => act(o.id, "accepted")}
                    disabled={actingOn === o.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    <Check size={15} /> Accept
                  </button>
                  <button
                    onClick={() => act(o.id, "rejected")}
                    disabled={actingOn === o.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-claysoft py-2.5 text-sm font-bold text-clay disabled:opacity-60"
                  >
                    <X size={15} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-display text-base font-bold text-ink">In progress</h2>
          {inProgress.length === 0 && <p className="text-sm text-muted">Nothing in progress.</p>}
          <div className="space-y-3">
            {inProgress.map((o) => (
              <div key={o.id} className="rounded-2xl bg-paper p-4">
                <OrderHeader order={o} />
                <div className="mt-3">
                  {o.status === "accepted" && (
                    <button
                      onClick={() => act(o.id, "preparing")}
                      disabled={actingOn === o.id}
                      className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-sand disabled:opacity-60"
                    >
                      <ChefHat size={15} /> Start preparing
                    </button>
                  )}
                  {o.status === "preparing" && (
                    <button
                      onClick={() => act(o.id, "ready_for_pickup")}
                      disabled={actingOn === o.id}
                      className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-sand disabled:opacity-60"
                    >
                      <Package size={15} /> Mark ready for pickup
                    </button>
                  )}
                  {o.status === "ready_for_pickup" && (
                    <p className="text-xs font-semibold text-muted">Waiting for a rider to be assigned.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-bold text-ink">History</h2>
          {history.length === 0 && <p className="text-sm text-muted">No completed orders yet.</p>}
          <div className="space-y-2">
            {history.map((o) => (
              <div key={o.id} className="rounded-2xl bg-paper p-4 opacity-80">
                <OrderHeader order={o} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function OrderHeader({ order }: { order: Order }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="font-mono text-xs text-muted">#{order.id.slice(-8).toUpperCase()}</div>
        <div className="mt-1 text-sm">
          {order.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
        </div>
        <div className="mt-1 text-xs text-muted">{order.deliveryAddress}</div>
      </div>
      <div className="text-right">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLOR[order.status] || "bg-sanddeep text-ink"}`}>
          {STATUS_LABEL[order.status] || order.status}
        </span>
        <div className="mt-1.5 font-mono text-sm font-semibold text-ink">AED {order.total.toFixed(2)}</div>
      </div>
    </div>
  );
}
