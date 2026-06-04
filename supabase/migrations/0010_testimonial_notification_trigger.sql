-- Phase 1 of public testimonial collection (part 2): the trigger function
-- and trigger that create a notification when a DRAFT testimonial lands.
--
-- Apply AFTER 0010_add_testimonial_notification_kind.sql has committed.
-- See that file's header for the enum-extension transactional rule.
--
-- Why DRAFT-only (WHEN new.is_published = false):
--
--   - The /leave-a-review public form (Phase 2) ALWAYS inserts with
--     is_published=false hardcoded - the admin reviews before publishing.
--     Those drafts are exactly what's worth a notification (something for
--     the admin to act on).
--   - Admin-created testimonials via the TestimonialsListPanel are
--     typically published immediately (is_published=true) and the admin
--     already knows about them - notifying themselves would be noise.
--   - The WHEN clause means Postgres skips the function call entirely on
--     published-true rows. No work done, no warning, no log line.
--
-- Why the EXCEPTION wrapper (same pattern as 0009 triggers):
--   A failure in the notification path must NEVER block the testimonial
--   insert. A submitted review is a person took the time to write
--   something nice; a broken notification target is an admin annoyance.
--   The wrapper logs a warning and lets the source row land.

create or replace function public.notify_on_testimonial_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_role text;
  v_title text;
  v_preview text;
begin
  -- Outer safety wrapper - see header comment for why.
  begin
    -- Name: trim + fall back to a sensible label. Public form requires
    -- a name (Phase 2 Zod), but the trigger has to be robust against
    -- direct SQL inserts and admin-side typos too.
    v_name := coalesce(nullif(trim(new.name), ''), 'anonymous reviewer');

    -- Role: optional context. When present, appended in parens so the
    -- title reads "New review from Jane Smith (Operations Lead)".
    v_role := nullif(trim(new.role), '');

    v_title := case
      when v_role is not null
        then left('New review from ' || v_name || ' (' || v_role || ')', 200)
      else
        left('New review from ' || v_name, 200)
    end;

    -- Preview: first ~140 chars of the quote, so the bell + toast can
    -- show what the review actually says. Null-out empty strings so the
    -- bell renders cleanly without an empty line.
    v_preview := nullif(left(coalesce(new.quote, ''), 140), '');

    insert into public.notifications (kind, source_id, title, preview)
    values (
      'testimonial',
      new.id,
      v_title,
      v_preview
    );

  exception when others then
    raise warning 'notify_on_testimonial_insert failed for testimonial %: % (%)',
      new.id, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

-- The WHEN (new.is_published = false) filter is evaluated by Postgres
-- BEFORE the function is invoked, so published rows incur zero overhead.
drop trigger if exists testimonials_notify_after_insert on public.testimonials;
create trigger testimonials_notify_after_insert
  after insert on public.testimonials
  for each row
  when (new.is_published = false)
  execute function public.notify_on_testimonial_insert();

comment on function public.notify_on_testimonial_insert() is
  'Phase 1 of public testimonial collection. Fires only on draft (is_published=false) testimonial inserts via the trigger WHEN clause; the function body is wrapped in EXCEPTION WHEN OTHERS so a broken notifications path cannot block the testimonial insert.';
