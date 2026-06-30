import { NextResponse } from "next/server";
import { getPartnerSalesStats } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const stats = await getPartnerSalesStats(session.partnerId);
  return NextResponse.json(stats);
}

