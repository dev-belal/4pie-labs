# Production Checklist

Run through this list before merging [PR #3](https://github.com/dev-belal/4pie-labs/pull/3) and again before announcing.

## Vercel project settings

- [ ] **Framework Preset**: Next.js (auto-detected from `next.config.ts`)
- [ ] **Root Directory**: `./`
- [ ] **Node.js version**: 20.9+ (v16 minimum)
- [ ] **Environment Variables** added for both **Preview** and **Production** environments:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `N8N_WEBHOOK_CHAT_URL`
  - [ ] `N8N_WEBHOOK_CONTACT_URL`
  - [ ] `N8N_WEBHOOK_ROI_URL`
  - [ ] `N8N_WEBHOOK_CUSTOM_REQUEST_URL`
  - [ ] `N8N_WEBHOOK_SECRET` (optional HMAC — if set, n8n must verify `X-Webhook-Signature`)
- [ ] Vercel Analytics and Speed Insights are still enabled on the project (carried over from the Vite deployment)

## Supabase

- [ ] At least one admin user exists (Authentication → Users) so `/admin` is reachable
- [ ] **RLS policies** are configured for every table used by the app:
  - `blogs` — public SELECT, admin-only INSERT/UPDATE/DELETE
  - `testimonials` — public SELECT where `is_published = true`, admin-only writes
  - `metrics` — admin SELECT, anonymous INSERT for view tracking
- [ ] Optional RPC `increment_blog_views(p_slug text)` exists for atomic view counts; otherwise the fallback read-then-write path is used
- [ ] Realtime is enabled on `blogs`, `testimonials`, `metrics` (Database → Replication)

## n8n

- [ ] All four webhook endpoints exist and respond 2xx with JSON:
  - `/webhook/chat`
  - `/webhook/request-submission` (contact)
  - `/webhook/roi`
  - `/webhook/custom-request`
- [ ] If `N8N_WEBHOOK_SECRET` is set in Vercel, each workflow verifies the `X-Webhook-Signature` header (SHA-256 HMAC of raw body)

## Post-merge smoke test

Once `main` is merged and deployed to production:

- [ ] Home `/` loads, all 8 sections render, no console errors
- [ ] Every navbar link resolves (`/`, `/about`, `/services`, `/#results`, `/blog`)
- [ ] Back button + deep links work
- [ ] `/blog/roi-ai-automation` renders with correct title, description, OG image
- [ ] `view-source:` on a blog post shows the `<script type="application/ld+json">` tags
- [ ] `/sitemap.xml` lists all routes including blog slugs
- [ ] `/robots.txt` disallows `/admin` and `/api`
- [ ] Contact modal → submits successfully → check n8n workflow execution log
- [ ] ROI calculator → email arrives
- [ ] Chat widget → message sends, bot reply returns
- [ ] Custom Request on `/services` → submits
- [ ] `/admin` unauthenticated redirects to `/admin/login`
- [ ] Admin login succeeds, dashboard loads, publishing a test blog post updates the list in real time without a page refresh

## Performance (Lighthouse, mobile)

Targets from the original audit:

| Metric | Target |
| --- | --- |
| Performance | ≥ 90 |
| LCP | < 2.5 s |
| CLS | < 0.1 |
| TBT | < 200 ms |
| Accessibility | ≥ 95 |
| SEO | 100 |

## Accessibility

- [x] Skip-to-content link on every public page
- [x] All three modals (Contact, Custom Request, Service Detail) have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- [x] Escape key closes modals; body scroll locked while open
- [x] All icon-only buttons have `aria-label`
- [x] All images have `alt` text
- [x] Nav mobile toggle announces `aria-expanded`
- [ ] Run axe DevTools on `/`, `/services`, `/blog`, `/blog/[slug]` and resolve any serious/critical issues
- [ ] Verify color contrast on secondary text (`text-white/40`, `text-white/30`) against `bg-background` — may need to bump to `text-white/60` for AA compliance on small text

## SEO

- [x] Canonical URLs on every page via `alternates.canonical`
- [x] Per-route `title` using `title.template`
- [x] Per-route `description`
- [x] Dynamic OG image for blog posts (1200×630 PNG)
- [x] JSON-LD: Organization, WebSite, FAQPage, BlogPosting, BreadcrumbList
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools
- [ ] Confirm the old `public/sitemap.xml` + `public/robots.txt` are not cached by any CDN in front of Vercel

## Monitoring (first 48h)

- [ ] Vercel Analytics dashboard shows events flowing from `/`
- [ ] Speed Insights reports Core Web Vitals
- [ ] Error tracking: check Vercel deployment logs for server-side exceptions (or add Sentry later)
- [ ] n8n execution logs show no spike in 4xx/5xx errors
- [ ] Supabase logs show `getUser()` calls succeeding on `/admin` visits

## Rollback

If anything serious breaks, revert the merge commit:

```bash
git revert -m 1 <merge-commit-sha>
git push origin main
```

Vercel will redeploy the previous Vite version automatically.
