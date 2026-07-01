import { NextResponse } from "next/server";
import { updatePartnerImage } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// The image arrives as a base64 data URL, already resized to ≤800px on the client
// (same approach as the proof-of-delivery photo). No S3/Cloudinary is wired up yet —
// the data URL goes straight into the partners.image_url column. This replaces the
// loremflickr.com placeholder that was baked in at seed time.
export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "restaurant_owner" || !session.partnerId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { imageData } = await req.json();
  if (!imageData || !imageData.startsWith("data:image/")) {
    return NextResponse.json({ error: "imageData must be a base64 data URL" }, { status: 400 });
  }

  await updatePartnerImage(session.partnerId, imageData);
  return NextResponse.json({ ok: true });
}

