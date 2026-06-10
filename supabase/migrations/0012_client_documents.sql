-- Phase 1 of the admin Client Documents feature. One row per generated
-- legal/welcome document. The actual DOCX rendering is deterministic
-- find-and-replace on a checked-in template file (see
-- src/lib/documents/templates/) - this table only stores the form
-- inputs so the admin can re-edit and re-export later.
--
-- Why the design is shaped this way:
--
--   - field_values is jsonb, not a wide column list. The Welcome Pack
--     and Client Agreement have different fields (12 vs ~15) and the
--     Agreement also has Schedule A/B sub-tables (program tier, monthly
--     amount, billing date, ad spend, etc.). Splitting that into columns
--     would mean churning the schema every time a template gains or
--     drops a placeholder. jsonb lets us evolve the field set per
--     doc_type from the application without a migration.
--
--   - doc_type is a CHECK-constrained text rather than a Postgres enum.
--     Enums are awkward to extend (alter type ... add value can't run
--     inside a transaction with other DDL on the same type, and the
--     team's tolerance for enum migrations is mixed). The two values
--     are a closed set today and a CHECK keeps it that way without
--     locking us out of a future "add a third template" migration.
--
--   - client_name is denormalised onto the row purely for the admin
--     list view. It mirrors field_values->>'CLIENT_NAME' /
--     field_values->>'Client Full Legal Name' so the list query stays
--     a single table-scan instead of a jsonb pluck on every row.
--
--   - No policies. RLS enabled + zero policies = anon and authenticated
--     denied, service-role bypasses. Same pattern as notifications
--     (0009) and the Phase 1 CRM tables (0007). The admin server
--     actions all run through the service-role client. The form is
--     admin-only and never reachable by anon.
--
--   - Not in supabase_realtime publication. The list view re-fetches
--     on form submit / delete; there's no second-admin live-update
--     story for documents (unlike leads + notifications where a
--     parallel admin needs to see the new row land).

-- ===========================================================================
-- 1. Table + CHECK constraint
-- ===========================================================================

create table if not exists public.client_documents (
  id            uuid primary key default gen_random_uuid(),
  -- Closed set; expand via a new migration if a third template lands.
  doc_type      text not null check (
    doc_type in ('welcome_pack', 'client_agreement')
  ),
  -- Display label for the admin list view. Free text - the form
  -- copies field_values's client-name field into this column at
  -- save time.
  client_name   text not null,
  -- All form inputs, keyed by the placeholder name from the template.
  -- For welcome_pack: CLIENT_NAME, PROGRAM, DELIVERABLE_1, etc.
  -- For client_agreement: "Client Full Legal Name", "Client Address",
  -- and the Schedule A/B values.
  field_values  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ===========================================================================
-- 2. Touch trigger for updated_at
--
-- public.touch_updated_at() was created in 0004. Reuse it.
-- ===========================================================================

drop trigger if exists client_documents_touch_updated_at
  on public.client_documents;

create trigger client_documents_touch_updated_at
  before update on public.client_documents
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- 3. Indexes
-- ===========================================================================

-- Hot path: list view "show the most recently edited docs of a given
-- type." Composite ordered index keeps the list paginated cheaply
-- regardless of how many docs accumulate per type.
create index if not exists client_documents_type_updated_idx
  on public.client_documents (doc_type, updated_at desc);

-- ===========================================================================
-- 4. Row-level security - no policies
-- ===========================================================================

alter table public.client_documents enable row level security;

-- ===========================================================================
-- 5. Documentation
-- ===========================================================================

comment on table public.client_documents is
  'One row per generated Welcome Pack or Client Agreement DOCX. Stores form inputs only; the rendered DOCX is regenerated on demand from a template in src/lib/documents/templates/. Admin-only via service-role.';

comment on column public.client_documents.doc_type is
  'Closed set: welcome_pack | client_agreement. Drives template selection + placeholder delimiter style ({{TOKEN}} vs [Bracketed Phrase]) at render time.';

comment on column public.client_documents.field_values is
  'Form inputs keyed by the placeholder name from the template. Field shapes differ between doc_type values - validated at the application layer, not the DB.';

comment on column public.client_documents.client_name is
  'Denormalised display label for the admin list view. Mirrors the relevant client-name field inside field_values; written by the application at save time.';
