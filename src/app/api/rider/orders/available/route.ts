import { NextResponse } from "next/server";
import { listAvailableOrdersForRiders } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "rider") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const orders = await listAvailableOrdersForRiders();
  return NextResponse.json(orders);
}
