import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  // Same error for "no such user" and "wrong password" deliberately — confirming which
  // one is true to an unauthenticated caller is a minor information leak worth avoiding
  // even at this early stage.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  setSessionCookie({
    userId: user.id,
    role: user.role as "admin" | "restaurant_owner",
    partnerId: user.partnerId,
    name: user.name,
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role, name: user.name });
}
