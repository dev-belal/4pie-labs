-- Phase 1 of the admin CRM expansion: pipelines, stages, opportunities, and a
-- local mirror of Cal.com appointments. Pure schema migration — no UI or
-- server-action code is wired up in this phase.
--
-- AUTH MODEL (read before editing the RLS section below):
-- The app's admin layer is HMAC-cookie auth (src/lib/admin-session.ts) and
-- every admin read/write goes through the service-role Supabase client
-- (src/lib/supabase/service.ts), which BYPASSES row-level security.
--
-- Migration 0006 ("drop_dead_is_admin_rls") removed public.is_admin() and the
-- authenticated-role admin policies on leads/conversations/messages/blogs/
-- testimonials precisely because they were misleading dead code — RLS never
-- protected admin data; the service-role client did. The proven, currently-
-- shipping pattern for admin-only tables is therefore:
--
--   alter table … enable row level security;
--   -- (no policies for authenticated/anon)
--
-- Postgres RLS-with-no-policy denies all operations for anon + authenticated;
-- the service-role role (which the admin actions use) is unaffected because
-- it has BYPASSRLS. We follow that same pattern for all four new tables —
-- none of them are written to from public-site code, so no anon INSERT
-- policy is needed either.
--
-- touch_updated_at() was defined in migration 0004 and was NOT dropped by
-- 0006, so it still exists in the live database and is reused directly by
-- the triggers below.

-- =============================================================================
-- 1. PIPELINES + STAGES
-- =============================================================================

create table if not exists public.pipelines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sort_order  int  not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pipelines_sort_idx
  on public.pipelines (sort_order, created_at);

drop trigger if exists pipelines_touch_updated_at on public.pipelines;
create trigger pipelines_touch_updated_at
  before update on public.pipelines
  for each row execute function public.touch_updated_at();


-- Stage kind drives status math: open stages count as in-flight, won/lost
-- are terminal. The UI lets admin mark which kind a stage is when editing
-- the pipeline. Default is 'open' — admin must explicitly mark Won/Lost.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'stage_kind') then
    create type public.stage_kind as enum ('open', 'won', 'lost');
  end if;
end $$;

create table if not exists public.pipeline_stages (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name        text not null,
  kind        public.stage_kind not null default 'open',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pipeline_stages_pipeline_idx
  on public.pipeline_stages (pipeline_id, sort_order);

drop trigger if exists pipeline_stages_touch_updated_at on public.pipeline_stages;
create trigger pipeline_stages_touch_updated_at
  before update on public.pipeline_stages
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 2. OPPORTUNITIES
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'opportunity_status') then
    create type public.opportunity_status as enum ('open', 'won', 'lost');
  end if;
end $$;

