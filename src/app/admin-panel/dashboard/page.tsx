"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LogOut,
  RefreshCw,
  ShieldCheck,
  LayoutDashboard,
  Bike,
  Package,
  Store,
  Users,
  AlertTriangle,
  BarChart3,
  Check,
  Ban,
  Plus,
  Camera,
  Banknote,
} from "lucide-react";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

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
interface Partner {
  id: string;
  name: string;
  nameAr: string | null;
  cuisineTag: string | null;
  status: string;
  cityName: string;
  ratingAvg: number;
  createdAt: string;
}
interface AdminUser {
  id: string;
  email: string;
  role: string;
  name: string;
  partnerId: string | null;
  partnerName: string | null;
  riderIsOnline: boolean | null;
  createdAt: string;
}
interface OnlineRider {
  riderId: string;
  name: string;
  email: string;
  vehicleType: string;
  ratingAvg: number;
  lat: number | null;
  lng: number | null;
  locationAt: string | null;
  activeOrderId: string | null;
  activeOrderStatus: string | null;
  activeDeliveryAddress: string | null;
  activeDeliveryLat: number | null;
  activeDeliveryLng: number | null;
  activePartnerName: string | null;
}
interface Dispute {
  id: string;
  partnerId: string;
  partnerName: string;
  orderId: string | null;
  message: string;
  status: string;
  resolution: string | null;
  refundAmount: number | null;
  resolvedAt: string | null;
  createdAt: string;
  riderName?: string | null;
  cashCollected?: boolean | null;
  hasProofPhoto?: boolean;
}
interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  riderPayouts: number;
  weekOrders: number;
  weekRevenue: number;
  topPartners: { name: string; order_count: number; revenue: number }[];
  riders: { total: number; online: number };
  partners: { total: number; approved: number; pending: number };
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
  rider_assigned: "bg-tealsoft text-teal",
  picked_up: "bg-tealsoft text-teal",
  on_the_way: "bg-tealsoft text-teal",
  delivered: "bg-sanddeep text-ink",
  cancelled: "bg-claysoft text-clay",
};

type Tab = "overview" | "riders" | "orders" | "approvals" | "users" | "disputes" | "analytics";
const TAB_LABEL: Record<Tab, string> = {
  overview: "Dashboard overview",
  riders: "Live rider map",
  orders: "All orders",
  approvals: "Restaurant/rider approval",
  users: "User management",
  disputes: "Dispute queue & refunds",
  analytics: "Analytics",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [riders, setRiders] = useState<OnlineRider[] | null>(null);
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const guarded = useCallback(
    async (path: string) => {
      const res = await fetch(path);
      if (res.status === 401) {
        router.push("/admin-panel/login");
        return null;
      }
      return res.json();
    },
    [router]
  );

  const loadAll = useCallback(async () => {
    const [o, p, u, r, d, a] = await Promise.all([
      guarded("/api/admin/orders"),
      guarded("/api/admin/partners"),
      guarded("/api/admin/users"),
      guarded("/api/admin/riders"),
      guarded("/api/admin/disputes"),
      guarded("/api/admin/analytics"),
    ]);
    if (o) setOrders(o);
    if (p) setPartners(p);
    if (u) setUsers(u);
    if (r) setRiders(r);
    if (d) setDisputes(d);
    if (a) setAnalytics(a);
  }, [guarded]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10000);
    return () => clearInterval(interval);
  }, [loadAll]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin-panel/login");
  }

  if (orders === null || partners === null || users === null || riders === null || disputes === null) {
    return <div className="flex min-h-screen items-center justify-center bg-sand text-sm text-muted">Loading…</div>;
  }

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-line bg-paper px-5 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-gold" />
            <div>
              <div className="font-display text-base font-bold text-ink">Admin Panel</div>
              <div className="text-xs text-muted">{TAB_LABEL[tab]}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="flex items-center gap-1 rounded-full bg-sanddeep px-3 py-1.5 text-xs font-semibold text-ink">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={logout} className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-sand">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-paper px-5">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto">
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<LayoutDashboard size={14} />} label="Overview" />
          <TabButton active={tab === "riders"} onClick={() => setTab("riders")} icon={<Bike size={14} />} label="Live riders" />
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<Package size={14} />} label="Orders" />
          <TabButton active={tab === "approvals"} onClick={() => setTab("approvals")} icon={<Store size={14} />} label="Approvals" />
          <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={14} />} label="Users" />
          <TabButton active={tab === "disputes"} onClick={() => setTab("disputes")} icon={<AlertTriangle size={14} />} label="Disputes" />
          <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")} icon={<BarChart3 size={14} />} label="Analytics" />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-6">
        {error && <p className="mb-4 text-sm font-semibold text-clay">{error}</p>}

        {tab === "overview" ? (
          <OverviewTab orders={orders} counts={counts} riders={riders} partners={partners} disputes={disputes} />
        ) : tab === "riders" ? (
          <LiveRidersTab riders={riders} />
        ) : tab === "orders" ? (
          <OrdersTab orders={orders} />
        ) : tab === "approvals" ? (
          <ApprovalsTab partners={partners} onChanged={loadAll} setError={setError} />
        ) : tab === "users" ? (
          <UsersTab users={users} partners={partners} onChanged={loadAll} setError={setError} />
        ) : tab === "disputes" ? (
          <DisputesTab disputes={disputes} onChanged={loadAll} setError={setError} />
        ) : (
          <AnalyticsTab analytics={analytics} />
        )}
      </main>
    </div>
  );
}

