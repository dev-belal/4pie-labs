import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  makeAdminToken,
  verifyAdminToken,
  type SessionPayload,
} from "@/lib/admin-token";

/**
 * Lightweight HMAC-signed cookie session for the admin portal.
 * No Supabase Auth involved — the admin logs in with env-var credentials
 * and we issue a signed cookie that server actions / pages can verify.
 *
 * The crypto + token encoding lives in `@/lib/admin-token` (no `next/headers`
 * dependency) so the same verifier can run in the Proxy. This module owns the
 * cookie read/write side via `next/headers`.
 */

/** Read + verify the session cookie. Returns null if absent/invalid/expired. */
export async function readAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyAdminToken(raw);
}

/** Throws if no valid session. Use in server actions that require admin. */
export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await readAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

/** Issue a new session cookie for the given admin email. */
export async function startAdminSession(email: string): Promise<void> {
  const token = makeAdminToken(email);
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

/** Clear the session cookie. */
export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
