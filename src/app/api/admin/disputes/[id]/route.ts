import { NextResponse } from "next/server";
import { resolveDispute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { resolution, refundAmount } = await req.json();
  if (!resolution) {
    return NextResponse.json({ error: "resolution note is required" }, { status: 400 });
  }

  const updated = await resolveDispute(
    params.id,
    resolution,
    typeof refundAmount === "number" ? refundAmount : null
  );
  if (!updated) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  return NextResponse.json(updated);
}

