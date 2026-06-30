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
  const { name, nameAr, category, description, price } = body;

  if (!name || !price || Number.isNaN(Number(price))) {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  }

  const itemId = await addCatalogItem(session.partnerId, {
    name,
    nameAr: nameAr || null,
    category: category || "mains",
    description: description || null,
    price: Number(price),
  });

  return NextResponse.json({ id: itemId });
}

