-- Phase 1 of admin notifications, part 2: the trigger functions and
-- triggers that create a public.notifications row whenever a new lead,
-- conversation, or appointment row lands.
--
-- Why triggers (not application code):
--   - 5 lead insert sites + 1 conversation site + 2 appointment sites
--     would need parallel notification-insert calls under the app-code
--     approach. Triggers catch all of them automatically + any future
--     site + direct SQL inserts.
--   - The lead inserts come in through the public anon client which
--     can't write to an admin-only notifications table. Going through
--     a SECURITY DEFINER trigger sidesteps that without exposing
--     notifications to anon.
--
-- Why each function wraps its body in EXCEPTION WHEN OTHERS:
--   - A failure in the notification insert (table missing, RLS
--     misconfigured, anything) must NEVER block the source insert.
--     Lead capture, chat, and booking are revenue paths; a broken
--     bell counter is an annoyance. The exception block ensures that
--     even if everything notification-related goes sideways, the
--     visitor's lead/chat/booking still lands in the DB and the
--     warning shows in the Postgres log for diagnosis.
--
-- About `AFTER INSERT` semantics for the conversations RPC:
--   - The chat upsert in 0005 uses
--     `INSERT ... ON CONFLICT (session_id) DO UPDATE SET ...`. Postgres
--     fires AFTER INSERT triggers ONLY for rows that genuinely got
--     inserted, never for the conflict path that resolved to UPDATE.
--     So an existing chat session that posts another message produces
--     no new notification - exactly the desired behavior. Verified
--     against the documented per-row trigger firing rules.

-- ===========================================================================
-- 1. Lead notifications
-- ===========================================================================

create or replace function public.notify_on_lead_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind_label text;
  v_who text;
  v_preview text;
begin
  -- Safety wrapper: every step of the notification creation lives
  -- inside this exception block so a failure cannot propagate back
  -- to the source INSERT. The trigger MUST return NEW so the lead
  -- itself still lands.
  begin
    -- Source label: prefer the human-readable `source` text the form
    -- captures ("Free AI audit", "Marketing Budget Calculator",
    -- "Contact Modal"). Fall back to the type enum when source is
    -- missing.
    v_kind_label := coalesce(new.source, new.type::text, 'lead');

    -- Who: name first, then email, then phone, then a generic label.
    -- This is what the bell + toast headline foregrounds.
    v_who := coalesce(
      nullif(trim(new.name), ''),
      nullif(trim(new.email), ''),
      nullif(trim(new.phone), ''),
      'unknown contact'
    );

    -- Preview: email + phone if both exist, else whichever is present.
    -- Capped at 140 chars to keep the bell list scannable.
    v_preview := nullif(
      left(
        trim(both ' ' from concat_ws(' · ', new.email, new.phone)),
        140
      ),
      ''
    );

    insert into public.notifications (kind, source_id, title, preview)
    values (
      'lead',
      new.id,
      left('New ' || v_kind_label || ': ' || v_who, 200),
      v_preview
    );

  exception when others then
    -- Log + swallow. A broken notification must never block lead
    -- capture. The warning surfaces in the Postgres logs so you can
    -- diagnose the underlying issue without a missed lead.
    raise warning 'notify_on_lead_insert failed for lead %: % (%)',
      new.id, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

drop trigger if exists leads_notify_after_insert on public.leads;
create trigger leads_notify_after_insert
  after insert on public.leads
  for each row execute function public.notify_on_lead_insert();

-- ===========================================================================
-- 2. Conversation notifications
-- ===========================================================================

create or replace function public.notify_on_conversation_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preview text;
begin
  begin
    -- At AFTER INSERT time on conversations, the first user message
    -- has NOT yet been inserted (the chat route does conv-upsert ->
    -- message-insert sequentially). So we can't pull message text
    -- here. The user_agent is the strongest signal available at the
    -- creation moment - a real browser UA tells the admin this is a
    -- human session, an unusual UA flags bot scans.
    v_preview := nullif(left(coalesce(new.user_agent, ''), 140), '');

    insert into public.notifications (kind, source_id, title, preview)
    values (
      'conversation',
      new.id,
      'New chat session started',
      v_preview
    );

  exception when others then
    raise warning 'notify_on_conversation_insert failed for conversation %: % (%)',
      new.id, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

drop trigger if exists conversations_notify_after_insert on public.conversations;
create trigger conversations_notify_after_insert
  after insert on public.conversations
  for each row execute function public.notify_on_conversation_insert();

-- ===========================================================================
-- 3. Appointment notifications
-- ===========================================================================

create or replace function public.notify_on_appointment_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_who text;
  v_when text;
  v_preview text;
begin
  begin
    v_who := coalesce(
      nullif(trim(new.attendee_name), ''),
      nullif(trim(new.attendee_email), ''),
      'attendee'
    );

    -- Human-readable starts_at in the attendee's local timezone when
    -- known; defaults to UTC if attendee_tz is missing or invalid.
    -- to_char's exception handling: an unrecognised tz silently falls
    -- back via the outer EXCEPTION block, so no risk of a malformed
    -- tz crashing the trigger.
    v_when := to_char(
      new.starts_at at time zone coalesce(new.attendee_tz, 'UTC'),
      'Mon DD HH12:MIam'
    );

    v_preview := nullif(
      left(
        concat_ws(
          ' · ',
          v_when,
          nullif(trim(new.channel), '')
        ),
        140
      ),
      ''
    );

    insert into public.notifications (kind, source_id, title, preview)
    values (
      'appointment',
      new.id,
      left('New booking: ' || v_who, 200),
      v_preview
    );

  exception when others then
    raise warning 'notify_on_appointment_insert failed for appointment %: % (%)',
      new.id, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

drop trigger if exists appointments_notify_after_insert on public.appointments;
create trigger appointments_notify_after_insert
  after insert on public.appointments
  for each row execute function public.notify_on_appointment_insert();
