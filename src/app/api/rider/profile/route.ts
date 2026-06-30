import { NextResponse } from "next/server";
import { getRiderProfile, setRiderOnlineStatus, updateRiderVehicle } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "rider") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const profile = await getRiderProfile(session.userId);
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const session = getSession();
  if (!session || session.role !== "rider") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { isOnline, vehicleType } = await req.json();

  if (typeof isOnline === "boolean") {
    await setRiderOnlineStatus(session.userId, isOnline);
  }
  if (typeof vehicleType === "string" && vehicleType.trim()) {
    await updateRiderVehicle(session.userId, vehicleType.trim());
  }

  const profile = await getRiderProfile(session.userId);
  return NextResponse.json(profile);
}

