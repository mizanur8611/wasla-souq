import { NextResponse } from "next/server";
import { getPartnerById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const partner = await getPartnerById(params.id);
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  return NextResponse.json(partner);
}
