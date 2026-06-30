import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Phase 1 has no public restaurant sign-up flow yet — accounts are created by an admin
// (or, for local setup, by the seed script) and handed to the restaurant owner. A
// self-serve "request access" flow is a natural Phase 2 addition once there's an Admin
// Panel UI to approve those requests against, per the Full Platform Specification.
export async function POST(req: Request) {
  const { email, password, name, partnerId, role } = await req.json();

  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: "email, password, name, and role are required" }, { status: 400 });
  }
  if (role === "restaurant_owner" && !partnerId) {
    return NextResponse.json({ error: "partnerId is required for restaurant_owner accounts" }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, role, name, partnerId: partnerId ?? null });

  return NextResponse.json({ id: user!.id, email: user!.email, role: user!.role, name: user!.name }, { status: 201 });
}
