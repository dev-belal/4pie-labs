-- Phase 2 of public testimonial collection: RLS policy that lets anon
-- INSERT testimonials, but ONLY as drafts (is_published = false).
--
-- Why a database-level guard, not just application-level:
--
--   The /leave-a-review server action hardcodes is_published = false in
--   the insert payload (it never reads is_published from the client
--   submission). That's the first line of defense.
--
--   But "never trust the client OR the server action either" is the
--   right posture for something that affects the public homepage.
--   Without this policy, a future bug - a copy-paste in another action,
--   a refactor that wires a wrong field through, an admin temporarily
--   downgrading to anon for debugging - could silently let an
--   anon-submitted row land published. The RLS WITH CHECK below makes
--   that physically impossible: the row is rejected by Postgres before
--   it touches the table.
--
--   The cost is one extra check per anon insert, which is negligible
--   relative to the human-paced submission rate (one form, manually
--   filled). Defense in depth.
--
-- Why not also constrain other columns (name length, rating range, etc.):
--
--   Those are validated by Zod in the server action and by the table's
--   own CHECK constraints (rating BETWEEN 1 AND 5 already lives on the
--   column). Replicating that here would be churn with no marginal
--   security benefit. The ONLY guarantee we want from RLS is
--   "the public path cannot publish."
--
-- Read posture is unchanged: the existing testimonials_public_read_published
-- policy from 0001 still gates anon SELECT to is_published = true rows.
-- That means an anon caller can submit a draft AND then immediately try to
-- SELECT it back to confirm landing -- and they will NOT see it (draft
-- visibility is admin-only). Which is the desired UX too: the form's
-- success state is "thanks, we'll review it," not "here's your live row."

drop policy if exists "testimonials_anon_insert_draft" on public.testimonials;

create policy "testimonials_anon_insert_draft"
  on public.testimonials
  for insert
  to anon
  with check (is_published = false);

comment on policy "testimonials_anon_insert_draft" on public.testimonials is
  'Phase 2 of public testimonial collection. Anon may INSERT only with is_published = false. Lets the /leave-a-review form land drafts for admin review; physically blocks any anon caller from publishing directly. Other write paths (UPDATE, DELETE) and reads of unpublished rows remain admin-only.';
