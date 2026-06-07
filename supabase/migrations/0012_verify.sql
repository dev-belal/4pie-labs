-- Verify migration 0012_client_documents.sql.
--
-- Dashboard-compatible (no \gset, no psql meta-commands). Tests that
-- write data use BEGIN ... ROLLBACK so they leave the production table
-- empty.
--
-- 5 blocks:
--   1. Table + CHECK constraint shape
--   2. Trigger wired to public.touch_updated_at (re-used from 0004)
--   3. Index exists with the right key
--   4. RLS enabled and zero policies (admin-only via service-role)
--   5. End-to-end smoke: insert a sample row with jsonb, read it back,
--      assert anon denied. ROLLBACK at the end keeps the table empty.

-- ===========================================================================
-- 1. Table + CHECK
-- ===========================================================================

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'client_documents'
order by ordinal_position;
-- EXPECT 6 rows in order:
--   id           | uuid                        | NO
--   doc_type     | text                        | NO
--   client_name  | text                        | NO
--   field_values | jsonb                       | NO
--   created_at   | timestamp with time zone    | NO
--   updated_at   | timestamp with time zone    | NO

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.client_documents'::regclass
  and contype  = 'c';
-- EXPECT 1 row -
--   conname    = something like 'client_documents_doc_type_check'
--   definition = "CHECK ((doc_type = ANY (ARRAY['welcome_pack'::text, 'client_agreement'::text])))"

-- ===========================================================================
-- 2. Trigger
-- ===========================================================================

select tgname,
       pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'public.client_documents'::regclass
  and not tgisinternal;
-- EXPECT 1 row -
--   tgname     = 'client_documents_touch_updated_at'
--   definition contains 'BEFORE UPDATE' and 'EXECUTE FUNCTION public.touch_updated_at()'

-- ===========================================================================
-- 3. Index
-- ===========================================================================

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename  = 'client_documents'
order by indexname;
-- EXPECT 2 rows -
--   client_documents_pkey
--   client_documents_type_updated_idx with definition:
--     CREATE INDEX client_documents_type_updated_idx
--     ON public.client_documents USING btree (doc_type, updated_at DESC)

-- ===========================================================================
-- 4. RLS enabled, zero policies
-- ===========================================================================

select relname, relrowsecurity, relforcerowsecurity
from pg_class
where oid = 'public.client_documents'::regclass;
-- EXPECT 1 row -
--   relname              = 'client_documents'
--   relrowsecurity       = true  (RLS turned on)
--   relforcerowsecurity  = false (default; service-role still bypasses)

select polname, polcmd
from pg_policy
where polrelid = 'public.client_documents'::regclass;
-- EXPECT 0 rows. Same posture as notifications (0009): RLS on + no
-- policies = anon/authenticated denied, service-role bypasses.

-- ===========================================================================
-- 5. End-to-end smoke
--
-- Insert + read + anon-deny verification, all inside a transaction
-- that ROLLBACK undoes. Nothing persists.
-- ===========================================================================

