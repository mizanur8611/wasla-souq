import { NextResponse } from "next/server";
import { getDeliveryProofForOrder } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const proof = await getDeliveryProofForOrder(params.id);
  if (!proof) return NextResponse.json({ error: "No delivery record for this order" }, { status: 404 });
  return NextResponse.json(proof);
}

