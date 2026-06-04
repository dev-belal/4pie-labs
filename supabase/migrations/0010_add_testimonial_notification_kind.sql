-- Phase 1 of public testimonial collection: add 'testimonial' to the
-- notification_kind enum so the trigger function in 0010b can insert it.
--
-- Why this is its OWN migration file (not bundled with the trigger):
--
--   Postgres rule (PG 12+): ALTER TYPE ... ADD VALUE CAN run inside a
--   transaction block, BUT the new enum value cannot be used (compared,
--   inserted, cast to) within the SAME transaction. The trigger function
--   in 0010b inserts 'testimonial'::notification_kind into the
--   notifications table; if that file were combined with this one and
--   run as a single query in the Supabase dashboard (which wraps each
--   "Run" in BEGIN ... COMMIT), the function CREATE would succeed but
--   the FIRST trigger fire after the COMMIT could surprise (some PG
--   versions cache the enum lookup at CREATE time and re-validate on
--   first call).
--
--   The safe, version-independent pattern is: commit the enum extension
--   on its own, THEN apply the trigger file in a separate dashboard query.
--   So apply order is:
--     1. Run 0010_add_testimonial_notification_kind.sql alone (this file).
--        Wait for "Success".
--     2. Run 0010_testimonial_notification_trigger.sql in a NEW query.
--     3. Run 0010_verify.sql in a third NEW query.
--
-- Idempotency: ADD VALUE supports IF NOT EXISTS, so re-running this file
-- on an already-extended enum is a no-op (does not error).

alter type public.notification_kind add value if not exists 'testimonial';

-- Documentation: enum now covers four event sources.
comment on type public.notification_kind is
  'Source kind for an admin notification. lead/conversation/appointment created in 0009; testimonial added in 0010 for the public /leave-a-review submission flow (draft submissions only).';
