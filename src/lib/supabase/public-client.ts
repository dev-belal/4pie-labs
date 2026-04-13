import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-free Supabase client for *anonymous* public reads (blog list,
 * testimonials, single-post lookup, sitemap generation, etc).
 *
 * Why this exists: the SSR client in ./server.ts calls `cookies()`,
 * which silently opts every importing page into fully-dynamic rendering
 * because cookies can't be evaluated at build/ISR time. Using a plain
 * client for reads that don't need a session lets Next.js actually
 * apply `export const revalidate = N` and serve cached HTML at the edge.
 *
 * Never use this for writes or for anything that depends on the signed-in
 * user — those must go through ./server.ts to carry the session cookie.
 */

// We haven't generated DB types, so fall back to the permissive default
// SupabaseClient (untyped Database). Prevents "argument of type … is not
// assignable to parameter of type 'never'" on insert/rpc calls.
let cached: SupabaseClient | null = null;

export function createPublicClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return cached;
}
