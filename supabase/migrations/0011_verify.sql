-- Phase 2 of public testimonial collection - verify the RLS write
-- policy added in 0011_testimonial_public_insert_policy.sql.
--
-- Dashboard-compatible (no \gset). Tests use BEGIN ... ROLLBACK so they
-- self-clean. Two of them deliberately try to do something the policy
-- should REJECT - the test passes when the insert errors with a
-- "row-level security" / "new row violates RLS policy" message.

-- ===========================================================================
-- 1. The new policy exists with the right shape
-- ===========================================================================

select polname,
       polroles::regrole[]    as roles,
       polcmd                  as command,
       pg_get_expr(polwithcheck, polrelid) as with_check_expr,
       pg_get_expr(polqual, polrelid)      as using_expr
from pg_policy
where polrelid = 'public.testimonials'::regclass
  and polname = 'testimonials_anon_insert_draft';
-- EXPECT: 1 row -
--   roles           = {anon}
--   command         = 'a' (Postgres internal code for INSERT)
--   with_check_expr = "(is_published = false)"
--   using_expr      = NULL (INSERT policies have WITH CHECK only)

-- ===========================================================================
-- 2. POSITIVE: anon CAN insert a draft testimonial
-- ===========================================================================

begin;
  set local role anon;
  insert into public.testimonials (name, role, headline, quote, rating, is_published)
  values (
    'Policy Verify Reviewer',
    'Tester',
    'Policy verify headline',
    'Verifies anon may insert a draft. Rolled back.',
    5,
    false
  );
  -- If this far without an error, the policy allowed the insert.
  -- Cannot easily SELECT to confirm because anon can only see PUBLISHED
  -- rows (testimonials_public_read_published from 0001). That's the
  -- desired posture; this comment substitutes for an assertion.
  reset role;
  -- Re-querying as the dashboard role lets us confirm the row landed.
  select count(*) as anon_draft_landed
  from public.testimonials
  where headline = 'Policy verify headline';
  -- EXPECT: 1 row, anon_draft_landed = 1
rollback;
-- The rollback also undoes the notification the Phase 1 trigger created.
-- No production state change.

-- ===========================================================================
-- 3. NEGATIVE: anon CANNOT insert a published testimonial
-- ===========================================================================
--
-- The WITH CHECK (is_published = false) clause should reject this. The
-- insert raises an exception; the DO block captures it via the
-- exception handler and reports "blocked." If it instead reports
-- "WAS INSERTED" the policy is misconfigured.

begin;
  do $$
  begin
    set local role anon;
    begin
      insert into public.testimonials (name, role, headline, quote, rating, is_published)
      values (
        'Policy Verify Reviewer (published)',
        'Tester',
        'Policy verify headline PUBLISHED',
        'Should be REJECTED by the WITH CHECK policy.',
        5,
        true
      );
      raise notice 'RLS check FAILED: anon INSERT with is_published=true WAS INSERTED (policy is wrong)';
    exception when others then
      raise notice 'RLS check OK: anon INSERT with is_published=true was blocked (%)', sqlerrm;
    end;
    reset role;
  end $$;
  -- EXPECT in notices: "RLS check OK: anon INSERT with is_published=true
  -- was blocked (new row violates row-level security policy ...)"
rollback;

-- ===========================================================================
-- 4. NEGATIVE: anon CANNOT update or delete testimonials
-- ===========================================================================
--
-- The new policy is INSERT-only. UPDATE / DELETE are still gated by the
-- existing auth-only policies from 0001, so anon should still be blocked
-- from both. (Defensive: a future change could over-broaden by mistake.)

do $$
declare
  v_rows integer;
begin
  set local role anon;
  begin
    update public.testimonials set name = 'tampered' where headline = 'nonexistent-row';
    -- The UPDATE itself doesn't necessarily error if RLS just filters out
    -- the visible rows; we look at GET DIAGNOSTICS to count touched rows.
    get diagnostics v_rows = row_count;
    raise notice 'RLS check: anon UPDATE touched % rows (expect 0)', v_rows;
  exception when others then
    raise notice 'RLS check: anon UPDATE errored with % - also acceptable', sqlerrm;
  end;
  begin
    delete from public.testimonials where headline = 'nonexistent-row';
    get diagnostics v_rows = row_count;
    raise notice 'RLS check: anon DELETE touched % rows (expect 0)', v_rows;
  exception when others then
    raise notice 'RLS check: anon DELETE errored with % - also acceptable', sqlerrm;
  end;
  reset role;
end $$;

-- ===========================================================================
-- 5. Read posture unchanged: anon still cannot read DRAFTS
-- ===========================================================================

begin;
  -- Insert a draft as the dashboard role so it actually lands without
  -- depending on the new policy.
  insert into public.testimonials (name, role, headline, quote, rating, is_published)
  values ('Visibility Test', 'Tester', 'Visibility test draft', 'q', 5, false);

  do $$
  declare
    v_count integer;
  begin
    set local role anon;
    select count(*) into v_count
    from public.testimonials
    where headline = 'Visibility test draft';
    raise notice 'Visibility check: anon SELECT of draft returned % rows (expect 0)', v_count;
    reset role;
  end $$;
  -- EXPECT in notices: "Visibility check: anon SELECT of draft returned
  -- 0 rows" - confirms the existing testimonials_public_read_published
  -- policy still gates drafts to admin-only.
rollback;

-- ===========================================================================
-- Summary
-- ===========================================================================
-- All 5 blocks should report the EXPECT lines. The load-bearing ones
-- are Block 2 (anon CAN draft-insert) and Block 3 (anon CANNOT publish-
-- insert). If Block 3 says "WAS INSERTED" the policy is wrong and the
-- /leave-a-review form's DB-level guard is missing - stop and report.
