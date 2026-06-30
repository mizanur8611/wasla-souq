import { NextResponse } from "next/server";
import { listAllDisputesForAdmin } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const disputes = await listAllDisputesForAdmin();
  return NextResponse.json(disputes);
}

