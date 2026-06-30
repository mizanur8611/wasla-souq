import { NextResponse } from "next/server";
import { submitOrderRating } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const rating = Number(body.rating);

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const order = await submitOrderRating(params.id, rating, body.review || null);
  return NextResponse.json(order);
}

