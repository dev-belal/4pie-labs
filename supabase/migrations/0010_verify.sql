-- Phase 1 testimonial-notification verification. Apply both 0010 files
-- (enum extension + trigger function) FIRST, then run this in the
-- Supabase dashboard SQL editor.
--
-- Dashboard-compatible: pure SQL, no psql meta-commands (no \gset). The
-- two end-to-end tests use BEGIN ... ROLLBACK so they self-clean and
-- leave the production state unchanged.

-- ===========================================================================
-- 1. Enum extension landed
-- ===========================================================================

select enumlabel
from pg_enum
where enumtypid = 'public.notification_kind'::regtype
order by enumsortorder;
-- EXPECT: 4 rows: lead, conversation, appointment, testimonial
-- (testimonial appears last because ADD VALUE without BEFORE/AFTER
--  appends to the end.)

-- ===========================================================================
-- 2. Trigger function exists, is SECURITY DEFINER, has search_path locked
-- ===========================================================================

select proname,
       case prosecdef when true then 'SECURITY DEFINER' else 'SECURITY INVOKER' end as security,
       proconfig
from pg_proc
where proname = 'notify_on_testimonial_insert';
-- EXPECT: 1 row, SECURITY DEFINER, proconfig including 'search_path='

-- ===========================================================================
-- 3. Trigger exists, is AFTER INSERT, has the draft-only WHEN clause
-- ===========================================================================

select event_object_table as on_table,
       trigger_name,
       action_timing,
       event_manipulation as event,
       action_condition,
       action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and trigger_name = 'testimonials_notify_after_insert';
-- EXPECT: 1 row -
--   on_table         = testimonials
--   action_timing    = AFTER
--   event            = INSERT
--   action_condition contains "is_published" (the WHEN filter)
--   action_statement = EXECUTE FUNCTION public.notify_on_testimonial_insert()

-- ===========================================================================
-- 4. Positive test: a DRAFT testimonial produces exactly one notification
--    with the correct title and preview. Self-rolling-back via ROLLBACK.
-- ===========================================================================

begin;
  insert into public.testimonials (name, role, headline, quote, rating, is_published)
  values (
    'Phase 1 Verify Reviewer',
    'Test Operations Lead',
    'Phase 1 verify headline',
    'This is a verification quote inserted by 0010_verify.sql; rolled back.',
    5,
    false
  );

  select count(*)                       as notif_count,
         max(kind::text)                as kind,
         max(title)                     as title,
         max(preview)                   as preview
  from public.notifications
  where source_id = (
    select id from public.testimonials
    where headline = 'Phase 1 verify headline'
  );
  -- EXPECT: 1 row -
  --   notif_count = 1
  --   kind        = "testimonial"
  --   title       = "New review from Phase 1 Verify Reviewer (Test Operations Lead)"
  --   preview     contains "This is a verification quote..." (first 140 chars)
rollback;
-- Rollback undoes BOTH the testimonial AND the notification. No
-- production state change.

-- ===========================================================================
-- 5. Negative test: a PUBLISHED testimonial produces ZERO notifications
--    (the WHEN clause should skip the trigger entirely).
-- ===========================================================================

begin;
  insert into public.testimonials (name, role, headline, quote, rating, is_published)
  values (
    'Phase 1 Published Reviewer',
    'Should Not Notify',
    'Phase 1 published headline',
    'This published testimonial must NOT generate a notification.',
    5,
    true
  );

  select count(*) as notif_count_should_be_zero
  from public.notifications
  where source_id = (
    select id from public.testimonials
    where headline = 'Phase 1 published headline'
  );
  -- EXPECT: 1 row, notif_count_should_be_zero = 0
  --   If this returns 1, the WHEN clause is misconfigured and admin-
  --   published testimonials would generate noise.
rollback;

-- ===========================================================================
-- 6. RLS: anon still cannot read notifications (unchanged from 0009)
-- ===========================================================================

do $$
declare
  v_count integer;
begin
  set local role anon;
  begin
    select count(*) into v_count from public.notifications;
    raise notice 'RLS check: anon SELECT returned % rows (expect 0 - RLS hides all rows)', v_count;
  exception when others then
    raise notice 'RLS check: anon SELECT errored with % - this is also acceptable', sqlerrm;
  end;
  reset role;
end $$;
-- EXPECT in notices: anon SELECT returned 0 rows OR a permission-denied
-- error. Either is the "denied" signal.

-- ===========================================================================
-- Summary
-- ===========================================================================
-- All 6 blocks should report the EXPECT lines. If any block reports a
-- mismatch, stop and report - most likely failures are:
--   - Block 1 missing 'testimonial': the enum extension file was skipped
--     or the wrong file was applied
--   - Block 4 notif_count = 0: the trigger fires but the EXCEPTION block
--     swallowed an error (check the Messages tab for "WARNING:
--     notify_on_testimonial_insert failed ..." lines)
--   - Block 5 notif_count_should_be_zero = 1: the WHEN clause is not
--     filtering. Re-check action_condition in block 3 output.
