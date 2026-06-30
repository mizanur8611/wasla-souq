import { NextResponse } from "next/server";
import { recordRiderDecline } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = getSession();
  if (!session || session.role !== "rider") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  await recordRiderDecline(session.userId);
  return NextResponse.json({ ok: true });
}

