-- Phase 1 verification — run this in the Supabase SQL editor AFTER applying
-- migration 0007. It is read-only except for a self-contained on-delete test
-- block at the end that creates and removes its own test rows.
--
-- Every block prints a short pass/fail summary you can scan.

-- =============================================================================
-- 1. All four tables exist with row-level security enabled.
-- =============================================================================
select
  c.relname                                                   as table_name,
  case when c.relrowsecurity then 'ON' else 'OFF' end         as rls,
  (
    select count(*)
    from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname
  )                                                            as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('pipelines','pipeline_stages','opportunities','appointments')
order by c.relname;
-- EXPECT: 4 rows; rls=ON for all; policy_count=0 for all
--         (RLS-enabled + zero policies = denied to anon/authenticated;
--          service-role bypasses RLS as designed).

-- =============================================================================
-- 2. The three new enum types exist.
-- =============================================================================
select typname
from pg_type
where typname in ('stage_kind','opportunity_status','appointment_status')
order by typname;
-- EXPECT: 3 rows.

-- =============================================================================
-- 3. The seed pipeline + 7 stages are present, with the correct kinds + order.
-- =============================================================================
select p.name as pipeline, s.sort_order, s.name as stage, s.kind
from public.pipelines p
join public.pipeline_stages s on s.pipeline_id = p.id
where p.name = 'New Business'
order by s.sort_order;
-- EXPECT: 7 rows in order: New Lead, Contacted, Audit Sent, Call Booked,
--         Proposal, Won, Lost — with Won=won, Lost=lost, rest=open.

-- =============================================================================
-- 4. Realtime publication includes the four new tables.
-- =============================================================================
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('pipelines','pipeline_stages','opportunities','appointments')
order by tablename;
-- EXPECT: 4 rows.

-- =============================================================================
-- 5. Triggers exist on all four tables.
-- =============================================================================
select event_object_table as table_name, trigger_name
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('pipelines','pipeline_stages','opportunities','appointments')
order by table_name, trigger_name;
-- EXPECT: 4 rows, one *_touch_updated_at per table.

-- =============================================================================
-- 6. Self-contained on-delete test:
--    insert a test lead, attach an opportunity, delete the lead, confirm the
--    opportunity persists with lead_id = NULL.
--
--    Then deleting the test opportunity exercises the on-delete-restrict on
--    pipeline/stage by trying to delete the pipeline while a (different) row
--    references it — expected: ERROR. Clean up at the end.
-- =============================================================================
do $$
declare
  v_pipeline_id uuid;
  v_stage_id    uuid;
  v_lead_id     uuid;
  v_opp_id      uuid;
  v_lead_after  uuid;
  v_restrict_blocked boolean := false;
begin
  select id into v_pipeline_id from public.pipelines where name = 'New Business' limit 1;
  if v_pipeline_id is null then
    raise notice 'FAIL: seed pipeline "New Business" not found — apply migration first';
    return;
  end if;
  select id into v_stage_id from public.pipeline_stages
    where pipeline_id = v_pipeline_id and name = 'New Lead' limit 1;

  -- Insert a throwaway lead so the FK works. The 'contact' type matches the
  -- existing leads enum (see migration 0004).
  insert into public.leads (type, status, name, email, source, payload, notes)
  values ('contact', 'new', 'Phase1 Verify Lead', 'phase1-verify@example.test',
          'phase1-verify', '{"marker":"phase1-verify"}'::jsonb,
          'Created and removed by 0007_verify.sql')
  returning id into v_lead_id;

  insert into public.opportunities
    (pipeline_id, stage_id, lead_id, contact_name, business_name, source, value_cents, status)
  values
    (v_pipeline_id, v_stage_id, v_lead_id,
     'Phase1 Verify', 'Phase1 Verify Co.', 'Contact', 100000, 'open')
  returning id into v_opp_id;

  -- Delete the source lead; opportunity must survive with lead_id = null.
  delete from public.leads where id = v_lead_id;

  select lead_id into v_lead_after from public.opportunities where id = v_opp_id;
  if v_lead_after is null then
    raise notice 'PASS: on delete set null — opportunity persists, lead_id is NULL';
  else
    raise notice 'FAIL: opportunity lead_id should be NULL but is %', v_lead_after;
  end if;

  -- Try deleting the seed pipeline while the test opportunity references it.
  -- The on delete restrict FK should reject it.
  begin
    delete from public.pipelines where id = v_pipeline_id;
    raise notice 'FAIL: pipeline delete should have been restricted (live opportunity references it)';
  exception when foreign_key_violation then
    v_restrict_blocked := true;
    raise notice 'PASS: on delete restrict — cannot drop pipeline with live opportunities';
  end;

  -- Cleanup.
  delete from public.opportunities where id = v_opp_id;
  -- Make sure no orphan lead marker survived an aborted run.
  delete from public.leads where email = 'phase1-verify@example.test';

  if v_restrict_blocked then
    raise notice 'VERIFY: on-delete behavior OK';
  end if;
end $$;
-- EXPECT in NOTICES:
--   PASS: on delete set null — opportunity persists, lead_id is NULL
--   PASS: on delete restrict — cannot drop pipeline with live opportunities
--   VERIFY: on-delete behavior OK

-- =============================================================================
-- 7. RLS denial smoke test (manual)
-- =============================================================================
-- Run these EACH AS A SEPARATE QUERY in the SQL editor after switching the
-- editor's "Role" dropdown to 'anon':
--
--   select count(*) from public.pipelines;          -- EXPECT: permission denied / 0
--   select count(*) from public.opportunities;      -- EXPECT: permission denied / 0
--   insert into public.pipelines (name) values ('hax'); -- EXPECT: permission denied
--
-- Then switch the role back to 'postgres' (or 'service_role') and confirm:
--
--   select count(*) from public.pipelines;          -- EXPECT: >= 1 (seed row)
