import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-token";

/**
 * Admin-area gate. Proxy runs on the Node.js runtime by default in Next 16,
 * so we can verify the HMAC session cookie (`@/lib/admin-token`, timing-safe)
 * here as defense-in-depth in front of the page-level `readAdminSession()`
 * check. This file MUST live at `src/proxy.ts` (next to `src/app`) to be
 * picked up - a stray `proxy.ts` at the repo root is silently ignored.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page must stay reachable, or we recreate an infinite redirect.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? verifyAdminToken(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Guard the admin area only. `/admin` exactly plus everything under it.
  matcher: ["/admin", "/admin/:path*"],
};
