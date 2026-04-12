-- Security hardening pass on top of 0001_initial_schema.
-- Triggered by `supabase get_advisors` warnings:
--  - function_search_path_mutable (increment_blog_views)
--  - rls_policy_always_true (blogs + testimonials INSERT/UPDATE/DELETE)
--
-- Key change: writes on blogs and testimonials now require an explicit
-- `app_metadata.role = 'admin'` claim in the JWT, not just "any authenticated
-- user". app_metadata is server-controlled and cannot be set by users
-- themselves, so this closes the hole that public sign-ups would otherwise
-- open (the legacy `using (true)` policies would have promoted any new
-- signup to admin).

-- 1. Admin check used by the policies below.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- 2. Lock the RPC's search_path (linter warning 0011).
create or replace function public.increment_blog_views(p_slug text)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.blogs set views = views + 1 where slug = p_slug;
$$;

-- 3. Blogs: require admin for writes.
drop policy if exists "blogs_auth_insert" on public.blogs;
drop policy if exists "blogs_auth_update" on public.blogs;
drop policy if exists "blogs_auth_delete" on public.blogs;

create policy "blogs_admin_insert"
  on public.blogs for insert
  to authenticated
  with check (public.is_admin());

create policy "blogs_admin_update"
  on public.blogs for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "blogs_admin_delete"
  on public.blogs for delete
  to authenticated
  using (public.is_admin());

-- 4. Testimonials: same policy.
drop policy if exists "testimonials_auth_insert" on public.testimonials;
drop policy if exists "testimonials_auth_update" on public.testimonials;
drop policy if exists "testimonials_auth_delete" on public.testimonials;

create policy "testimonials_admin_insert"
  on public.testimonials for insert
  to authenticated
  with check (public.is_admin());

create policy "testimonials_admin_update"
  on public.testimonials for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "testimonials_admin_delete"
  on public.testimonials for delete
  to authenticated
  using (public.is_admin());

-- 5. Metrics INSERT remains `with check (true)` by design — view tracking from
--    anonymous visitors is the entire point of the table. The linter warning
--    for that policy is accepted.
