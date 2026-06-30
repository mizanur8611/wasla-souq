"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
  X,
  Headset,
  Camera,
  Banknote,
  Star,
  ArrowDownToLine,
} from "lucide-react";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

import { distanceKm, formatDistanceEta } from "@/lib/geo";

interface OrderLineItem {
  name: string;
  quantity: number;
}

interface RiderOrder {
  id: string;
  status: string;
  total: number;
  deliveryFee: number;
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  paymentMethod?: string;
  customerRating?: number | null;
  cashCollected?: boolean;
  hasProofPhoto?: boolean;
  partnerName: string;
  partnerHeroEmoji: string;
  partnerLat: number | null;
  partnerLng: number | null;
  createdAt: string;
  items?: OrderLineItem[];
}

interface RiderProfile {
  userId: string;
  name: string;
  email: string;
  vehicleType: string;
  isOnline: boolean;
  ratingAvg: number;
  deliveriesAccepted: number;
  deliveriesDeclined: number;
  acceptanceRate: number;
}

interface Payout {
  id: string;
  amount: number;
  deliveriesCount: number;
  createdAt: string;
}

interface Earnings {
  totalEarnings: number;
  totalDeliveries: number;
  today: { earnings: number; deliveries: number };
  week: { earnings: number; deliveries: number };
  availableToWithdraw: number;
  availableDeliveries: number;
  recentPayouts: Payout[];
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
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);
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

  // Real-time location sharing: while the rider is online, their browser's actual GPS
  // position is sent to the server every ~8s via watchPosition. This is genuinely live
  // (not simulated) — it's what makes "Navigate" on the active delivery and the customer
  // tracking map/admin live-rider map show the rider's real position. Stops immediately
  // when the rider goes offline so nothing is sent in the background unnecessarily.
  useEffect(() => {
    if (!profile?.isOnline || !navigator.geolocation) return;

    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setMyPosition([pos.coords.latitude, pos.coords.longitude]);
        const now = Date.now();
        if (now - lastSent < 8000) return;
        lastSent = now;
        fetch("/api/rider/location", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {
          // A dropped location ping just means the map is briefly stale — not worth
          // surfacing as an error to the rider.
        });
      },
      () => {
        // Permission denied / unavailable — silently skip; the rider can still operate
        // without live tracking, they just won't show on the map.
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [profile?.isOnline]);

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
      await Promise.all([loadOrders(), loadProfile()]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActingOn(null);
    }
  }

  async function declineOrder(orderId: string) {
    // The order itself isn't touched (another rider can still take it) — this just logs
    // the decline against the rider's acceptance rate and drops it from this rider's view.
    setActingOn(orderId);
    try {
      await fetch(`/api/rider/orders/${orderId}/decline`, { method: "POST" });
      setAvailable((prev) => (prev ? prev.filter((o) => o.id !== orderId) : prev));
      await loadProfile();
    } finally {
      setActingOn(null);
    }
  }

  async function advance(orderId: string, newStatus: string, opts?: { photoData?: string; cashCollected?: boolean }) {
    setActingOn(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/rider/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...opts }),
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
            <span className="hidden items-center gap-1 rounded-full bg-sanddeep px-2.5 py-1 text-[11px] font-bold text-ink sm:flex">
              {profile.acceptanceRate}% acceptance
            </span>
            <a
              href="mailto:support@waslasouq.com"
              className="flex items-center gap-1 rounded-full bg-sanddeep px-3 py-1.5 text-xs font-semibold text-ink"
              title="Contact rider support"
            >
              <Headset size={13} />
            </a>
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
                    <ActiveDeliveryCard key={o.id} order={o} actingOn={actingOn} onAdvance={advance} myPosition={myPosition} />
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
                  {available.map((o) => {
                    const hasPickup = typeof o.partnerLat === "number" && typeof o.partnerLng === "number";
                    const hasDrop = typeof o.deliveryLat === "number" && typeof o.deliveryLng === "number";
                    const pickupLeg =
                      myPosition && hasPickup
                        ? distanceKm(myPosition[0], myPosition[1], o.partnerLat as number, o.partnerLng as number)
                        : null;
                    const dropLeg =
                      hasPickup && hasDrop
                        ? distanceKm(o.partnerLat as number, o.partnerLng as number, o.deliveryLat as number, o.deliveryLng as number)
                        : null;
                    return (
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

                        {(pickupLeg !== null || dropLeg !== null) && (
                          <div className="mt-3 space-y-1.5 rounded-xl bg-sand p-2.5 text-xs">
                            {pickupLeg !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted">📍 You → restaurant</span>
                                <span className="font-bold text-ink">{formatDistanceEta(pickupLeg)}</span>
                              </div>
                            )}
                            {dropLeg !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted">🏠 Restaurant → drop-off</span>
                                <span className="font-bold text-ink">{formatDistanceEta(dropLeg)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => declineOrder(o.id)}
                            disabled={actingOn === o.id}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-claysoft px-4 py-2.5 text-sm font-bold text-clay disabled:opacity-60"
                          >
                            <X size={15} /> Decline
                          </button>
                          <button
                            onClick={() => acceptOrder(o.id)}
                            disabled={actingOn === o.id}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-sm font-bold text-sand disabled:opacity-60"
                          >
                            <CheckCircle2 size={15} /> Accept delivery
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        ) : tab === "earnings" ? (
          <EarningsView earnings={earnings} onWithdrawn={loadEarnings} />
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
  myPosition,
}: {
  order: RiderOrder;
  actingOn: string | null;
  onAdvance: (orderId: string, newStatus: string, opts?: { photoData?: string; cashCollected?: boolean }) => void;
  myPosition: [number, number] | null;
}) {
  const headingToRestaurant = order.status === "rider_assigned";
  const hasPickup = typeof order.partnerLat === "number" && typeof order.partnerLng === "number";
  const hasDrop = typeof order.deliveryLat === "number" && typeof order.deliveryLng === "number";

  // While heading to the restaurant, the relevant destination is the pickup pin; once
  // picked up, it switches to the customer's drop-off pin. Falls back to a text search
  // when no pin exists for that leg (e.g. restaurant has no lat/lng on file yet).
  const destLat = headingToRestaurant ? order.partnerLat : order.deliveryLat;
  const destLng = headingToRestaurant ? order.partnerLng : order.deliveryLng;
  const hasDest = headingToRestaurant ? hasPickup : hasDrop;
  const destLabel = headingToRestaurant ? order.partnerName : "Delivery address";
  const destEmoji = headingToRestaurant ? "🍽️" : "🏠";

  const mapsUrl = hasDest
    ? `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        headingToRestaurant ? order.partnerName : order.deliveryAddress
      )}`;

  const legKm = myPosition && hasDest ? distanceKm(myPosition[0], myPosition[1], destLat as number, destLng as number) : null;

  // R4: item checklist — a rider must tick every item before "Confirm pickup" unlocks,
  // so a missing item gets caught at the restaurant counter rather than discovered after
  // they've already left.
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const items = order.items ?? [];
  const allChecked = items.length === 0 || items.every((_, i) => checked[i]);

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
        <MapPin size={11} /> {headingToRestaurant ? `Pickup: ${order.partnerName}` : order.deliveryAddress}
        {!hasDest && <span className="text-[10px] text-gold">(no exact pin on file)</span>}
      </div>

      {legKm !== null && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-tealsoft px-2.5 py-1 text-xs font-bold text-teal">
          {formatDistanceEta(legKm)} away
        </div>
      )}

      {hasDest && (
        <div className="mt-3">
          <LiveMap
            center={myPosition ?? [destLat as number, destLng as number]}
            zoom={13}
            height={180}
            showLine={!!myPosition}
            pins={[
              { lat: destLat as number, lng: destLng as number, emoji: destEmoji, color: headingToRestaurant ? "#0B2230" : "#C68A3D", label: destLabel },
              ...(myPosition ? [{ lat: myPosition[0], lng: myPosition[1], emoji: "🛵", color: "#11645B", label: "You" }] : []),
            ]}
          />
        </div>
      )}

      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-tealsoft py-2.5 text-sm font-bold text-teal"
      >
        <Navigation size={15} /> Navigate
      </a>

      {headingToRestaurant && items.length > 0 && (
        <div className="mt-3 rounded-xl bg-sand p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Check items before pickup</div>
          <div className="space-y-1.5">
            {items.map((it, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={!!checked[i]}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [i]: e.target.checked }))}
                  className="h-4 w-4 accent-teal"
                />
                {it.name} × {it.quantity}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2">
        {order.status === "rider_assigned" && (
          <button
            onClick={() => onAdvance(order.id, "picked_up")}
            disabled={actingOn === order.id || !allChecked}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-sm font-bold text-sand disabled:opacity-60"
          >
            <Package size={15} /> {allChecked ? "Confirm pickup" : "Check all items first"}
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
          <DeliveryConfirmPanel order={order} actingOn={actingOn} onAdvance={onAdvance} />
        )}
      </div>
    </div>
  );
}

// R6: proof-of-delivery photo + cash-collection confirmation, gating "Mark as delivered".
// The photo is resized client-side before upload (max ~800px wide, JPEG) since it's
// stored directly as a base64 column in Postgres — there's no object-storage service
// (S3 etc.) wired up yet for this Phase 1 pass.
function DeliveryConfirmPanel({
  order,
  actingOn,
  onAdvance,
}: {
  order: RiderOrder;
  actingOn: string | null;
  onAdvance: (orderId: string, newStatus: string, opts?: { photoData?: string; cashCollected?: boolean }) => void;
}) {
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [cashCollected, setCashCollected] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isCash = order.paymentMethod === "cash";
  const canConfirm = !!photoData && (!isCash || cashCollected);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoData(canvas.toDataURL("image/jpeg", 0.6));
        setProcessing(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3 rounded-xl bg-sand p-3">
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Proof of delivery</div>
        {photoData ? (
          <div className="relative">
            <img src={photoData} alt="Delivery proof" className="w-full rounded-lg" />
            <button
              onClick={() => setPhotoData(null)}
              className="absolute right-2 top-2 rounded-full bg-ink/80 p-1 text-white"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-paper py-3 text-sm font-semibold text-muted disabled:opacity-60"
          >
            <Camera size={16} /> {processing ? "Processing…" : "Take photo"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      </div>

      {isCash && (
        <label className="flex items-center gap-2 rounded-xl bg-goldsoft p-2.5 text-sm font-semibold text-[#8a611f]">
          <input type="checkbox" checked={cashCollected} onChange={(e) => setCashCollected(e.target.checked)} className="h-4 w-4 accent-gold" />
          <Banknote size={15} /> Cash collected: AED {order.total.toFixed(2)}
        </label>
      )}

      <button
        onClick={() => onAdvance(order.id, "delivered", { photoData: photoData ?? undefined, cashCollected })}
        disabled={actingOn === order.id || !canConfirm}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        <CheckCircle2 size={15} /> {canConfirm ? "Mark as delivered" : "Photo required" + (isCash ? " · confirm cash" : "")}
      </button>
    </div>
  );
}

function EarningsView({ earnings, onWithdrawn }: { earnings: Earnings | null; onWithdrawn: () => void }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  async function withdraw() {
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      const res = await fetch("/api/rider/payouts", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Could not withdraw");
      onWithdrawn();
    } catch (e: any) {
      setWithdrawError(e.message);
    } finally {
      setWithdrawing(false);
    }
  }

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
          <Wallet size={13} /> Available to withdraw
        </div>
        <div className="mt-1 font-display text-2xl font-bold">AED {earnings.availableToWithdraw.toFixed(2)}</div>
        <div className="mt-1 text-xs text-sand/70">{earnings.availableDeliveries} deliveries since last payout</div>
        {withdrawError && <p className="mt-2 text-xs font-semibold text-clay">{withdrawError}</p>}
        <button
          onClick={withdraw}
          disabled={withdrawing || earnings.availableToWithdraw <= 0}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold py-2.5 text-sm font-bold text-ink disabled:opacity-50"
        >
          <ArrowDownToLine size={15} /> {withdrawing ? "Processing…" : "Withdraw earnings"}
        </button>
      </div>

      <div className="rounded-2xl bg-paper p-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Recent payouts</div>
        {earnings.recentPayouts.length === 0 && <p className="text-sm text-muted">No payouts yet.</p>}
        <div className="space-y-2">
          {earnings.recentPayouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-semibold text-ink">Weekly payout</div>
                <div className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString()} · {p.deliveriesCount} deliveries</div>
              </div>
              <span className="font-mono font-bold text-ink">AED {p.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-sanddeep p-4">
        <div className="text-xs text-muted">Total earned (all-time)</div>
        <div className="mt-1 font-display text-lg font-bold text-ink">AED {earnings.totalEarnings.toFixed(2)}</div>
        <div className="text-xs text-muted">{earnings.totalDeliveries} deliveries completed all-time</div>
      </div>

      <p className="text-[11px] text-muted">
        No real bank/payout rail is connected yet — "Withdraw" records a payout request as a paper trail, the same
        way Admin Panel refunds are logged, rather than moving real money.
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
                <div className="text-xs text-muted">
                  {new Date(o.createdAt).toLocaleString()}
                  {o.status === "delivered" && o.customerRating ? (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-gold">
                      <Star size={11} className="fill-gold" /> {o.customerRating.toFixed(1)} from customer
                    </span>
                  ) : null}
                </div>
                {o.status === "delivered" && (
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
                    {o.hasProofPhoto && (
                      <span className="inline-flex items-center gap-0.5 text-teal">
                        <Camera size={10} /> Photo saved
                      </span>
                    )}
                    {o.paymentMethod === "cash" && (
                      <span className={`inline-flex items-center gap-0.5 ${o.cashCollected ? "text-teal" : "text-clay"}`}>
                        <Banknote size={10} /> {o.cashCollected ? "Cash collected" : "Cash not confirmed"}
                      </span>
                    )}
                  </div>
                )}
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
