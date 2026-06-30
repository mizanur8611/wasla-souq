import { NextResponse } from "next/server";
import { updateRiderLocation } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = getSession();
  if (!session || session.role !== "rider") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { lat, lng } = await req.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng (numbers) are required" }, { status: 400 });
  }

  await updateRiderLocation(session.userId, lat, lng);
  return NextResponse.json({ ok: true });
}
