// Split out from auth.ts because auth.ts imports next/headers, which only works inside a
// Next.js request — this file is also used by src/lib/seed.ts and standalone test scripts.
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
