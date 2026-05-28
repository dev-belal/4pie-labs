-- Drop the dead is_admin() RLS layer left over from the old Supabase Auth design.
--
-- WHY:
-- These policies and the public.is_admin() helper date from when the admin
-- portal authenticated visitors as Supabase Auth users and gated writes on a
-- JWT `app_metadata.role = 'admin'` claim. The app no longer works that way:
--   * Admin auth is now an HMAC-signed cookie (env-var credentials), with no
--     Supabase Auth user session — see src/lib/admin-session.ts / src/proxy.ts.
--   * All admin reads/writes go through the service-role client
--     (src/lib/supabase/service.ts), which bypasses RLS entirely.
-- So nothing ever runs as a Supabase `authenticated` admin, and is_admin()
-- always evaluates to false in practice. A grep of the application code found
-- ZERO references to is_admin() outside these SQL migrations.
--
-- These policies are therefore dead code: misleading (they imply RLS protects
-- admin data when the service-role client is what actually does) and a footgun
-- for anyone who later assumes RLS is the guard. We drop them and the function.
--
-- IDEMPOTENT / CODE-DB SYNC ONLY:
-- This same cleanup was already applied to the production database manually via
-- the Supabase SQL editor on 2026-05-28 — production is already in sync. This
-- migration exists so the codebase's migration history matches, and so a fresh
-- run from scratch (new environment, local reset) ends in the same state. Every
-- statement uses IF EXISTS, so it is a safe no-op where the objects are already
-- gone and a clean drop everywhere else.
--
-- SAFETY: the public/anon policies are left untouched — blog & published-
-- testimonial reads, anon INSERT on leads/conversations/messages, and the
-- increment_blog_views RPC. Those are the only RLS paths the running app
-- exercises. After this migration the affected tables simply have no policy for
-- authenticated/anon admin operations, so those are denied for those roles;
-- the service-role client (RLS-exempt) continues to work unchanged.
--
-- Order matters: all 13 dependent policies are dropped first, then the
-- function — Postgres rejects DROP FUNCTION while a policy still depends on it.

begin;

-- blogs (from 0002) -----------------------------------------------------------
drop policy if exists "blogs_admin_insert" on public.blogs;
drop policy if exists "blogs_admin_update" on public.blogs;
drop policy if exists "blogs_admin_delete" on public.blogs;

-- testimonials (from 0002) ----------------------------------------------------
drop policy if exists "testimonials_admin_insert" on public.testimonials;
drop policy if exists "testimonials_admin_update" on public.testimonials;
drop policy if exists "testimonials_admin_delete" on public.testimonials;

-- leads (from 0004) -----------------------------------------------------------
drop policy if exists "leads_admin_select" on public.leads;
drop policy if exists "leads_admin_update" on public.leads;
drop policy if exists "leads_admin_delete" on public.leads;

-- conversations (from 0004) ---------------------------------------------------
drop policy if exists "conversations_admin_select" on public.conversations;
drop policy if exists "conversations_admin_delete" on public.conversations;

-- messages (from 0004) --------------------------------------------------------
drop policy if exists "messages_admin_select" on public.messages;
drop policy if exists "messages_admin_delete" on public.messages;

-- Finally drop the helper now that nothing depends on it.
drop function if exists public.is_admin();

commit;
