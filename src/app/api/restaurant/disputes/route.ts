import { NextResponse } from "next/server";
import { createDispute, listDisputesForPartner } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const disputes = await listDisputesForPartner(session.partnerId);
  return NextResponse.json(disputes);
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.message || !body.message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  const disputeId = await createDispute(session.partnerId, body.message.trim(), body.orderId || null);
  return NextResponse.json({ id: disputeId });
}

