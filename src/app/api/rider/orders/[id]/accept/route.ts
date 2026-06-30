import { NextResponse } from "next/server";
import { assignRiderToOrder } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "rider") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const updated = await assignRiderToOrder(params.id, session.userId, session.name);
  if (!updated) {
    // Either the order doesn't exist, or another rider claimed it first (rider_id was no
    // longer NULL by the time this UPDATE ran) — same response either way.
    return NextResponse.json({ error: "This order is no longer available" }, { status: 409 });
  }
  return NextResponse.json(updated);
}

