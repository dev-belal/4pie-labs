import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pure HMAC token logic for the admin session, with NO `next/headers`
 * dependency so it can be imported from both server components/actions
 * (via `@/lib/admin-session`) and the Proxy (`src/proxy.ts`), which is a
 * separate bundle that must not pull in `cookies()`.
 *
 * Token format: `<base64url(payload)>.<base64url(hmacSHA256(payload))>`
 * where payload is JSON `{ sub: email, iat: epochSeconds, exp: epochSeconds }`.
 */

export const ADMIN_COOKIE_NAME = "fpl_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET env var is missing or too short (need 32+ chars)",
    );
  }
  return s;
}

function sign(payloadB64: string): string {
  return b64url(createHmac("sha256", secret()).update(payloadB64).digest());
}

export function makeAdminToken(
  email: string,
  ttlSeconds = ADMIN_SESSION_TTL_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: email,
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verify a raw token string. Returns the payload if the signature is valid
 * (timing-safe compare) and the token is unexpired; otherwise null.
 * Never throws — a missing/short secret or malformed token yields null so
 * callers (including the Proxy gate) can fail closed safely.
 */
export function verifyAdminToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  let expected: string;
  try {
    expected = sign(payloadB64);
  } catch {
    // Missing/short ADMIN_SESSION_SECRET — treat as unauthenticated.
    return null;
  }

  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      b64urlDecode(payloadB64).toString("utf8"),
    ) as SessionPayload;
    if (!payload.sub || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
