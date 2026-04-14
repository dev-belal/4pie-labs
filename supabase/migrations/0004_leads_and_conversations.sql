-- Replaces the n8n integration: every form submission (contact / custom
-- request / ROI) and every chatbot message now lives in Supabase, surfaced
-- in the admin portal.
--
-- Three new tables:
--   * leads          — every form submission + chatbot-promoted leads
--   * conversations  — one row per chatbot session
--   * messages       — many per conversation (user + assistant turns)

-- =============================================================================
-- 1. LEADS
-- =============================================================================

create type public.lead_type    as enum ('contact', 'custom_request', 'roi', 'chat');
create type public.lead_status  as enum ('new', 'in_progress', 'won', 'lost');

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  type        public.lead_type   not null,
  status      public.lead_status not null default 'new',
  name        text,
  email       text,
  phone       text,
  source      text,                     -- "Contact Modal", "ROI Calculator", etc.
  payload     jsonb not null default '{}'::jsonb,  -- the rest of the form fields
  notes       text,                     -- admin-private follow-up notes
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status, created_at desc);
create index if not exists leads_type_idx       on public.leads (type, created_at desc);
create index if not exists leads_email_idx      on public.leads (email);

-- Auto-bump updated_at on UPDATE.
create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 2. CONVERSATIONS + MESSAGES
-- =============================================================================

create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  -- Stable per-visitor session id (cookie). Lets one visitor have a
  -- multi-turn conversation across page loads without being logged in.
  session_id      text not null,
  -- Optional metadata captured at session start.
  user_agent      text,
  -- If the chatbot detects lead intent and we promote the visitor, link
  -- the resulting leads row here so admin can drill from chat → lead.
  lead_id         uuid references public.leads(id) on delete set null,
  started_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create unique index if not exists conversations_session_id_idx
  on public.conversations (session_id);
create index if not exists conversations_last_message_idx
  on public.conversations (last_message_at desc);


create type public.message_role as enum ('user', 'assistant', 'system');

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            public.message_role not null,
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);


-- =============================================================================
-- 3. ROW-LEVEL SECURITY
-- =============================================================================

alter table public.leads          enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;

-- Leads ----------------------------------------------------------------------
-- Anyone (anon visitor) can INSERT a lead via the public form actions.
-- Only admins can read / update / delete.
drop policy if exists "leads_public_insert"  on public.leads;
drop policy if exists "leads_admin_select"   on public.leads;
drop policy if exists "leads_admin_update"   on public.leads;
drop policy if exists "leads_admin_delete"   on public.leads;

create policy "leads_public_insert"
  on public.leads for insert
  to anon, authenticated with check (true);

create policy "leads_admin_select"
  on public.leads for select
  to authenticated using (public.is_admin());

create policy "leads_admin_update"
  on public.leads for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "leads_admin_delete"
  on public.leads for delete
  to authenticated using (public.is_admin());

-- Conversations --------------------------------------------------------------
-- Visitors create + update their own conversation rows (writes are gated by
-- session_id ownership at the API layer, not RLS). Admin reads.
drop policy if exists "conversations_public_insert" on public.conversations;
drop policy if exists "conversations_public_update" on public.conversations;
drop policy if exists "conversations_admin_select"  on public.conversations;
drop policy if exists "conversations_admin_delete"  on public.conversations;

create policy "conversations_public_insert"
  on public.conversations for insert
  to anon, authenticated with check (true);

create policy "conversations_public_update"
  on public.conversations for update
  to anon, authenticated using (true) with check (true);

create policy "conversations_admin_select"
  on public.conversations for select
  to authenticated using (public.is_admin());

create policy "conversations_admin_delete"
  on public.conversations for delete
  to authenticated using (public.is_admin());

-- Messages -------------------------------------------------------------------
drop policy if exists "messages_public_insert" on public.messages;
drop policy if exists "messages_admin_select"  on public.messages;
drop policy if exists "messages_admin_delete"  on public.messages;

create policy "messages_public_insert"
  on public.messages for insert
  to anon, authenticated with check (true);

create policy "messages_admin_select"
  on public.messages for select
  to authenticated using (public.is_admin());

create policy "messages_admin_delete"
  on public.messages for delete
  to authenticated using (public.is_admin());


-- =============================================================================
-- 4. REALTIME — push admin dashboard updates as new leads / messages land.
-- =============================================================================

alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
