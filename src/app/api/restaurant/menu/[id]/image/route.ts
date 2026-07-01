import { NextResponse } from "next/server";
import { updateCatalogItemImage } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { imageData } = await req.json();
  if (!imageData || !imageData.startsWith("data:image/")) {
    return NextResponse.json({ error: "imageData must be a base64 data URL" }, { status: 400 });
  }

  // updateCatalogItemImage includes a partner_id ownership check so an owner can only
  // update items belonging to their own restaurant.
  await updateCatalogItemImage(params.id, session.partnerId, imageData);
  return NextResponse.json({ ok: true });
}

