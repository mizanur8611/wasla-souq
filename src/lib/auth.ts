// Phase 1 authentication. Deliberately simple: bcrypt for password hashing, and a JSON
// session payload stored directly in an httpOnly cookie (no separate session table, no
// JWT library). This is enough for restaurant-owner and admin login; if/when rider and
// customer auth need mobile-app token support, that's a separate, additive piece of work
// rather than a rebuild of this.

import { cookies } from "next/headers";
export { hashPassword, verifyPassword } from "./auth-node";

const SESSION_COOKIE = "wasla_session";

export interface SessionPayload {
  userId: string;
  role: "admin" | "restaurant_owner";
  partnerId: string | null;
  name: string;
}

// Cookie value is base64-encoded JSON. This is NOT cryptographically signed — anyone who
// can read/write cookies on the user's machine could forge one. That's an acceptable
// tradeoff for Phase 1 (internal restaurant/admin tooling, not handling payment auth
// directly), but should be upgraded to a signed/encrypted cookie (e.g. iron-session) or a
// proper JWT before this is exposed to a large public base of restaurant owners.
export function setSessionCookie(payload: SessionPayload) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64");
  cookies().set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function getSession(): SessionPayload | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}
