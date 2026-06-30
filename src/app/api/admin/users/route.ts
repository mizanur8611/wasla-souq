import { NextResponse } from "next/server";
import { createUser, getUserByEmail, listAllUsers, ensureRiderProfile } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const users = await listAllUsers();
  return NextResponse.json(users);
}

// Phase 1 has no public restaurant/rider sign-up flow yet — accounts are created here by
// a logged-in admin from the User Management tab and handed to the owner/rider.
// A self-serve "request access" flow is a natural Phase 2 addition once there's demand.
export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

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
  if (role === "rider" && user) {
    await ensureRiderProfile(user.id);
  }

  return NextResponse.json({ id: user!.id, email: user!.email, role: user!.role, name: user!.name }, { status: 201 });
}

