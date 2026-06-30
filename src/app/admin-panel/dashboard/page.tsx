"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
}
interface Order {
  id: string;
  status: string;
  total: number;
  partnerName: string;
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

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.status === 401) {
      router.push("/admin-panel/login");
      return;
    }
    setOrders(await res.json());
  }, [router]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin-panel/login");
  }

  if (orders === null) {
    return <div className="flex min-h-screen items-center justify-center bg-sand text-sm text-muted">Loading…</div>;
  }

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-line bg-paper px-5 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-gold" />
            <div>
              <div className="font-display text-base font-bold text-ink">Admin Panel</div>
              <div className="text-xs text-muted">Live order monitor — all restaurants</div>
            </div>
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

      <main className="mx-auto max-w-4xl px-5 py-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total orders" value={orders.length} />
          <StatCard label="New" value={counts.placed || 0} />
          <StatCard label="In progress" value={(counts.accepted || 0) + (counts.preparing || 0) + (counts.ready_for_pickup || 0)} />
          <StatCard label="Delivered" value={counts.delivered || 0} />
        </div>

        <h2 className="mb-3 font-display text-base font-bold text-ink">All orders</h2>
        <div className="space-y-2">
          {orders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
          {orders.map((o) => (
            <div key={o.id} className="flex items-start justify-between rounded-2xl bg-paper p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted">#{o.id.slice(-8).toUpperCase()}</span>
                  <span className="text-xs font-semibold text-inksoft">{o.partnerName}</span>
                </div>
                <div className="mt-1 text-sm">{o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}</div>
                <div className="mt-1 text-xs text-muted">{o.deliveryAddress}</div>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLOR[o.status] || "bg-sanddeep text-ink"}`}>
                  {STATUS_LABEL[o.status] || o.status}
                </span>
                <div className="mt-1.5 font-mono text-sm font-semibold text-ink">AED {o.total.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-paper p-4 text-center">
      <div className="font-display text-2xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
