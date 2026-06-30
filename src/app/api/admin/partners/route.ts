import { NextResponse } from "next/server";
import { findOrCreateCity, createPartner } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name || !body.items?.length) {
    return NextResponse.json({ error: "name and at least one catalog item are required" }, { status: 400 });
  }

  const city = await findOrCreateCity(body.cityName || "Dubai", "United Arab Emirates", "AED");

  const partner = await createPartner({
    name: body.name,
    nameAr: body.nameAr || null,
    cuisineTag: body.cuisineTag || null,
    heroEmoji: body.heroEmoji || "🍽️",
    halalVerified: body.halalVerified ?? true,
    cityId: city.id,
    items: body.items
      .filter((it: any) => it.name && it.price)
      .map((it: any) => ({
        category: it.category || "mains",
        name: it.name,
        nameAr: it.nameAr || null,
        description: it.description || null,
        price: parseFloat(it.price),
      })),
  });

  return NextResponse.json(partner, { status: 201 });
}
