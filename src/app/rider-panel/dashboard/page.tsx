"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Power,
  Package,
  MapPin,
  Navigation,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Wallet,
  History as HistoryIcon,
  User as UserIcon,
  Bike,
  Truck,
  Car,
} from "lucide-react";

interface RiderOrder {
  id: string;
  status: string;
  total: number;
  deliveryFee: number;
  deliveryAddress: string;
  partnerName: string;
  partnerHeroEmoji: string;
  createdAt: string;
}

interface RiderProfile {
  userId: string;
  name: string;
  email: string;
  vehicleType: string;
  isOnline: boolean;
  ratingAvg: number;
}

interface Earnings {
  totalEarnings: number;
  totalDeliveries: number;
  today: { earnings: number; deliveries: number };
  week: { earnings: number; deliveries: number };
}

const STATUS_LABEL: Record<string, string> = {
  rider_assigned: "Head to restaurant",
  picked_up: "Picked up — deliver now",
  on_the_way: "On the way",
  delivered: "Delivered",
};

type Tab = "home" | "earnings" | "history" | "profile";
const TAB_LABEL: Record<Tab, string> = {
  home: "Deliveries",
  earnings: "Earnings",
  history: "History",
  profile: "Profile",
};

export default function RiderDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [available, setAvailable] = useState<RiderOrder[] | null>(null);
  const [myOrders, setMyOrders] = useState<RiderOrder[] | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/rider/profile");
    if (res.status === 401) {
      router.push("/rider-panel/login");
      return;
    }
    setProfile(await res.json());
  }, [router]);

  const loadOrders = useCallback(async () => {
    const [availRes, mineRes] = await Promise.all([fetch("/api/rider/orders/available"), fetch("/api/rider/orders")]);
    if (availRes.status === 401 || mineRes.status === 401) {
      router.push("/rider-panel/login");
      return;
    }
    setAvailable(await availRes.json());
    setMyOrders(await mineRes.json());
  }, [router]);

  const loadEarnings = useCallback(async () => {
    const res = await fetch("/api/rider/earnings");
    if (res.status === 401) return;
    setEarnings(await res.json());
  }, []);

  useEffect(() => {
    loadProfile();
    loadOrders();
    loadEarnings();
    const interval = setInterval(() => {
      loadOrders();
      loadEarnings();
    }, 6000);
    return () => clearInterval(interval);
  }, [loadProfile, loadOrders, loadEarnings]);

  async function toggleOnline() {
    if (!profile) return;
    const next = !profile.isOnline;
    setProfile({ ...profile, isOnline: next });
    await fetch("/api/rider/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: next }),
    });
    loadOrders();
  }

  async function acceptOrder(orderId: string) {
    setActingOn(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/rider/orders/${orderId}/accept`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Could not accept this delivery");
      await loadOrders();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActingOn(null);
    }
  }

  async function advance(orderId: string, newStatus: string) {
    setActingOn(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/rider/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not update delivery");
      await Promise.all([loadOrders(), loadEarnings()]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActingOn(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/rider-panel/login");
  }

  if (profile === null || available === null || myOrders === null) {
    return <div className="flex min-h-screen items-center justify-center bg-sand text-sm text-muted">Loading…</div>;
  }

  const active = myOrders.filter((o) => ["rider_assigned", "picked_up", "on_the_way"].includes(o.status));
  const history = myOrders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-line bg-paper px-5 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <div className="font-display text-base font-bold text-ink">Rider App</div>
            <div className="text-xs text-muted">{TAB_LABEL[tab]}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                profile.isOnline ? "bg-teal text-white" : "bg-sanddeep text-muted"
              }`}
            >
              <Power size={13} /> {profile.isOnline ? "Online" : "Offline"}
            </button>
            <button onClick={logout} className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-sand">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-paper px-5">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto">
          <TabButton active={tab === "home"} onClick={() => setTab("home")} icon={<Package size={14} />} label="Deliveries" />
          <TabButton active={tab === "earnings"} onClick={() => setTab("earnings")} icon={<Wallet size={14} />} label="Earnings" />
          <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<HistoryIcon size={14} />} label="History" />
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={<UserIcon size={14} />} label="Profile" />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-6">
        {error && <p className="mb-4 text-sm font-semibold text-clay">{error}</p>}

        {tab === "home" ? (
          <>
            {!profile.isOnline && active.length === 0 && (
              <div className="mb-6 rounded-2xl bg-paper p-5 text-center">
                <Power size={20} className="mx-auto mb-2 text-muted" />
                <p className="text-sm font-semibold text-ink">You're offline</p>
                <p className="mt-1 text-xs text-muted">Go online to start receiving delivery requests.</p>
                <button onClick={toggleOnline} className="mt-3 rounded-xl bg-teal px-4 py-2 text-sm font-bold text-white">
                  Go online
                </button>
              </div>
            )}

            {active.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 font-display text-base font-bold text-ink">Active delivery</h2>
                <div className="space-y-3">
                  {active.map((o) => (
                    <ActiveDeliveryCard key={o.id} order={o} actingOn={actingOn} onAdvance={advance} />
                  ))}
                </div>
              </section>
            )}

            {profile.isOnline && active.length === 0 && (
              <section>
                <h2 className="mb-3 font-display text-base font-bold text-ink">
                  Incoming requests {available.length > 0 && <span className="text-gold">({available.length})</span>}
                </h2>
                {available.length === 0 && <p className="text-sm text-muted">No delivery requests right now — stay online.</p>}
                <div className="space-y-3">
                  {available.map((o) => (
                    <div key={o.id} className="rounded-2xl bg-paper p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{o.partnerHeroEmoji}</span>
                          <div>
                            <div className="text-sm font-bold text-ink">{o.partnerName}</div>
                            <div className="flex items-center gap-1 text-xs text-muted">
                              <MapPin size={11} /> {o.deliveryAddress}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gold">+AED {o.deliveryFee.toFixed(2)}</div>
                          <div className="text-[11px] text-muted">order AED {o.total.toFixed(2)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => acceptOrder(o.id)}
                        disabled={actingOn === o.id}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-sm font-bold text-sand disabled:opacity-60"
                      >
                        <CheckCircle2 size={15} /> Accept delivery
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : tab === "earnings" ? (
          <EarningsView earnings={earnings} />
        ) : tab === "history" ? (
          <HistoryView orders={history} />
        ) : (
          <ProfileView profile={profile} onUpdated={setProfile} />
        )}
      </main>
    </div>
  );
}

function ActiveDeliveryCard({
  order,
  actingOn,
  onAdvance,
}: {
  order: RiderOrder;
  actingOn: string | null;
  onAdvance: (orderId: string, newStatus: string) => void;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`;
  return (
    <div className="rounded-2xl bg-paper p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">{order.partnerHeroEmoji}</span>
        <div>
          <div className="text-sm font-bold text-ink">{order.partnerName}</div>
          <div className="text-xs font-semibold text-teal">{STATUS_LABEL[order.status] || order.status}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted">
        <MapPin size={11} /> {order.deliveryAddress}
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-tealsoft py-2.5 text-sm font-bold text-teal"
      >
        <Navigation size={15} /> Navigate
      </a>

      <div className="mt-2">
        {order.status === "rider_assigned" && (
          <button
            onClick={() => onAdvance(order.id, "picked_up")}
            disabled={actingOn === order.id}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-sm font-bold text-sand disabled:opacity-60"
          >
            <Package size={15} /> Confirm pickup
          </button>
        )}
        {order.status === "picked_up" && (
          <button
            onClick={() => onAdvance(order.id, "on_the_way")}
            disabled={actingOn === order.id}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-sm font-bold text-sand disabled:opacity-60"
          >
            <Navigation size={15} /> Start delivery
          </button>
        )}
        {order.status === "on_the_way" && (
          <button
            onClick={() => onAdvance(order.id, "delivered")}
            disabled={actingOn === order.id}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            <CheckCircle2 size={15} /> Confirm delivery
          </button>
        )}
      </div>
    </div>
  );
}

function EarningsView({ earnings }: { earnings: Earnings | null }) {
  if (!earnings) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-paper p-4">
          <div className="text-xs text-muted">Today</div>
          <div className="mt-1 font-display text-xl font-bold text-ink">AED {earnings.today.earnings.toFixed(2)}</div>
          <div className="text-xs text-muted">{earnings.today.deliveries} deliveries</div>
        </div>
        <div className="rounded-2xl bg-paper p-4">
          <div className="text-xs text-muted">This week</div>
          <div className="mt-1 font-display text-xl font-bold text-ink">AED {earnings.week.earnings.toFixed(2)}</div>
          <div className="text-xs text-muted">{earnings.week.deliveries} deliveries</div>
        </div>
      </div>
      <div className="rounded-2xl bg-ink p-5 text-sand">
        <div className="flex items-center gap-1.5 text-xs text-sand/70">
          <Wallet size={13} /> Total earned
        </div>
        <div className="mt-1 font-display text-2xl font-bold">AED {earnings.totalEarnings.toFixed(2)}</div>
        <div className="mt-1 text-xs text-sand/70">{earnings.totalDeliveries} deliveries completed all-time</div>
      </div>
      <p className="text-[11px] text-muted">
        Earnings shown here are the delivery fee from each completed order. Payout/withdrawal isn't wired up yet — this
        is a running total only.
      </p>
    </div>
  );
}

function HistoryView({ orders }: { orders: RiderOrder[] }) {
  if (orders.length === 0) return <p className="text-sm text-muted">No completed deliveries yet.</p>;
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl bg-paper p-4 opacity-90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{o.partnerHeroEmoji}</span>
              <div>
                <div className="text-sm font-bold text-ink">{o.partnerName}</div>
                <div className="text-xs text-muted">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-bold ${o.status === "delivered" ? "text-teal" : "text-clay"}`}>
                {o.status === "delivered" ? "Delivered" : "Cancelled"}
              </div>
              {o.status === "delivered" && <div className="text-sm font-bold text-gold">+AED {o.deliveryFee.toFixed(2)}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const VEHICLES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "motorbike", label: "Motorbike", icon: <Bike size={15} /> },
  { value: "car", label: "Car", icon: <Car size={15} /> },
  { value: "van", label: "Van", icon: <Truck size={15} /> },
];

function ProfileView({ profile, onUpdated }: { profile: RiderProfile; onUpdated: (p: RiderProfile) => void }) {
  const [saving, setSaving] = useState(false);

  async function setVehicle(vehicleType: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/rider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleType }),
      });
      onUpdated(await res.json());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-paper p-5">
        <div className="font-display text-lg font-bold text-ink">{profile.name}</div>
        <div className="text-sm text-muted">{profile.email}</div>
        <div className="mt-2 text-xs font-semibold text-gold">★ {profile.ratingAvg.toFixed(1)} rider rating</div>
      </div>

      <div className="rounded-2xl bg-paper p-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Vehicle type</div>
        <div className="flex gap-2">
          {VEHICLES.map((v) => (
            <button
              key={v.value}
              onClick={() => setVehicle(v.value)}
              disabled={saving}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold transition ${
                profile.vehicleType === v.value ? "border-teal bg-tealsoft text-teal" : "border-line text-muted"
              }`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Document upload, payout bank details, and GPS-based live location aren't part of this Phase 1 pass yet.
      </p>
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
