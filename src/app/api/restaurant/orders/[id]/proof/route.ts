import { NextResponse } from "next/server";
import { getOrderById, getDeliveryProofForOrder } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // Ownership check: a restaurant owner may only view proof photos for orders placed at
  // their own restaurant, not any order by guessing/enumerating IDs.
  const order = await getOrderById(params.id);
  if (!order || order.partnerId !== session.partnerId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const proof = await getDeliveryProofForOrder(params.id);
  if (!proof) return NextResponse.json({ error: "No delivery record for this order" }, { status: 404 });
  return NextResponse.json(proof);
}

