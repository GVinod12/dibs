import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ADMIN_COOKIE } from "./constants";

/**
 * Deliberately minimal: one shared password for the owner dashboard, no user
 * accounts. The cookie stores an HMAC of a fixed marker keyed by the password,
 * so the plaintext password never rides in the cookie.
 */

function expectedToken(): string | null {
  const pw = process.env.DIBS_ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("dibs-owner").digest("hex");
}

export function passwordConfigured(): boolean {
  return Boolean(process.env.DIBS_ADMIN_PASSWORD);
}

export function checkPassword(input: string): string | null {
  const pw = process.env.DIBS_ADMIN_PASSWORD;
  if (!pw) return null;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return expectedToken();
}

export async function isAdmin(): Promise<boolean> {
  const want = expectedToken();
  if (!want) return false;
  const got = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!got || got.length !== want.length) return false;
  try {
    return timingSafeEqual(Buffer.from(got), Buffer.from(want));
  } catch {
    return false;
  }
}

export { ADMIN_COOKIE };
