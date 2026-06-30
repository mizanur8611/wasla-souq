import { NextResponse } from "next/server";
import { listApprovedPartners } from "@/lib/db";

// Without this, Next.js treats a parameter-less GET route as statically optimisable and
// tries to execute (and cache) it at BUILD TIME — which means a deploy on Render/Vercel
// would fail if the database isn't reachable during the build step, and would otherwise
// serve a stale snapshot of the restaurant list instead of live data.
export const dynamic = "force-dynamic";

export async function GET() {
  const partners = await listApprovedPartners();
  return NextResponse.json(partners);
}
