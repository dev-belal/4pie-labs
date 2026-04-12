-- 4Pie Labs — initial Supabase schema
--
-- Paste this whole file into Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run once on a fresh project. Uses IF NOT EXISTS / CREATE OR REPLACE
-- so re-running is a no-op after the first successful run.

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- Blog posts ------------------------------------------------------------------
create table if not exists public.blogs (
  id          text primary key,
  slug        text unique not null,
  title       text not null,
  category    text not null check (category in ('GUIDE','STRATEGY','INSIGHTS','NEWS')),
  author      text not null,
  date        text not null,                          -- e.g. "Feb 24, 2026"
  read_time   text not null default '5 min read',
  image       text not null,
  excerpt     text not null,
  content     text not null,
  views       integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists blogs_created_at_idx on public.blogs (created_at desc);
create index if not exists blogs_views_idx      on public.blogs (views desc);

-- Testimonials ----------------------------------------------------------------
create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  role          text not null,
  headline      text not null,
  quote         text not null,
  rating        smallint not null default 5 check (rating between 1 and 5),
  avatar        text,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists testimonials_published_idx
  on public.testimonials (is_published, created_at desc);

-- Metrics / event log ---------------------------------------------------------
create table if not exists public.metrics (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  page_path   text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists metrics_created_at_idx on public.metrics (created_at desc);
create index if not exists metrics_event_type_idx on public.metrics (event_type);


-- =============================================================================
-- 2. ATOMIC VIEW COUNT RPC
--    Called by the server action in src/lib/blog.ts.
-- =============================================================================

create or replace function public.increment_blog_views(p_slug text)
returns void
language sql
security invoker
as $$
  update public.blogs set views = views + 1 where slug = p_slug;
$$;


-- =============================================================================
-- 3. ROW-LEVEL SECURITY
--    Enable on every table and write explicit policies.
-- =============================================================================

alter table public.blogs        enable row level security;
alter table public.testimonials enable row level security;
alter table public.metrics      enable row level security;

-- Blogs -----------------------------------------------------------------------
-- Public can read every post; only authenticated users can write.
drop policy if exists "blogs_public_read"     on public.blogs;
drop policy if exists "blogs_auth_insert"     on public.blogs;
drop policy if exists "blogs_auth_update"     on public.blogs;
drop policy if exists "blogs_auth_delete"     on public.blogs;

create policy "blogs_public_read"
  on public.blogs for select
  to anon, authenticated
  using (true);

create policy "blogs_auth_insert"
  on public.blogs for insert
  to authenticated
  with check (true);

create policy "blogs_auth_update"
  on public.blogs for update
  to authenticated
  using (true) with check (true);

create policy "blogs_auth_delete"
  on public.blogs for delete
  to authenticated
  using (true);

-- Testimonials ----------------------------------------------------------------
-- Public can read only published testimonials.
drop policy if exists "testimonials_public_read_published" on public.testimonials;
drop policy if exists "testimonials_auth_all_read"         on public.testimonials;
drop policy if exists "testimonials_auth_insert"           on public.testimonials;
drop policy if exists "testimonials_auth_update"           on public.testimonials;
drop policy if exists "testimonials_auth_delete"           on public.testimonials;

create policy "testimonials_public_read_published"
  on public.testimonials for select
  to anon
  using (is_published = true);

create policy "testimonials_auth_all_read"
  on public.testimonials for select
  to authenticated
  using (true);

create policy "testimonials_auth_insert"
  on public.testimonials for insert
  to authenticated
  with check (true);

create policy "testimonials_auth_update"
  on public.testimonials for update
  to authenticated
  using (true) with check (true);

create policy "testimonials_auth_delete"
  on public.testimonials for delete
  to authenticated
  using (true);

-- Metrics ---------------------------------------------------------------------
-- Anyone (anon included) can INSERT events (view tracking, form events, …).
-- Only authenticated users can read — protects PII / URL trails.
drop policy if exists "metrics_public_insert" on public.metrics;
drop policy if exists "metrics_auth_read"     on public.metrics;

create policy "metrics_public_insert"
  on public.metrics for insert
  to anon, authenticated
  with check (true);

create policy "metrics_auth_read"
  on public.metrics for select
  to authenticated
  using (true);


-- =============================================================================
-- 4. REALTIME
--    The admin dashboard subscribes to postgres_changes on these tables.
-- =============================================================================

-- Drop first in case the tables were added to the publication before
-- (re-adding an already-present table throws).
alter publication supabase_realtime drop table if exists public.blogs;
alter publication supabase_realtime drop table if exists public.testimonials;
alter publication supabase_realtime drop table if exists public.metrics;

alter publication supabase_realtime add table public.blogs;
alter publication supabase_realtime add table public.testimonials;
alter publication supabase_realtime add table public.metrics;


-- =============================================================================
-- 5. SEED DATA — the three static blog posts so the site isn't empty on launch.
-- =============================================================================

insert into public.blogs (id, slug, title, category, author, date, read_time, image, excerpt, content, views)
values
  (
    'roi-ai-automation',
    'roi-ai-automation',
    'How to calculate ROI for AI automation projects.',
    'GUIDE',
    'Syed Belal',
    'Feb 24, 2026',
    '8 min read',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
    'Learn the exact framework for measuring the financial impact of AI integration in your agency operations.',
    E'\n# How to calculate ROI for AI automation projects\n\nIntegrating AI into your business isn''t just about being "modern"—it''s about the bottom line. But how do you measure the success of an automation project?\n\n## The Core Framework\n\nTo calculate ROI, you need to look at three main pillars:\n\n### 1. Direct Time Savings\nThis is the most obvious metric. Calculate the hours spent on manual tasks before and after automation.\n**Formula:** (Manual Hours - Automated Hours) x Hourly Labor Rate.\n\n### 2. Error Reduction Costs\nHuman error is expensive. AI systems operate with consistent precision once programmed correctly. Estimate the cost of re-work or lost opportunities due to human errors.\n\n### 3. Scalability Gains\nAutomation allows you to handle 10x the volume without 10x the staff. This "capacity expansion" is often where the true ROI lies for growing agencies.\n\n## Beyond the Numbers\n\nWhile the math is important, don''t ignore the "Soft ROI":\n- Improved employee morale (less grunt work)\n- Faster client delivery times\n- Enhanced data accuracy for strategic decisions\n\nBy following this framework, you can present a clear, data-backed case for AI investment to any stakeholder.\n    ',
    0
  ),
  (
    '5-processes-automate',
    '5-processes-automate',
    '5 processes you can automate today without set-up.',
    'STRATEGY',
    '4Pie Architect',
    'Feb 20, 2026',
    '5 min read',
    'https://images.unsplash.com/photo-1675557009875-436f09709f5e?q=80&w=800&auto=format&fit=crop',
    'Discover the low-hanging fruit in your workflow that can be handled by simple AI agents immediately.',
    E'\n# 5 processes you can automate today without set-up\n\nMany agencies believe they need a 6-month digital transformation to see results. The truth? You can start today.\n\n## 1. Meeting Summarization\nStop taking notes. Use AI to transcribe and extract action items from your Zoom calls instantly.\n\n## 2. Email Triage\nLet a simple LLM-based agent categorize your inbox and draft preliminary responses based on your historical data.\n\n## 3. Social Media Ideation\nInput your core pillars and let AI generate a month''s worth of content hooks and outlines in seconds.\n\n## 4. Lead Scraping\nAutomate the discovery of new prospects using AI tools that find contact info based on LinkedIn profiles.\n\n## 5. Report Documentation\nTransform raw data into client-ready narratives using structured prompts.\n\nStart with one, master it, and move to the next. High-impact automation is about momentum.\n    ',
    0
  ),
  (
    'ai-automation-fails',
    'ai-automation-fails',
    'When AI automation fails: 3 common mistakes.',
    'INSIGHTS',
    'Senior AI Strategist',
    'Feb 15, 2026',
    '6 min read',
    'https://images.unsplash.com/photo-1684128080072-520e5b721e7d?q=80&w=800&auto=format&fit=crop',
    'Avoid the pitfalls that drain budgets and frustrate teams during AI implementation.',
    E'\n# When AI automation fails: 3 common mistakes\n\nAI is powerful, but it''s not magic. Here are the three most common reasons automation projects fail to deliver.\n\n## 1. Automating a Broken Process\nIf your manual workflow is messy, automating it just makes it messy *faster*. Fix the logic before you apply the code.\n\n## 2. Lack of Human-in-the-loop (HITL)\nExpecting AI to handle 100% of the nuance in human communication or creative work is a recipe for disaster. Design systems where AI does the heavy lifting but humans provide the final check.\n\n## 3. Poor Data Quality\nAI is only as good as the data it feeds on. If your CRM is a mess, your "AI Insights" will be a mess too.\n\nAvoid these, and you''re already ahead of 90% of the competition.\n    ',
    0
  )
on conflict (id) do nothing;


-- =============================================================================
-- DONE.
-- Create your admin user now: Supabase Dashboard → Authentication → Users
--   → "Add user" → email + password (toggle "Auto confirm user" on).
-- Then sign in at /admin/login.
-- =============================================================================
