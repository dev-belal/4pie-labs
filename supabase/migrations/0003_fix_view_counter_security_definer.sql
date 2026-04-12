-- After 0002 locked blog UPDATE to admins only, anonymous visitors could
-- no longer increment the view counter (the RPC was `security invoker`, so
-- it inherited the caller's RLS).
--
-- Make the RPC `security definer` so it runs with the function owner's
-- privileges and can touch `blogs.views` even for anon callers. search_path
-- is pinned to '' and every identifier is schema-qualified, so the function
-- has zero surface area for injection.

create or replace function public.increment_blog_views(p_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.blogs set views = views + 1 where slug = p_slug;
$$;

grant execute on function public.increment_blog_views(text) to anon, authenticated;