// ---------- Overview ----------
function OverviewTab({
  orders,
  counts,
  riders,
  partners,
  disputes,
}: {
  orders: Order[];
  counts: Record<string, number>;
  riders: OnlineRider[];
  partners: Partner[];
  disputes: Dispute[];
}) {
  const openDisputes = disputes.filter((d) => d.status === "open").length;
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total orders" value={orders.length} />
        <StatCard
          label="In progress"
          value={
            (counts.accepted || 0) +
            (counts.preparing || 0) +
            (counts.ready_for_pickup || 0) +
            (counts.rider_assigned || 0) +
            (counts.picked_up || 0) +
            (counts.on_the_way || 0)
          }
        />
        <StatCard label="Delivered" value={counts.delivered || 0} />
        <StatCard label="Online riders" value={riders.length} />
        <StatCard label="Approved restaurants" value={partners.filter((p) => p.status === "approved").length} />
        <StatCard label="Pending restaurants" value={partners.filter((p) => p.status === "pending").length} />
        <StatCard label="Open disputes" value={openDisputes} />
        <StatCard label="Total restaurants" value={partners.length} />
      </div>

      <h2 className="mb-3 font-display text-base font-bold text-ink">Recent orders</h2>
      <div className="space-y-2">
        {orders.slice(0, 8).map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </div>
    </>
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

function OrderRow({ order }: { order: Order }) {
  return (
    <div className="flex items-start justify-between rounded-2xl bg-paper p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">#{order.id.slice(-8).toUpperCase()}</span>
          <span className="text-xs font-semibold text-inksoft">{order.partnerName}</span>
        </div>
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

// ---------- Live Riders ----------
function LiveRidersTab({ riders }: { riders: OnlineRider[] }) {
  if (riders.length === 0) {
    return <p className="text-sm text-muted">No riders are online right now.</p>;
  }

  const withFix = riders.filter((r) => typeof r.lat === "number" && typeof r.lng === "number");
  const mapCenter: [number, number] = withFix.length
    ? [withFix[0].lat as number, withFix[0].lng as number]
    : [25.0805, 55.1403]; // Dubai Marina fallback when no rider has reported a GPS fix yet

  return (
    <div className="space-y-3">
      {withFix.length > 0 ? (
        <LiveMap
          center={mapCenter}
          zoom={12}
          pins={withFix.flatMap((r) => {
            const pins = [{ lat: r.lat as number, lng: r.lng as number, emoji: "🛵", color: "#11645B", label: r.name }];
            if (typeof r.activeDeliveryLat === "number" && typeof r.activeDeliveryLng === "number") {
              pins.push({ lat: r.activeDeliveryLat, lng: r.activeDeliveryLng, emoji: "🏠", color: "#C68A3D", label: `${r.name}'s delivery` });
            }
            return pins;
          })}
        />
      ) : (
        <p className="text-xs text-muted">
          No rider has shared a live GPS position yet — riders broadcast their location automatically once they go
          online with location permission granted.
        </p>
      )}

      {riders.map((r) => (
        <div key={r.riderId} className="rounded-2xl bg-paper p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bike size={15} className="text-teal" />
                <span className="text-sm font-bold text-ink">{r.name}</span>
                <span className="rounded-full bg-tealsoft px-2 py-0.5 text-[10px] font-bold uppercase text-teal">{r.vehicleType}</span>
              </div>
              <div className="mt-1 text-xs text-muted">{r.email} · ★ {r.ratingAvg.toFixed(1)}</div>
            </div>
            <span className="rounded-full bg-teal px-2.5 py-1 text-[11px] font-bold text-white">Online</span>
          </div>
          {r.activeOrderId ? (
            <div className="mt-3 rounded-xl bg-tealsoft p-3 text-xs">
              <div className="font-bold text-teal">{STATUS_LABEL[r.activeOrderStatus || ""] || r.activeOrderStatus}</div>
              <div className="mt-0.5 text-muted">{r.activePartnerName} → {r.activeDeliveryAddress}</div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted">Idle — no active delivery.</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- Orders ----------
function OrdersTab({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const statuses = ["all", ...Array.from(new Set(orders.map((o) => o.status)))];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === s ? "bg-ink text-sand" : "bg-sanddeep text-muted"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABEL[s] || s}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted">No orders match this filter.</p>}
        {filtered.map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </div>
    </>
  );
}

// ---------- Approvals ----------
function ApprovalsTab({
  partners,
  onChanged,
  setError,
}: {
  partners: Partner[];
  onChanged: () => void;
  setError: (e: string | null) => void;
}) {
  const [actingOn, setActingOn] = useState<string | null>(null);

  async function setStatus(partnerId: string, status: string) {
    setActingOn(partnerId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not update status");
      await onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActingOn(null);
    }
  }

  const pending = partners.filter((p) => p.status === "pending");
  const rest = partners.filter((p) => p.status !== "pending");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-display text-base font-bold text-ink">
          Pending approval {pending.length > 0 && <span className="text-gold">({pending.length})</span>}
        </h2>
        {pending.length === 0 && <p className="text-sm text-muted">No restaurants waiting on approval.</p>}
        <div className="space-y-2">
          {pending.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl bg-paper p-4">
              <div>
                <div className="text-sm font-bold text-ink">{p.name}</div>
                <div className="text-xs text-muted">{p.cuisineTag} · {p.cityName}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus(p.id, "approved")}
                  disabled={actingOn === p.id}
                  className="flex items-center gap-1 rounded-xl bg-teal px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  <Check size={13} /> Approve
                </button>
                <button
                  onClick={() => setStatus(p.id, "suspended")}
                  disabled={actingOn === p.id}
                  className="flex items-center gap-1 rounded-xl bg-claysoft px-3 py-2 text-xs font-bold text-clay disabled:opacity-60"
                >
                  <Ban size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-base font-bold text-ink">All restaurants</h2>
        <div className="space-y-2">
          {rest.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl bg-paper p-4">
              <div>
                <div className="text-sm font-bold text-ink">{p.name}</div>
                <div className="text-xs text-muted">{p.cuisineTag} · {p.cityName} · ★ {p.ratingAvg.toFixed(1)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    p.status === "approved" ? "bg-tealsoft text-teal" : "bg-claysoft text-clay"
                  }`}
                >
                  {p.status}
                </span>
                {p.status === "approved" ? (
                  <button
                    onClick={() => setStatus(p.id, "suspended")}
                    disabled={actingOn === p.id}
                    className="rounded-xl bg-claysoft px-3 py-2 text-xs font-bold text-clay disabled:opacity-60"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(p.id, "approved")}
                    disabled={actingOn === p.id}
                    className="rounded-xl bg-teal px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-muted">
        Rider approval is handled in the Users tab — rider accounts go live as soon as they're created since there's
        no separate rider-application flow yet.
      </p>
    </div>
  );
}

// ---------- Users ----------
function UsersTab({
  users,
  partners,
  onChanged,
  setError,
}: {
  users: AdminUser[];
  partners: Partner[];
  onChanged: () => void;
  setError: (e: string | null) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState("rider");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, email, password, partnerId: role === "restaurant_owner" ? partnerId : null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not create account");
      setName("");
      setEmail("");
      setPassword("");
      setPartnerId("");
      setShowForm(false);
      await onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-ink">All accounts ({users.length})</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-xs font-bold text-sand"
        >
          <Plus size={14} /> New account
        </button>
      </div>

      {showForm && (
        <div className="mb-5 space-y-3 rounded-2xl bg-paper p-4">
          <div className="flex gap-2">
            {["admin", "restaurant_owner", "rider"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${role === r ? "bg-ink text-sand" : "bg-sanddeep text-muted"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <input
            placeholder="Temporary password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-gold"
          />
          {role === "restaurant_owner" && (
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="">Select restaurant…</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={submit}
            disabled={submitting || !name || !email || !password}
            className="w-full rounded-xl bg-teal py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create account"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-2xl bg-paper p-4">
            <div>
              <div className="text-sm font-bold text-ink">{u.name}</div>
              <div className="text-xs text-muted">{u.email}{u.partnerName ? ` · ${u.partnerName}` : ""}</div>
            </div>
            <div className="flex items-center gap-2">
              {u.role === "rider" && (
                <span className={`h-2 w-2 rounded-full ${u.riderIsOnline ? "bg-teal" : "bg-line"}`} />
              )}
              <span className="rounded-full bg-sanddeep px-2.5 py-1 text-[11px] font-bold text-ink">{u.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Disputes ----------
function DisputesTab({
  disputes,
  onChanged,
  setError,
}: {
  disputes: Dispute[];
  onChanged: () => void;
  setError: (e: string | null) => void;
}) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const open = disputes.filter((d) => d.status === "open");
  const resolved = disputes.filter((d) => d.status === "resolved");

  async function submitResolution(disputeId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          refundAmount: refundAmount ? parseFloat(refundAmount) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not resolve dispute");
      setResolvingId(null);
      setResolution("");
      setRefundAmount("");
      await onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-display text-base font-bold text-ink">
          Open disputes {open.length > 0 && <span className="text-gold">({open.length})</span>}
        </h2>
        {open.length === 0 && <p className="text-sm text-muted">No open disputes.</p>}
        <div className="space-y-3">
          {open.map((d) => (
            <div key={d.id} className="rounded-2xl bg-paper p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">{d.partnerName}</span>
                <span className="text-xs text-muted">{new Date(d.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-inksoft">{d.message}</p>
              {d.orderId && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs text-muted">Order #{d.orderId.slice(-8).toUpperCase()}</p>
                  {d.riderName && <span className="text-xs text-muted">· rider: {d.riderName}</span>}
                  {d.hasProofPhoto && <DeliveryProofViewer orderId={d.orderId} />}
                </div>
              )}

              {resolvingId === d.id ? (
                <div className="mt-3 space-y-2 rounded-xl bg-sand p-3">
                  <textarea
                    placeholder="Resolution note (what was decided / done)"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
                    rows={2}
                  />
                  <input
                    placeholder="Refund amount (AED, optional)"
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitResolution(d.id)}
                      disabled={submitting || !resolution}
                      className="flex-1 rounded-xl bg-teal py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      Mark resolved
                    </button>
                    <button onClick={() => setResolvingId(null)} className="rounded-xl bg-sanddeep px-3 py-2 text-sm font-semibold text-ink">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResolvingId(d.id)}
                  className="mt-3 rounded-xl bg-ink px-3 py-2 text-xs font-bold text-sand"
                >
                  Resolve / issue refund
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-base font-bold text-ink">Resolved</h2>
        {resolved.length === 0 && <p className="text-sm text-muted">No resolved disputes yet.</p>}
        <div className="space-y-2">
          {resolved.map((d) => (
            <div key={d.id} className="rounded-2xl bg-paper p-4 opacity-90">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">{d.partnerName}</span>
                {d.refundAmount != null && <span className="text-xs font-bold text-gold">Refunded AED {d.refundAmount.toFixed(2)}</span>}
              </div>
              <p className="mt-1 text-sm text-muted">{d.message}</p>
              {d.resolution && <p className="mt-1 text-xs text-teal">Resolution: {d.resolution}</p>}
              {d.orderId && d.hasProofPhoto && (
                <div className="mt-1">
                  <DeliveryProofViewer orderId={d.orderId} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl bg-paper p-4">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Refund rules (Phase 1 guidance)</h3>
        <p className="text-xs text-muted">
          No automated refund engine or PSP integration exists yet — refunds recorded here are a manual decision the
          admin logs, not money actually moved. Use as a guideline: full refund for missing/wrong items confirmed by
          the restaurant; partial (delivery fee only) for late delivery; no refund for customer-side address errors.
          Wire this up to a real payment gateway before launch (see README, "Known items before production").
        </p>
      </div>
    </div>
  );
}

// Lazy-loads and shows a delivery's proof-of-delivery photo (R6 data, captured by the
// rider) only when an admin actually clicks to view it — the dispute list itself never
// carries the base64 image data, just a boolean flag (hasProofPhoto) for whether one exists.
function DeliveryProofViewer({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState<{ photoData: string | null; cashCollected: boolean; riderName: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!proof) {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/proof`);
        if (res.ok) setProof(await res.json());
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center gap-1 rounded-full bg-tealsoft px-2 py-0.5 text-[11px] font-bold text-teal"
      >
        <Camera size={11} /> {open ? "Hide proof" : "View delivery proof"}
      </button>
      {open && (
        <div className="mt-2 max-w-xs rounded-xl bg-sand p-2">
          {loading && <p className="text-xs text-muted">Loading…</p>}
          {!loading && proof?.photoData && (
            <>
              <img src={proof.photoData} alt="Delivery proof" className="w-full rounded-lg" />
              {proof.cashCollected && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-teal">
                  <Banknote size={11} /> Cash collection confirmed by {proof.riderName || "rider"}
                </div>
              )}
            </>
          )}
          {!loading && !proof?.photoData && <p className="text-xs text-muted">No photo on file for this delivery.</p>}
        </div>
      )}
    </div>
  );
}

// ---------- Analytics ----------
function AnalyticsTab({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Delivered orders" value={analytics.totalOrders} />
        <StatCard label="This week's orders" value={analytics.weekOrders} />
        <StatCard label="Online riders" value={analytics.riders.online} />
        <StatCard label="Pending restaurants" value={analytics.partners.pending} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-ink p-5 text-sand">
          <div className="text-xs text-sand/70">Total platform revenue (delivered orders)</div>
          <div className="mt-1 font-display text-2xl font-bold">AED {analytics.totalRevenue.toFixed(2)}</div>
          <div className="mt-1 text-xs text-sand/70">This week: AED {analytics.weekRevenue.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl bg-paper p-5">
          <div className="text-xs text-muted">Rider payouts (delivery fees)</div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">AED {analytics.riderPayouts.toFixed(2)}</div>
          <div className="mt-1 text-xs text-muted">{analytics.riders.total} riders registered total</div>
        </div>
      </div>

      <div className="rounded-2xl bg-paper p-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Top restaurants by revenue</h3>
        {analytics.topPartners.length === 0 && <p className="text-sm text-muted">No delivered orders yet.</p>}
        <div className="space-y-2">
          {analytics.topPartners.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-muted">#{i + 1}</span>
                <span className="font-semibold text-ink">{p.name}</span>
                <span className="text-xs text-muted">{p.order_count} orders</span>
              </div>
              <span className="font-mono text-sm font-bold text-ink">AED {p.revenue.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
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
