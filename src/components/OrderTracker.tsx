"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import OrderStatus from "@/components/OrderStatus";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function OrderTracker({ orderId, initialOrder }: { orderId: string; initialOrder: any }) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    // Only worth polling while the order can still change — once delivered/cancelled the
    // status and rider position are final, so stop hitting the API.
    if (["delivered", "cancelled", "rejected"].includes(order.status)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) setOrder(await res.json());
      } catch {
        // Transient network errors just mean we try again on the next tick.
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId, order.status]);

  const destLat = order.deliveryLat;
  const destLng = order.deliveryLng;
  const riderLat = order.fulfilment?.riderLat;
  const riderLng = order.fulfilment?.riderLng;
  const hasDest = typeof destLat === "number" && typeof destLng === "number";
  const hasRiderFix = typeof riderLat === "number" && typeof riderLng === "number";
  const showMap = hasDest || hasRiderFix;

  return (
    <div>
      {showMap && (
        <div className="mb-5">
          <LiveMap
            center={hasRiderFix ? [riderLat, riderLng] : [destLat, destLng]}
            zoom={14}
            showLine={hasDest && hasRiderFix}
            pins={[
              ...(hasDest ? [{ lat: destLat, lng: destLng, emoji: "🏠", color: "#C68A3D", label: "Delivery address" }] : []),
              ...(hasRiderFix ? [{ lat: riderLat, lng: riderLng, emoji: "🛵", color: "#11645B", label: order.fulfilment?.riderName || "Your rider" }] : []),
            ]}
          />
          {!hasRiderFix && hasDest && (
            <p className="mt-2 text-[11px] text-muted">Rider location will appear here once a rider is on the way.</p>
          )}
        </div>
      )}
      <OrderStatus order={order} />
    </div>
  );
}
