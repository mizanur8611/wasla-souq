import { NextResponse } from "next/server";
import { updateRiderOrderStatus } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "rider") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { status: newStatus, photoData, cashCollected } = await req.json();

  try {
    const updated = await updateRiderOrderStatus(params.id, session.userId, newStatus, { photoData, cashCollected });
    if (!updated) {
      return NextResponse.json({ error: "Order not found or not assigned to you" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

