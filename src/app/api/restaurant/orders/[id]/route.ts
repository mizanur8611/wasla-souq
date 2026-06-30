import { NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Restaurant owners may only move an order through this specific subset of transitions.
// Anything past "ready_for_pickup" belongs to the rider flow, not the restaurant flow —
// keeping that boundary here means a restaurant owner can never directly mark their own
// order "delivered", which matters once a real rider app exists alongside this.
const RESTAURANT_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  placed: ["accepted", "rejected"],
  accepted: ["preparing"],
  preparing: ["ready_for_pickup"],
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { status: newStatus } = await req.json();

  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Ownership check: this restaurant owner can only act on orders placed at their own
  // restaurant. Without this, any logged-in restaurant owner could change any order's
  // status by guessing/enumerating order IDs.
  if (order.partnerId !== session.partnerId) {
    return NextResponse.json({ error: "Not authorized for this order" }, { status: 403 });
  }

  const allowedNext = RESTAURANT_ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot move order from "${order.status}" to "${newStatus}"` },
      { status: 400 }
    );
  }

  const updated = await updateOrderStatus(params.id, newStatus);
  return NextResponse.json(updated);
}