create table if not exists public.opportunities (
  id               uuid primary key default gen_random_uuid(),
  pipeline_id      uuid not null references public.pipelines(id) on delete restrict,
  stage_id         uuid not null references public.pipeline_stages(id) on delete restrict,

  -- Back-link to the originating lead. The contact/business/source columns
  -- below are an authoritative snapshot so renaming or deleting the lead
  -- does not corrupt the pipeline view.
  lead_id          uuid references public.leads(id) on delete set null,

  contact_name     text,
  business_name    text,
  -- Mirrors the design's badge ('Audit' | 'Budget' | 'Contact' | 'Chat').
  -- Derived from the source lead at promotion time; free-text so the UI
  -- can evolve labels without a schema change.
  source           text,

  value_cents      bigint not null default 0,
  status           public.opportunity_status not null default 'open',
  notes            text,

  sort_order       int not null default 0,           -- order within stage column

  expected_close_at timestamptz,
  won_at            timestamptz,
  lost_at           timestamptz,
  lost_reason       text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists opportunities_pipeline_stage_idx
  on public.opportunities (pipeline_id, stage_id, sort_order);
create index if not exists opportunities_lead_idx
  on public.opportunities (lead_id);
create index if not exists opportunities_status_idx
  on public.opportunities (status, updated_at desc);

drop trigger if exists opportunities_touch_updated_at on public.opportunities;
create trigger opportunities_touch_updated_at
  before update on public.opportunities
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 3. APPOINTMENTS (Cal.com mirror)
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('confirmed', 'cancelled', 'rescheduled');
  end if;
end $$;

create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),

  -- Cal.com identifiers. Unique partial indexes (below) prevent duplicate
  -- syncs while permitting NULL on either column (Cal v2 returns both, but
  -- defending against either being unavailable).
  cal_booking_id   bigint,
  cal_uid          text,

  title            text,
  attendee_name    text,
  attendee_email   text,
  attendee_tz      text,
  channel          text,             -- 'Google Meet' | 'Zoom' | 'Phone' etc.

  starts_at        timestamptz not null,
  ends_at          timestamptz not null,

  -- Admin-editable categorisation, drives the calendar color (Discovery /
  -- Strategy / Onboarding / At risk). Free-text so it can evolve.
  category         text,

  -- Admin-editable prep notes, never sent to Cal.com.
  notes            text,

  status           public.appointment_status not null default 'confirmed',

  -- Optional back-links. set-null on delete so an appointment survives the
  -- removal of the lead or opportunity it referenced.
  lead_id          uuid references public.leads(id) on delete set null,
  opportunity_id   uuid references public.opportunities(id) on delete set null,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists appointments_cal_booking_id_unique
  on public.appointments (cal_booking_id) where cal_booking_id is not null;
create unique index if not exists appointments_cal_uid_unique
  on public.appointments (cal_uid) where cal_uid is not null;

create index if not exists appointments_starts_at_idx
  on public.appointments (starts_at);
create index if not exists appointments_lead_idx
  on public.appointments (lead_id);
create index if not exists appointments_opportunity_idx
  on public.appointments (opportunity_id);

drop trigger if exists appointments_touch_updated_at on public.appointments;
create trigger appointments_touch_updated_at
  before update on public.appointments
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 4. ROW-LEVEL SECURITY
--
-- All four tables are admin-only: no public-site code reads or writes them.
-- Following the post-0006 pattern, we enable RLS and create NO policies for
-- anon/authenticated. Postgres denies all operations for both roles, while
-- the service-role client (used by every admin server action) bypasses RLS
-- and continues to work unchanged.
-- =============================================================================

alter table public.pipelines        enable row level security;
alter table public.pipeline_stages  enable row level security;
alter table public.opportunities    enable row level security;
alter table public.appointments     enable row level security;


-- =============================================================================
-- 5. REALTIME
--
-- Add the new tables to supabase_realtime so future admin code can subscribe
-- to live updates (mirrors the 0004 pattern for leads/conversations/messages).
-- Wrapped in DO blocks so re-running the migration is a no-op once a table is
-- already in the publication.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pipelines'
  ) then
    alter publication supabase_realtime add table public.pipelines;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pipeline_stages'
  ) then
    alter publication supabase_realtime add table public.pipeline_stages;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'opportunities'
  ) then
    alter publication supabase_realtime add table public.opportunities;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end $$;


-- =============================================================================
-- 6. SEED — one canonical pipeline matching the design's "New Business".
--
-- Idempotent: only seeds if a pipeline named "New Business" does not yet exist.
-- Running this migration a second time will not duplicate the seed.
-- =============================================================================

do $$
declare
  v_pipeline_id uuid;
begin
  if not exists (select 1 from public.pipelines where name = 'New Business') then
    insert into public.pipelines (name, sort_order)
    values ('New Business', 0)
    returning id into v_pipeline_id;

    insert into public.pipeline_stages (pipeline_id, name, kind, sort_order) values
      (v_pipeline_id, 'New Lead',    'open', 0),
      (v_pipeline_id, 'Contacted',   'open', 1),
      (v_pipeline_id, 'Audit Sent',  'open', 2),
      (v_pipeline_id, 'Call Booked', 'open', 3),
      (v_pipeline_id, 'Proposal',    'open', 4),
      (v_pipeline_id, 'Won',         'won',  5),
      (v_pipeline_id, 'Lost',        'lost', 6);
  end if;
end $$;
