import { NextResponse } from "next/server";
import { listApprovedPartners } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") ?? undefined;
  const partners = await listApprovedPartners(city);
  return NextResponse.json(partners);
}

