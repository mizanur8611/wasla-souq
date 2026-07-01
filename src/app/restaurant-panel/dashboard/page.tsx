"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ChefHat, Package, LogOut, RefreshCw, Plus, UtensilsCrossed, Clock, BarChart3, AlertTriangle, Store, Camera } from "lucide-react";

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
  hasProofPhoto?: boolean;
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

type Tab = "orders" | "menu" | "hours" | "sales" | "disputes" | "profile";
const TAB_LABEL: Record<Tab, string> = {
  orders: "Order queue",
  menu: "Menu management",
  hours: "Business hours",
  sales: "Sales & analytics",
  disputes: "Dispute center",
  profile: "Restaurant profile",
};

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
            <div className="text-xs text-muted">{TAB_LABEL[tab]}</div>
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
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<Package size={14} />} label="Orders" />
          <TabButton active={tab === "menu"} onClick={() => setTab("menu")} icon={<UtensilsCrossed size={14} />} label="Menu" />
          <TabButton active={tab === "hours"} onClick={() => setTab("hours")} icon={<Clock size={14} />} label="Hours" />
          <TabButton active={tab === "sales"} onClick={() => setTab("sales")} icon={<BarChart3 size={14} />} label="Sales" />
          <TabButton active={tab === "disputes"} onClick={() => setTab("disputes")} icon={<AlertTriangle size={14} />} label="Disputes" />
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={<Store size={14} />} label="Profile" />
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
        ) : tab === "menu" ? (
          <MenuManager />
        ) : tab === "hours" ? (
          <HoursManager />
        ) : tab === "sales" ? (
          <SalesView />
        ) : tab === "disputes" ? (
          <DisputeCenter />
        ) : (
          <ProfileManager />
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
        {order.status === "delivered" && order.hasProofPhoto && <RestaurantProofViewer orderId={order.id} />}
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

// Lazy-loads the rider's proof-of-delivery photo for this restaurant's own order — only
// fetched when the owner actually clicks, not bundled into the order list response.
function RestaurantProofViewer({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!photoData) {
      setLoading(true);
      try {
        const res = await fetch(`/api/restaurant/orders/${orderId}/proof`);
        if (res.ok) setPhotoData((await res.json()).photoData);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="mt-1.5">
      <button onClick={toggle} className="flex items-center gap-1 rounded-full bg-tealsoft px-2 py-0.5 text-[11px] font-bold text-teal">
        📷 {open ? "Hide proof" : "View delivery proof"}
      </button>
      {open && (
        <div className="mt-1.5 max-w-[200px]">
          {loading && <p className="text-xs text-muted">Loading…</p>}
          {!loading && photoData && <img src={photoData} alt="Delivery proof" className="max-h-40 w-full rounded-lg object-cover" />}
        </div>
      )}
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
  const [imageData, setImageData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<{ id: string; name: string; price: number; imageUrl?: string | null }[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);

  // Load existing items to show photo-upload buttons for them
  useEffect(() => {
    fetch("/api/restaurant/menu")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  function handleNewItemPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImageData(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function uploadItemPhoto(itemId: string, file: File) {
    const img = new Image();
    const reader = new FileReader();
    return new Promise<void>((resolve) => {
      reader.onload = () => {
        img.onload = async () => {
          const maxW = 800;
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const data = canvas.toDataURL("image/jpeg", 0.75);
          await fetch(`/api/restaurant/menu/${itemId}/image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData: data }),
          });
          setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, imageUrl: data } : it)));
          resolve();
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function submit() {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/restaurant/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nameAr, category, description, price, imageData }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not add item");
      const newItem = await res.json();
      setItems((prev) => [...prev, { id: newItem.id, name, price: parseFloat(price), imageUrl: imageData }]);
      setMessage("Item added to your menu.");
      setName("");
      setNameAr("");
      setDescription("");
      setPrice("");
      setImageData(null);
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

        <div>
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Item photo — optional</span>
          {imageData ? (
            <div className="relative">
              <img src={imageData} alt="preview" className="h-28 w-full rounded-xl object-cover" />
              <button onClick={() => setImageData(null)} className="absolute right-2 top-2 rounded-full bg-ink/70 p-1 text-white">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => photoRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-sand py-3 text-sm font-semibold text-muted"
            >
              <Camera size={15} /> Upload photo
            </button>
          )}
          <input ref={photoRef} type="file" accept="image/*" onChange={handleNewItemPhoto} className="hidden" />
        </div>
      </div>

      {message && <p className="mt-3 text-sm font-semibold text-teal">{message}</p>}

      <button
        onClick={submit}
        disabled={submitting || !name || !price}
        className="mt-4 flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-sand disabled:opacity-60"
      >
        <Plus size={15} /> {submitting ? "Adding…" : "Add item"}
      </button>

      {items.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-base font-bold text-ink">Menu items — update photos</h2>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.name} className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sanddeep text-muted">
                    <Camera size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{it.name}</div>
                  <div className="text-xs text-muted">AED {it.price.toFixed(2)}</div>
                </div>
                <label className="flex-shrink-0 cursor-pointer rounded-xl bg-sanddeep px-3 py-2 text-xs font-semibold text-ink">
                  <Camera size={13} className="inline me-1" />
                  {it.imageUrl ? "Change" : "Add photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadItemPhoto(it.id, file);
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
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

// Toggle the restaurant open/closed for new orders. Weekly hours display is static for now —
// a real per-day schedule editor is a natural next addition once this toggle is confirmed
// to work end to end.
function HoursManager() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/restaurant/profile")
      .then((r) => r.json())
      .then((p) => setIsOpen(p.isOpen));
  }, []);

  async function toggle() {
    if (isOpen === null) return;
    setSaving(true);
    const next = !isOpen;
    try {
      await fetch("/api/restaurant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: next }),
      });
      setIsOpen(next);
    } finally {
      setSaving(false);
    }
  }

  const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div>
      <h2 className="mb-1 font-display text-base font-bold text-ink">Business Hours</h2>
      <p className="mb-4 text-sm text-muted">Customers can't order while you're marked closed.</p>

      {isOpen !== null && (
        <button
          onClick={toggle}
          disabled={saving}
          className={`mb-5 flex w-full items-center justify-between rounded-2xl p-4 text-sm font-bold disabled:opacity-60 ${
            isOpen ? "bg-tealsoft text-teal" : "bg-claysoft text-clay"
          }`}
        >
          <span>{isOpen ? "🟢 Open — accepting orders" : "🔴 Temporarily closed"}</span>
          <span className="rounded-full bg-white/60 px-3 py-1 text-xs">{saving ? "Saving…" : "Tap to toggle"}</span>
        </button>
      )}

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Weekly schedule</h3>
      <div className="space-y-2">
        {DAYS.map((d) => (
          <div key={d} className="flex justify-between rounded-xl bg-paper p-3 text-sm">
            <span className="font-semibold text-ink">{d}</span>
            <span className="text-muted">11:00 AM – 11:00 PM</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">
        Per-day editing is coming next — for now the open/closed toggle above is the live control.
      </p>
    </div>
  );
}

function SalesView() {
  const [stats, setStats] = useState<{ orderCount: number; revenue: number; topItems: { name: string; qty: number }[] } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/restaurant/sales")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <p className="text-sm text-muted">Loading…</p>;

  const maxQty = Math.max(...stats.topItems.map((i) => i.qty), 1);

  return (
    <div>
      <h2 className="mb-1 font-display text-base font-bold text-ink">Sales & Analytics</h2>
      <p className="mb-4 text-sm text-muted">Last 7 days, delivered orders only.</p>

      <div className="mb-5 rounded-2xl bg-ink p-4 text-sand">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#9fb3bd]">Revenue this week</div>
        <div className="mt-1 font-display text-2xl font-bold">AED {stats.revenue.toFixed(2)}</div>
        <div className="mt-1 text-xs text-[#9fb3bd]">{stats.orderCount} delivered orders</div>
      </div>

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Top items</h3>
      {stats.topItems.length === 0 && <p className="text-sm text-muted">No orders yet this week.</p>}
      <div className="space-y-2">
        {stats.topItems.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="w-28 flex-shrink-0 truncate text-xs font-semibold text-ink">{item.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sanddeep">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(item.qty / maxQty) * 100}%` }} />
            </div>
            <span className="w-6 text-right text-xs text-muted">{item.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DisputeCenter() {
  const [disputes, setDisputes] = useState<{ id: string; message: string; status: string; createdAt: string }[] | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetch("/api/restaurant/disputes")
      .then((r) => r.json())
      .then(setDisputes);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/restaurant/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setMessage("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 font-display text-base font-bold text-ink">Dispute Center</h2>
      <p className="mb-4 text-sm text-muted">Report an issue directly to the admin team.</p>

      <div className="mb-5 rounded-2xl bg-paper p-4">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">New dispute</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue — e.g. a delivery dispute, payout question…"
          className="h-20 w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button
          onClick={submit}
          disabled={submitting || !message.trim()}
          className="mt-2 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-sand disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit dispute"}
        </button>
      </div>

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Your disputes</h3>
      {disputes === null && <p className="text-sm text-muted">Loading…</p>}
      {disputes?.length === 0 && <p className="text-sm text-muted">No disputes filed.</p>}
      <div className="space-y-2">
        {disputes?.map((d) => (
          <div key={d.id} className="rounded-2xl bg-paper p-4">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  d.status === "open" ? "bg-goldsoft text-[#8a611f]" : "bg-tealsoft text-teal"
                }`}
              >
                {d.status === "open" ? "Under review" : "Resolved"}
              </span>
              <span className="text-[11px] text-muted">{new Date(d.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-2 text-sm text-ink">{d.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileManager() {
  const [partner, setPartner] = useState<{ name: string; nameAr: string | null; cuisineTag: string | null; heroEmoji: string; heroImageUrl?: string | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/restaurant/profile")
      .then((r) => r.json())
      .then(setPartner);
  }, []);

  async function save() {
    if (!partner) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/restaurant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partner),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoMsg(null);
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = async () => {
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.75);
        try {
          const res = await fetch("/api/restaurant/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData }),
          });
          if (res.ok) {
            setPartner((p) => p ? { ...p, heroImageUrl: imageData } : p);
            setPhotoMsg("Photo updated!");
          }
        } catch {
          setPhotoMsg("Upload failed — try again.");
        } finally {
          setUploadingPhoto(false);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  if (!partner) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div>
      <h2 className="mb-4 font-display text-base font-bold text-ink">Restaurant Profile</h2>

      {/* Photo upload */}
      <div className="mb-4 rounded-2xl bg-paper p-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Restaurant photo</div>
        {partner.heroImageUrl && (
          <img src={partner.heroImageUrl} alt="Restaurant" className="mb-3 h-32 w-full rounded-xl object-cover" />
        )}
        <button
          onClick={() => photoRef.current?.click()}
          disabled={uploadingPhoto}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-sand py-3 text-sm font-semibold text-muted disabled:opacity-60"
        >
          <Camera size={16} /> {uploadingPhoto ? "Uploading…" : partner.heroImageUrl ? "Change photo" : "Upload photo"}
        </button>
        <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
        {photoMsg && <p className="mt-2 text-xs font-semibold text-teal">{photoMsg}</p>}
      </div>

      <div className="space-y-3 rounded-2xl bg-paper p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Name (English)</span>
          <input
            value={partner.name}
            onChange={(e) => setPartner({ ...partner, name: e.target.value })}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Name (Arabic)</span>
          <input
            value={partner.nameAr || ""}
            onChange={(e) => setPartner({ ...partner, nameAr: e.target.value })}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Cuisine tag</span>
          <input
            value={partner.cuisineTag || ""}
            onChange={(e) => setPartner({ ...partner, cuisineTag: e.target.value })}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Emoji icon</span>
          <input
            value={partner.heroEmoji}
            onChange={(e) => setPartner({ ...partner, heroEmoji: e.target.value })}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
      </div>

      {saved && <p className="mt-3 text-sm font-semibold text-teal">Profile updated.</p>}

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-sand disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

