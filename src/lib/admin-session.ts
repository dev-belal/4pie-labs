import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Lightweight HMAC-signed cookie session for the admin portal.
 * No Supabase Auth involved — the admin logs in with env-var credentials
 * and we issue a signed cookie that server actions / pages can verify.
 *
 * Token format: `<base64url(payload)>.<base64url(hmacSHA256(payload))>`
 * where payload is JSON `{ sub: email, iat: epochSeconds, exp: epochSeconds }`.
 */

const COOKIE_NAME = "fpl_admin_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
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

function makeToken(email: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: email,
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expected = sign(payloadB64);
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

/** Read + verify the session cookie. Returns null if absent/invalid/expired. */
export async function readAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyToken(raw);
}

/** Throws if no valid session. Use in server actions that require admin. */
export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await readAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

/** Issue a new session cookie for the given admin email. */
export async function startAdminSession(email: string): Promise<void> {
  const token = makeToken(email);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEFAULT_TTL_SECONDS,
  });
}

/** Clear the session cookie. */
export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
