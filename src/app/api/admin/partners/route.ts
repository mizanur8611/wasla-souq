import { NextResponse } from "next/server";
import { findOrCreateCity, createPartner, listAllPartnersForAdmin } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const partners = await listAllPartnersForAdmin();
  return NextResponse.json(partners);
}

export async function POST(req: Request) {
  // This route originally had no auth check (it backed the unauthenticated /admin
  // onboarding tool from Phase 0, before real login existed). Now that the Admin Panel
  // has real sessions, restaurant onboarding should only be reachable by a logged-in
  // admin — left open, anyone could create restaurants on the live site.
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

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

