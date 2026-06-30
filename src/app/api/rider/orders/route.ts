import { NextResponse } from "next/server";
import { listOrdersForRider } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "rider") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const orders = await listOrdersForRider(session.userId);
  return NextResponse.json(orders);
}

