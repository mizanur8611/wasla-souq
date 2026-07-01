import { NextResponse } from "next/server";
import { addCatalogItem } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, nameAr, category, description, price, imageData } = body;

  if (!name || !price || Number.isNaN(Number(price))) {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  }

  const itemId = await addCatalogItem(session.partnerId, {
    name,
    nameAr: nameAr || null,
    category: category || "mains",
    description: description || null,
    price: Number(price),
    imageUrl: typeof imageData === "string" && imageData.startsWith("data:image/") ? imageData : null,
  });

  return NextResponse.json({ id: itemId });
}


export async function GET() {
  const { getSession } = await import("@/lib/auth");
  const { pool } = await import("@/lib/db") as any;
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    const { NextResponse } = await import("next/server");
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { NextResponse } = await import("next/server");
  const res = await pool.query(
    "SELECT id, name, price, image_url AS \"imageUrl\" FROM catalog_items WHERE partner_id = $1 ORDER BY created_at ASC",
    [session.partnerId]
  );
  return NextResponse.json(res.rows);
}