begin;
  -- 5a. Insert a welcome_pack with a realistic field_values payload.
  insert into public.client_documents (doc_type, client_name, field_values)
  values (
    'welcome_pack',
    'Verify Pack Client',
    jsonb_build_object(
      'CLIENT_NAME',          'Verify Pack Client',
      'CLIENT_BUSINESS_NAME', 'Verify LLC',
      'PROGRAM',              'Pipeline',
      'START_DATE',           '2026-06-15',
      'SERVICE_AREA',         'Portland, OR',
      'MAIN_CONTACT',         'verify@example.com',
      'DELIVERABLE_1',        'Local SEO foundation',
      'DELIVERABLE_2',        'GBP optimization',
      'DELIVERABLE_3',        'AEO content engine',
      'DELIVERABLE_4',        'Call tracking',
      'DELIVERABLE_5',        'Monthly reporting',
      'PORTAL_LINK',          'https://www.fourpielabs.com/admin'
    )
  );

  -- 5b. Insert a client_agreement with the bracketed-placeholder keys.
  -- jsonb keys can contain spaces and special chars; this matches the
  -- way the application will write them.
  insert into public.client_documents (doc_type, client_name, field_values)
  values (
    'client_agreement',
    'Verify Agreement Client',
    jsonb_build_object(
      'Client Full Legal Name',                       'Verify Agreement Client Inc.',
      'Client Business Name',                         'Verify Agreement Client',
      'Client Address',                               '123 Verify St, Portland OR',
      'Client Name',                                  'Verify Agreement Client',
      'Authorised Signatory',                         'Jane Verify',
      'GOVERNING STATE / COUNTRY',                    'Oregon, USA',
      'Core / Pipeline / Operating System / Pulse',   'Pipeline',
      '$ amount per month',                           '$5,000',
      'DD Month YYYY',                                '15 June 2026',
      'City / region...',                             'Portland metro'
    )
  );

  -- 5c. Read back and confirm jsonb plucking works.
  select doc_type,
         client_name,
         field_values->>'CLIENT_NAME'                       as welcome_client_name,
         field_values->>'Client Full Legal Name'            as agreement_legal_name
  from public.client_documents
  order by created_at;
  -- EXPECT 2 rows -
  --   welcome_pack     | Verify Pack Client       | Verify Pack Client | NULL
  --   client_agreement | Verify Agreement Client  | NULL               | Verify Agreement Client Inc.

  -- 5d. The CHECK should refuse an unknown doc_type. Wrap in DO/EXCEPTION
  -- so the rejection becomes a NOTICE instead of aborting the txn.
  do $$
  begin
    begin
      insert into public.client_documents (doc_type, client_name, field_values)
      values ('proposal', 'Bad Type', '{}'::jsonb);
      raise notice 'CHECK FAILED: doc_type=proposal was ACCEPTED (constraint is wrong)';
    exception when others then
      raise notice 'CHECK OK: doc_type=proposal blocked (%)', sqlerrm;
    end;
  end $$;
  -- EXPECT in notices: "CHECK OK: ... new row for relation ... violates
  -- check constraint ..."

  -- 5e. anon should be denied SELECT (RLS + zero policies).
  do $$
  declare
    v_count integer;
  begin
    set local role anon;
    begin
      select count(*) into v_count from public.client_documents;
      raise notice 'RLS check: anon SELECT returned % rows (expect 0 - blocked by RLS)', v_count;
    exception when others then
      raise notice 'RLS check: anon SELECT errored with % (also acceptable - means RLS denied)', sqlerrm;
    end;
    reset role;
  end $$;
  -- EXPECT in notices either:
  --   "RLS check: anon SELECT returned 0 rows ..."   (silent deny via RLS)
  -- or:
  --   "RLS check: anon SELECT errored with permission denied ..."

  -- 5f. anon INSERT should also be denied.
  do $$
  begin
    set local role anon;
    begin
      insert into public.client_documents (doc_type, client_name, field_values)
      values ('welcome_pack', 'Anon Attacker', '{}'::jsonb);
      raise notice 'RLS check FAILED: anon INSERT was ACCEPTED (RLS posture is wrong)';
    exception when others then
      raise notice 'RLS check OK: anon INSERT blocked (%)', sqlerrm;
    end;
    reset role;
  end $$;
  -- EXPECT in notices: "RLS check OK: anon INSERT blocked (new row
  -- violates row-level security policy ...)" or similar.

rollback;
-- Everything inside this BEGIN ... ROLLBACK is undone. Final table
-- state after running this verify script: empty, same as after the
-- migration itself.

-- ===========================================================================
-- Summary
-- ===========================================================================
-- All 5 blocks should report the EXPECT lines. Load-bearing checks:
--   * Block 4: zero policies. If a policy got added by mistake, anon
--     could read or write rows that contain client contract details.
--   * Block 5d: CHECK rejects 'proposal'. Stops typos from landing a
--     row that the application can't render.
--   * Block 5e + 5f: RLS denies anon. The whole feature assumes
--     admin-only access via service-role.
