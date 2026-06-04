-- Phase 1 of admin notifications. Creates the `notifications` table that
-- stores one row per surfaceable event (new lead / new chat session /
-- new appointment), with a SHARED read state (read_at column).
--
-- Triggers that actually create notification rows live in the
-- companion migration 0009_notification_triggers.sql. This file does
-- only the data-model work so the trigger definitions have a target.
--
-- Why the design is shaped this way:
--
--   - Single read_at, not per-user. The brief is a 2-user CRM and the
--     spec explicitly wants shared read state - simpler model, no
--     read_by join table, no per-row N writes when an admin clears
--     their inbox. When one admin marks something read, the bell
--     clears for everyone.
--
--   - source_id is plain uuid, NOT a foreign key. If we used FK +
--     ON DELETE CASCADE, deleting a lead would lose the audit trail
--     that "you got a notification at this time from this person."
--     ON DELETE SET NULL would leave orphans you can't click. Keeping
--     it loose lets the UI 404 gracefully on click ("That lead has
--     been deleted") while preserving the historical event.
--
--   - title + preview are SNAPSHOTS, populated by the trigger from the
--     NEW row at insert time. The notification stays meaningful even
--     if the source row is later renamed (e.g. the admin fixes a typo
--     in the lead's name) or deleted (see point above).
--
--   - kind is an enum, not free-text, so the bell UI can render type-
--     specific icons + dispatch click-to-tab navigation by switch.
--
--   - No policies. RLS enabled + zero policies = anon and authenticated
--     denied, service-role bypasses (BYPASSRLS attribute). Same pattern
--     the CRM tables in 0007 use. The admin server actions all run
--     through the service-role client, so writes/reads work. The
--     Realtime client (next phase) will subscribe via the anon channel;
--     whether the row payload comes through under this RLS posture
--     needs to be verified when that phase lands - if it doesn't, the
--     Realtime hook can send id-only and refetch through a SECURITY
--     DEFINER RPC.

-- ===========================================================================
-- 1. Enum
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_kind') then
    create type public.notification_kind as enum (
      'lead',
      'conversation',
      'appointment'
    );
  end if;
end $$;

-- ===========================================================================
-- 2. Table
-- ===========================================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  kind        public.notification_kind not null,
  -- Plain uuid pointing at leads.id / conversations.id / appointments.id.
  -- See header comment for why this is not a FK.
  source_id   uuid not null,
  -- Short headline shown in the bell list AND as the toast title.
  -- Built by the trigger from the source row at creation time.
  title       text not null,
  -- Optional ~140-char body. Pulled from the lead payload / chat
  -- user-agent / appointment time-and-channel by the trigger.
  preview     text,
  created_at  timestamptz not null default now(),
  -- NULL = unread. When any admin marks a notification read, this
  -- field gets stamped and the row stops contributing to the bell
  -- count and the badge totals for both admins.
  read_at     timestamptz
);

-- ===========================================================================
-- 3. Indexes
-- ===========================================================================

-- Hot path: the bell dropdown asks "give me the most recent unread
-- notifications." A partial index keyed on the unread subset keeps that
-- query cheap regardless of how many archived (read) rows accumulate.
create index if not exists notifications_unread_idx
  on public.notifications (created_at desc)
  where read_at is null;

-- Cold path: the dropdown "show all" view and the future audit/report
-- features want recent rows regardless of read state.
create index if not exists notifications_created_idx
  on public.notifications (created_at desc);

-- Lookup-by-source used by the bell click handler so the UI can flip
-- the read_at on every notification tied to the same source when an
-- admin opens it from another entry point.
create index if not exists notifications_source_idx
  on public.notifications (kind, source_id);

-- ===========================================================================
-- 4. Row-level security
--
-- Same posture as the Phase 1 CRM tables (0007): enable RLS and create
-- NO policies. Result is anon/authenticated are denied all operations;
-- the service-role client (used by admin server actions and the trigger
-- functions, which run SECURITY DEFINER) bypasses RLS.
-- ===========================================================================

alter table public.notifications enable row level security;

-- ===========================================================================
-- 5. Realtime
--
-- Add to the supabase_realtime publication so the future bell UI can
-- subscribe to live INSERT events without an extra round-trip. Guarded
-- by an EXISTS check so re-running the migration is a no-op.
-- ===========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ===========================================================================
-- 6. Documentation
-- ===========================================================================

comment on table public.notifications is
  'Surfaceable events for the admin bell. One row per new lead, chat session, or appointment. Created by AFTER INSERT triggers on the source tables (see 0009_notification_triggers.sql); never written from application code. Single shared read_at - any admin can mark something read for the whole team.';

comment on column public.notifications.source_id is
  'Plain uuid pointing at leads/conversations/appointments. NOT a foreign key so notification history survives source-row deletion.';

comment on column public.notifications.title is
  'Snapshot of the source row at creation time. Used as the bell-list headline AND the toast title. Stays accurate even if the source row is later renamed.';

comment on column public.notifications.read_at is
  'NULL = unread. Stamped by markRead / markAllRead server actions (Phase 2). Shared across both admin users.';
