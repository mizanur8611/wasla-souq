import { NextResponse } from "next/server";
import { setPartnerStatus } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { status } = await req.json();
  try {
    const updated = await setPartnerStatus(params.id, status);
    if (!updated) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

