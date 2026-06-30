import { NextResponse } from "next/server";
import { updatePartnerProfile, setPartnerOpenStatus, getPartnerById } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireOwner() {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) return null;
  return session;
}

export async function GET() {
  const session = requireOwner();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const partner = await getPartnerById(session.partnerId!);
  return NextResponse.json(partner);
}

export async function PATCH(req: Request) {
  const session = requireOwner();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await req.json();

  if (typeof body.isOpen === "boolean") {
    await setPartnerOpenStatus(session.partnerId!, body.isOpen);
  }

  if (body.name || body.nameAr || body.cuisineTag || body.heroEmoji) {
    await updatePartnerProfile(session.partnerId!, {
      name: body.name,
      nameAr: body.nameAr,
      cuisineTag: body.cuisineTag,
      heroEmoji: body.heroEmoji,
    });
  }

  const partner = await getPartnerById(session.partnerId!);
  return NextResponse.json(partner);
}

