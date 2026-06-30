"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ChefHat, Package, LogOut, RefreshCw, Plus, UtensilsCrossed } from "lucide-react";

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

type Tab = "orders" | "menu";

export default function RestaurantDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
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
  const history = orders.filter((o) => ["delivered", "rejected", "cancelled"].includes(o.status));

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-line bg-paper px-5 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <div className="font-display text-base font-bold text-ink">Restaurant Panel</div>
            <div className="text-xs text-muted">{tab === "orders" ? "Order queue" : "Menu management"}</div>
          </div>
          <div className="flex items-center gap-2">
            {tab === "orders" && (
              <button
                onClick={loadOrders}
                className="flex items-center gap-1 rounded-full bg-sanddeep px-3 py-1.5 text-xs font-semibold text-ink"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            )}
            <button onClick={logout} className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-sand">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-paper px-5">
        <div className="mx-auto flex max-w-3xl gap-1">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<Package size={14} />} label="Orders" />
          <TabButton active={tab === "menu"} onClick={() => setTab("menu")} icon={<UtensilsCrossed size={14} />} label="Menu" />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-6">
        {error && <p className="mb-4 text-sm font-semibold text-clay">{error}</p>}

        {tab === "orders" ? (
          <>
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
          </>
        ) : (
          <MenuManager />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
        active ? "border-teal text-teal" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function OrderHeader({ order }: { order: Order }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="font-mono text-xs text-muted">#{order.id.slice(-8).toUpperCase()}</div>
        <div className="mt-1 text-sm">{order.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}</div>
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

// Lets the owner add a new item to their own menu. Editing/removing existing items is a
// natural next addition once this basic add-flow is confirmed to work end to end.
function MenuManager() {
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [category, setCategory] = useState("mains");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/restaurant/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nameAr, category, description, price }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not add item");
      setMessage("Item added to your menu.");
      setName("");
      setNameAr("");
      setDescription("");
      setPrice("");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 font-display text-base font-bold text-ink">Add a menu item</h2>
      <p className="mb-4 text-sm text-muted">New items appear on your live menu immediately.</p>

      <div className="space-y-3 rounded-2xl bg-paper p-4">
        <Field label="Item name (English)" value={name} onChange={setName} placeholder="e.g. Chicken Mandi" />
        <Field label="Item name (Arabic) — optional" value={nameAr} onChange={setNameAr} placeholder="مثال: مندي دجاج" />
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="mains">Mains</option>
            <option value="sides">Sides</option>
            <option value="drinks">Drinks</option>
          </select>
        </label>
        <Field label="Description — optional" value={description} onChange={setDescription} placeholder="Short description" />
        <Field label="Price (AED)" value={price} onChange={setPrice} placeholder="e.g. 28" type="number" />
      </div>

      {message && <p className="mt-3 text-sm font-semibold text-teal">{message}</p>}

      <button
        onClick={submit}
        disabled={submitting || !name || !price}
        className="mt-4 flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-sand disabled:opacity-60"
      >
        <Plus size={15} /> {submitting ? "Adding…" : "Add item"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
    </label>
  );
}

