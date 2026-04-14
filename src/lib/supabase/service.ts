import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for the admin portal.
 *
 * This bypasses RLS entirely, so it must only be used from server code that
 * has already verified an admin session (see `@/lib/admin-session`). Never
 * import this from a client component and never expose the key to the browser.
 */

let cached: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (cached) return cached;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is not set");
  }

  cached = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
