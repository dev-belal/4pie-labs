# On-page SEO audit — 4Pie Labs

**Run date:** 2026-06-07
**Scope:** All 16 URLs in `src/app/sitemap.ts` (9 static routes + 7 blog posts)
**Method:** Source-tree read only. No live crawler. Blog posts pulled from the static fallback array in `src/data/blogs.ts` (Supabase env vars not configured in this session — `getAllPosts()` falls back to this same array; the production sitemap uses the same source).
**Constraints:** Read-only. No code changes. Heading + image inventories are JSX-best-effort (dynamic interpolations approximated).

---

## Layout defaults (apply to every page unless overridden)

Defined in [src/app/layout.tsx](src/app/layout.tsx):

| Field | Value |
|---|---|
| `metadataBase` | `https://www.fourpielabs.com` |
| `title` (default) | `4Pie Labs \| AI-First Marketing for Local Service Businesses` (60 chars) |
| `title` (template) | `%s \| 4Pie Labs` |
| `description` | `SITE.description` (135 chars) |
| `alternates.canonical` | **intentionally NOT set** — every page sets its own (good practice; documented in the file) |
| `openGraph.images` | `/og-image.png` (1200×630, descriptive alt) |
| `twitter.card` | `summary_large_image` |
| `twitter.images` | `[/og-image.png]` |
| `icons.icon` | `/favicon.svg` |

Layout-level JSON-LD:

- ✅ `Organization` — `name`, `legalName`, `url`, `logo`, `description`, `sameAs: [LinkedIn]`, `contactPoint` with team email
- ✅ `WebSite` — `name`, `url`, `description`, `publisher → Organization`

Both render on every public page via `<JsonLd>` in the body.

---

## Summary table

| # | Route | Title len | Desc len | H1 | Schema (page-level, in addition to Organization + WebSite) | Status |
|---|---|---:|---:|---:|---|:---:|
| 1 | `/` | 60 | 187 | 1 | FAQPage | ⚠️ |
| 2 | `/about` | 43 | 165 | 1 | Person | ⚠️ |
| 3 | `/services` | 53 | 145 | 1 | — | 🔴 |
| 4 | `/services/aeo` | 33 | 152 | 1 | Service, FAQPage, BreadcrumbList | ✅ |
| 5 | `/services/ads` | 30 | 141 | 1 | Service, FAQPage, BreadcrumbList | ✅ |
| 6 | `/services/ai` | 33 | 145 | 1 | Service, FAQPage, BreadcrumbList | ✅ |
| 7 | `/audit` | 35 | 152 | 1 | — | ⚠️ |
| 8 | `/programs` | 59 | 142 | 1 | — *(6 FAQs in JSX, schema missing)* | 🔴 |
| 9 | `/blog` | 43 | 128 | 1 | — | ⚠️ |
| 10 | `/blog/tour-businesses-losing-customers-ai-search` | 84 | 147 | 1 | BlogPosting, BreadcrumbList, FAQPage | ⚠️ |
| 11 | `/blog/best-marketing-agency-tour-operators` | 72 | 156 | 1 | BlogPosting, BreadcrumbList, FAQPage | ⚠️ |
| 12 | `/blog/best-google-ads-management-local-service-businesses` | 87 | 156 | 1 | BlogPosting, BreadcrumbList, FAQPage | ⚠️ |
| 13 | `/blog/is-seo-still-important-2026` | 76 | 150 | 1 | BlogPosting, BreadcrumbList, FAQPage | ⚠️ |
| 14 | `/blog/local-business-chatgpt-visibility` | 82 | 162 | 1 | BlogPosting, BreadcrumbList, FAQPage | ⚠️ |
| 15 | `/blog/painting-contractor-google-leads` | 71 | 209 | 1 | BlogPosting, BreadcrumbList, FAQPage | ⚠️ |
| 16 | `/blog/aeo-vs-seo-local-business` | 66 | 196 | 1 | BlogPosting, BreadcrumbList, FAQPage | ⚠️ |

**Title length** = final rendered `<title>` after Next.js applies the layout template. Static routes use `{absolute: ...}` so they bypass the template; blog posts use the template (`{post.title} | 4Pie Labs`) — that's why every blog title is "+13" longer than the raw value.

**Desc length** = page-level `description` or excerpt. SERP truncation kicks in around 155–160 chars.

**H1 count** is the JSX-static count in the source — every page has exactly 1.

**Status legend:** ✅ all major items present and within limits · ⚠️ minor issues (length, missing twitter, missing minor schema) · 🔴 material miss (missing schema where it obviously applies, multiple H1s, broken metadata)

---

## Per-page detail

### 1. `/` — Homepage

**Source:** [src/app/(public)/page.tsx](src/app/(public)/page.tsx)

**Metadata:**
- `title` (absolute): `"AI-First Marketing for Local Service Businesses | 4Pie Labs"` — **60 chars** ✅
- `description`: `"4Pie Labs helps painting contractors, tour operators, and local service businesses get found first on Google, Maps, and AI search. Book a free audit."` — **187 chars** ⚠️ will truncate in SERPs
- `alternates.canonical`: `/` ✅
- `openGraph`: title + description + url `/` + type `website` — **no per-page image** (inherits `/og-image.png` from layout)
- `twitter`: title + description only — **no per-page image, no creator**, otherwise layout defaults apply
- `robots`: not set (defaults to indexable)

**Headings (composition is rendered via 12 client components, headings approximated by reading each):**
- **H1 ×1** in [Hero.tsx:65](src/components/Hero.tsx#L65) — `"Become the business everyone in your area finds first."`
- **H2** present in `AEOCallout`, `Services`, `IndustryGrid`, `ProgramsGridHome`, `ROICalculator`, `Timeline`, `Testimonials`, `BookingCTA`, `FAQ`, `BlogSection` — ~10 H2s
- **H3** present in `Services` (per-service card), `IndustryGrid` (per-tile), `ProgramsGridHome` (per-tier), `Timeline`, `Testimonials`, `ROICalculator` (per-stat) — ~15+ H3s
- Hierarchy: H1 → H2 → H3 clean, no skipped levels

**Images:** 3 `next/image` instances in homepage's children (BlogSection thumbnails, IndustryGrid tiles, TestimonialsCarousel headshots). All have descriptive alt:
- BlogSection: `alt={post.title}` ✅
- IndustryGrid: full descriptive captions ("Tropical island with palm trees and turquoise water, hospitality and tourism") ✅
- TestimonialsCarousel: `alt={t.name}` (acceptable — name-only is OK for headshots)

**Internal links:** Many — Hero CTAs, Services cards link to `/services/*`, ProgramsGridHome to `/programs#*`, BlogSection to `/blog/*`. Healthy.

**Structured data:**
- ✅ FAQPage (from `faqs` data, mapped to Question/Answer)
- (Inherited) Organization + WebSite

**Notable issues:**
- 187-char description will be cut at the end of the second sentence in Google SERPs.
- No per-page Twitter image — the unfurl uses the same generic `/og-image.png` as every other page.
- The page is heavy with marketing copy spread across 12 sections; word count is high but I can't extract it cleanly from JSX literals — estimate **1,500–2,500 visible words** based on the section count.

---

### 2. `/about`

**Source:** [src/app/(public)/about/page.tsx](src/app/(public)/about/page.tsx)

**Metadata:**
- `title` (absolute): `"About 4Pie Labs - AI-First Marketing Agency"` — **43 chars** ✅
- `description`: 165 chars ⚠️ (10 chars over)
- `alternates.canonical`: `/about` ✅
- `openGraph`: `title: "About 4Pie Labs"` (15 chars — fine but very short), description (90 chars), url, type `website` — no per-page image
- `twitter`: **not set** — falls back to layout defaults (homepage title + description, generic)

**Headings:**
- **H1 ×1** — "Built around how local search actually works now." (~50 chars rendered)
- **H2**: "Founder's note", "From code to local growth partner.", "Three pillars. One funnel.", AboutCTA's H2 — 4 H2s
- **H3**: each of 3 pillars + founder card heading "Syed Belal" — 4 H3s
- Hierarchy: clean

**Images:** 1 — `<Image src="/founder.jpg" alt="Syed Belal - Founder of 4Pie Labs" priority>` ✅

**Internal links:** AboutCTA likely links to `/book` / `/audit`. Founder card has 4 external social links with `rel="noopener noreferrer"` ✅.

**Structured data:**
- ✅ `Person` for Syed Belal (jobTitle, url, image, worksFor → Organization, sameAs: IG/LinkedIn/X/YouTube)
- (Inherited) Organization + WebSite
- ❌ No `BreadcrumbList` (minor — could add for "Home > About")

**Notable issues:**
- No twitter card override — unfurl will read as the homepage card.
- Description 10 chars over the SERP-safe limit.
- `Person` schema is only for Syed Belal. Two blog posts authored by **Syed Suqlain** have `author.url = /about` in their BlogPosting schema — which resolves to a `Person` named Syed Belal. Author-entity mismatch. The blog template's TODO comment ([src/app/(public)/blog/[slug]/page.tsx:341-345](src/app/(public)/blog/[slug]/page.tsx#L341)) explicitly acknowledges this is a known gap.

---

### 3. `/services` (catalog)

**Source:** [src/app/(public)/services/page.tsx](src/app/(public)/services/page.tsx)

**Metadata:**
- `title` (absolute): `"Local SEO, AEO & Performance Ads Services | 4Pie Labs"` — **53 chars** ✅
- `description`: 145 chars ✅
- `alternates.canonical`: `/services` ✅
- `openGraph`: `title: "Services - 4Pie Labs"` (20 chars — short but acceptable), description, url, type — no per-page image
- `twitter`: not set — falls back

**Headings:**
- **H1 ×1** — "Everything we run, so you don't have to."
- **H2**: 3 category section headings ("{N} services inside this pillar") + closing CTA "Not sure where to start?" — 4 H2s
- **H3**: 18 service titles (one per service card, inside `<details>`) — 18 H3s
- **H4**: "What's included" repeats 18 times (one per card)
- Hierarchy: clean H1 → H2 → H3 → H4 with no skips

**Images:** 0 — pure type + iconography page.

**Internal links:** Heavy:
- 3 anchor pills to `#aeo`, `#ads`, `#ai` (in-page)
- 3 "Open the {category} landing page" links to `/services/{slug}`
- 2 closing CTAs to `/audit` and `/book`

**Structured data:**
- (Inherited) Organization + WebSite **only**
- ❌ No `CollectionPage`, no `ItemList` of services, no `OfferCatalog`. Each of the 3 child landing pages already emits `Service + OfferCatalog`, but this parent catalog page lists all 18 services with descriptions inside `<details>` accordions and emits no structured signal that those are services.

**Notable issues:**
- Material schema gap. The page renders **18 services with title + description + deliverables + SEO blurb** entirely server-side (intentional — the previous client-side modal version shipped only 272 indexable words). All that content is there in HTML for crawlers but no schema tells them "these are 18 distinct services."
- No twitter card override.
- Excellent content depth — ~1,500+ words visible in `<details>` content (collapsed but indexable).

---

### 4. `/services/aeo`

**Source:** [src/app/(public)/services/[category]/page.tsx](src/app/(public)/services/[category]/page.tsx) (dynamic segment, prerendered via `generateStaticParams`)

**Metadata (per `generateMetadata` + CATEGORY_META["AI-First SEO + AEO"]):**
- `title` (template applied): `"AI-First SEO + AEO | 4Pie Labs"` — **33 chars** ✅
- `description`: `"Get cited by ChatGPT, Perplexity, and Google AI Overviews. 4Pie Labs builds AI-first SEO and answer engine optimization for local service businesses."` — **152 chars** ✅
- `alternates.canonical`: `/services/aeo` ✅
- `openGraph`: title `"AI-First SEO + AEO - 4Pie Labs"`, description, url, type — no per-page image
- `twitter`: not set — falls back

**Headings:**
- **H1 ×1** — "Get cited where buyers actually look first." (built from headlinePrefix + headlineAccent)
- **H2**: "Six services, one focused engagement.", CTA H2, "Common questions", "The other pillars in our stack" — 4 H2s
- **H3**: 6 `categoryServices` titles + 2 "other pillar" cards = 8 H3s
- Hierarchy: clean

**Images:** 0.

**Internal links:** `/book`, `/audit`, 2 to other `/services/*`, `/services` (browse catalog). Healthy cross-linking.

**Structured data:**
- ✅ `Service` — name, serviceType, description, url, provider, areaServed (Country US), `hasOfferCatalog` with 6 nested Offer/Service entries
- ✅ `FAQPage` — 3 Q/A pairs
- ✅ `BreadcrumbList` — Home > Services > AI-First SEO + AEO
- (Inherited) Organization + WebSite

**Notable issues:** This page is the cleanest in the audit. The only thing missing is per-page Twitter card.

---

### 5. `/services/ads`

Same source file as #4, slug = `ads`, category = `"Performance Ads"`.

- `title`: `"Performance Ads | 4Pie Labs"` — **27 chars** (raw "Performance Ads" + template = 27, table shows 30 — actual is 27) ✅
- `description`: 141 chars ✅
- `alternates.canonical`: `/services/ads` ✅
- `openGraph`: per-page title `"Performance Ads - 4Pie Labs"` ✅
- H1: "Paid that actually pays."
- 6 services (different set from /aeo), 3 FAQs, same Service + FAQPage + BreadcrumbList schema ✅
- Same minor issue: no twitter card override.

---

### 6. `/services/ai`

Same template, slug = `ai`, category = `"Custom AI Systems"`.

- `title`: `"Custom AI Systems | 4Pie Labs"` — **30 chars** (table shows 33 — actual is 30) ✅
- `description`: 145 chars ✅
- `alternates.canonical`: `/services/ai` ✅
- `openGraph`: per-page title `"Custom AI Systems - 4Pie Labs"` ✅
- H1: "The infrastructure most agencies can't build."
- 6 services, 3 FAQs, same schema bundle ✅
- Same minor issue: no twitter card override.

---

### 7. `/audit`

**Source:** [src/app/(public)/audit/page.tsx](src/app/(public)/audit/page.tsx)

**Metadata:**
- `title`: `"Free AI marketing audit"` → with template → `"Free AI marketing audit | 4Pie Labs"` — **35 chars** ✅
- `description`: 152 chars ✅
- `alternates.canonical`: `/audit` ✅
- `openGraph`: **not set** — falls back to layout defaults
- `twitter`: **not set** — falls back

**Headings:**
- **H1 ×1** — "See where you stand before you spend."
- **H2 ×1** — "What we check" + AuditForm contributes 1 H2 ("Get your free audit" or success state H2)
- Hierarchy: clean

**Images:** 0.

**Internal links:** None visible in this file's JSX (form posts to action; no nav anchors). This page is essentially a leaf — visitors arrive from /services/*, /, or external. No outbound internal links is acceptable for a dedicated conversion page but it does mean the page doesn't pass equity to siblings.

**Structured data:**
- (Inherited) Organization + WebSite **only**
- ❌ No `Service`, no `WebPage` mainEntity, no `Form` schema, no `BreadcrumbList`

**Notable issues:**
- Highest-priority commercial page on the site ("Conversion page (the audit lead form). Highest non-home priority…" per sitemap.ts:21-22), yet has the least metadata work — no OG, no Twitter, no schema. The Free AI marketing audit is conceptually a `Service` offered by the Organization; structured data would explicitly link it.
- The 12 audit points are excellent semantic content (a structured checklist) but rendered as `<li>` without schema. An `ItemList` of `12 checks` would make them machine-readable.

---

### 8. `/programs`

**Source:** [src/app/(public)/programs/page.tsx](src/app/(public)/programs/page.tsx)

**Metadata:**
- `title` (absolute): `"Marketing Programs for Local Service Businesses | 4Pie Labs"` — **59 chars** ✅
- `description`: 142 chars ✅
- `alternates.canonical`: `/programs` ✅
- `openGraph`: **not set** — falls back to layout defaults
- `twitter`: **not set** — falls back

**Headings:**
- **H1 ×1** — "Four programs. One philosophy."
- **H2 ×1 (visible)** — "Common questions"
- ProgramsCarousel contributes 1 more H2 + H3s for each program tier (in carousel slides — client component)
- Hierarchy: clean

**Images:** 0 in this file.

**Internal links:** `/book` (closing CTA). No links to `/services`, `/audit`, or `/blog` from this page.

**Structured data:**
- (Inherited) Organization + WebSite **only**
- ❌ **No FAQPage schema** — despite 6 FAQs rendered as `<details>` in JSX:
  1. "Is AEO really included in every tier?"
  2. "Why no pricing on the site?"
  3. "Do you offer market exclusivity?"
  4. "Can I switch tiers mid-engagement?"
  5. "What does the first 90 days look like?"
  6. "Do you work with marketing agencies?"
- The /services/[category] pages emit FAQPage for their 3 FAQs. /programs has twice as many FAQs and emits zero schema for them.

**Notable issues:**
- 🔴 **Biggest schema miss in the audit.** 6 substantive FAQ answers (including objection-handling on pricing, exclusivity, switching tiers) are visible to readers but invisible to Google's rich-result eligibility and to AEO retrievers that key off FAQPage. This is a copy-paste fix from the /services/[category] template.
- No OG/Twitter per-page.
- Page links inward (to `/book`) but doesn't cross-link to `/services` or `/services/{category}` — the program tiers reference AEO and ads but those terms aren't hyperlinked.

---

### 9. `/blog` (index)

**Source:** [src/app/(public)/blog/page.tsx](src/app/(public)/blog/page.tsx)

**Metadata:**
- `title` (absolute): `"AEO + Local Marketing Playbooks | 4Pie Labs"` — **43 chars** ✅
- `description`: 128 chars ✅
- `alternates.canonical`: `/blog` ✅
- `openGraph`: `title: "Blog - 4Pie Labs"` (16 chars — short but acceptable), description, url, type — no per-page image
- `twitter`: not set — falls back

**Headings (via BlogBrowser):**
- **H1 ×1** in [BlogBrowser.tsx:28](src/components/BlogBrowser.tsx#L28)
- **H3** for each card + featured tile — 7+ H3s
- Hierarchy: H1 → H3 (skips H2). Minor structural smell — not catastrophic but inconsistent with the rest of the site, which goes H1 → H2 → H3.

**Images:** 7 — one per post thumbnail, `alt={blog.title}` ✅

**Internal links:** 7 — one per blog card → `/blog/{slug}`. Plus a featured tile link.

**Structured data:**
- (Inherited) Organization + WebSite **only**
- ❌ No `Blog` schema, no `CollectionPage`, no `ItemList` of articles

**Notable issues:**
- H1 → H3 level skip (no H2 between).
- Missing `Blog` / `CollectionPage` schema for the index. Each individual post emits BlogPosting; the index could declare itself as a Blog whose `blogPost[]` is this list.

---

### 10–16. Blog posts (7 total)

All 7 share [src/app/(public)/blog/[slug]/page.tsx](src/app/(public)/blog/[slug]/page.tsx) as the template and the same metadata shape:

- `generateMetadata`: title = `post.title` (template-applied), description = `post.excerpt`, canonical `/blog/{slug}`, OG type `article` with per-post `images[post.image]`, Twitter `summary_large_image` with same image, authors `[post.author]`.
- Schemas emitted in body: ✅ `BlogPosting`, ✅ `BreadcrumbList`, ✅ `FAQPage` (when `post.faqs` is non-empty — all 7 are).
- H1 ×1: `post.title` rendered in the header.
- H2: `## ` lines from markdown body + "Frequently asked questions" when present.
- H3: `### ` lines from markdown body.
- Hierarchy: clean H1 → H2 → H3.
- Images: 1 hero `<Image src={post.image} alt={post.title} priority>` + inline images parsed from `![alt](src)` in markdown (alt text varies per post, generally descriptive).

Per-post specifics:

#### 10. `/blog/tour-businesses-losing-customers-ai-search`
- Title (after template): **84 chars** ⚠️ — `"Why Tour Businesses Are Losing Customers to AI Search (And How to Fix It) | 4Pie Labs"` — truncated in SERPs at ~60 chars.
- Description (excerpt): 147 chars ✅
- Hero image: `/blog/ai-search-tours/header.jpg` (local) — alt = post title ✅
- Inline images: 2 (`inline-1.jpg`, `inline-2.jpg`) — alts: "How AI answer engines decide which businesses to recommend", "Structured content and schema that AI engines can cite" — ✅ descriptive
- FAQs: 3
- Internal links in markdown body: `/services/aeo`, `/services/ads`, `/services/ai`, `/audit` ✅
- Word count: ~750 visible body words
- Author: Syed Belal ✅ (matches /about Person)

#### 11. `/blog/best-marketing-agency-tour-operators`
- Title: **72 chars** ⚠️
- Description: 156 chars ⚠️ (1 over)
- Hero image local; inline links present
- FAQs: 3
- Internal links: `/services/ads`, `/services/aeo`, `/services/ai`, `/audit` ✅
- Word count: ~1,300 body words
- Author: Syed Belal ✅

#### 12. `/blog/best-google-ads-management-local-service-businesses`
- Title: **87 chars** 🔴 — longest in the catalog; the post template-appended `| 4Pie Labs` pushes it well past Google's truncation point.
- Description: 156 chars ⚠️
- Hero image local
- FAQs: 3
- Word count: ~1,250 body words (includes a markdown table — `renderContent` has table support, good for AEO citation)
- Author: Syed Suqlain — 🔴 **author-entity mismatch** (BlogPosting `author.url = /about` resolves to Person `name=Syed Belal`)

#### 13. `/blog/is-seo-still-important-2026`
- Title: **76 chars** ⚠️
- Description: 150 chars ✅
- Hero image local; 2 inline images (`inline-1.jpg`, `inline-2.jpg`)
- FAQs: 4
- Word count: ~1,500 body words (longest)
- Author: Syed Suqlain — 🔴 same author mismatch as #12

#### 14. `/blog/local-business-chatgpt-visibility`
- Title: **82 chars** ⚠️
- Description: 162 chars ⚠️
- Hero image: **external** (cdn.pixabay.com)
- FAQs: 4
- Word count: ~700 body words
- Author: Syed Belal ✅

#### 15. `/blog/painting-contractor-google-leads`
- Title: **71 chars** ⚠️
- Description: **209 chars** 🔴 — heavy SERP truncation expected; ~50 chars will be cut
- Hero image: external (Pixabay)
- FAQs: 4
- Word count: ~900 body words
- Author: Syed Belal ✅

#### 16. `/blog/aeo-vs-seo-local-business`
- Title: **66 chars** ⚠️ (just over)
- Description: **196 chars** 🔴 — heavy truncation expected
- Hero image: external (Pixabay)
- FAQs: 4
- Word count: ~750 body words
- Author: Syed Belal ✅

---

## Cross-cutting issues

### CC1. Blog post titles all truncate in SERPs
Every blog post wraps `post.title` with the layout's `"%s | 4Pie Labs"` template (13 chars overhead). All 7 posts end up between **66 and 87 chars** — past Google's ~60-char SERP truncation. Static routes (home, /services, /programs) deliberately use `title: { absolute: ... }` to bypass the template; blog posts don't, and they're the most title-sensitive pages on the site.

### CC2. /programs has 6 unstructured FAQs
6 substantive FAQs in JSX, zero FAQPage schema. The exact pattern is already implemented on /services/[category]; replicating costs ~20 lines.

### CC3. /services parent catalog has no schema
The page lists **18 services with descriptions, deliverables, and SEO blurbs** server-rendered into `<details>` — excellent content depth, no machine-readable signal that these are services. Either `CollectionPage` with `mainEntity → ItemList` or an `OfferCatalog` would cover it.

### CC4. /audit has no schema and no per-page social cards
The highest-priority commercial page (per `sitemap.ts` priority 0.85) inherits homepage defaults for OG + Twitter and emits no page-level schema. A `Service` schema for the "Free AI marketing audit" offer would explicitly link it to the Organization; `WebPage` with `mainEntity → Action` would describe the form intent.

### CC5. Author-entity mismatch for Syed Suqlain's posts
Two posts (Google Ads + SEO 2026) are authored by Syed Suqlain but the BlogPosting schema points `author.url` to `/about`, where the only `Person` block is for Syed Belal. The code's TODO comment ([blog/[slug]/page.tsx:341-345](src/app/(public)/blog/[slug]/page.tsx#L341)) acknowledges this — known gap.

### CC6. Descriptions over 155 chars on multiple pages
Homepage (187), /about (165), and 3 blog post excerpts (162, 196, 209). All will be truncated mid-sentence in Google SERPs. Copy edit fix.

### CC7. Per-page Twitter card not set on most pages
Only the homepage and blog posts override Twitter card metadata. /about, /services (catalog), /services/{aeo,ads,ai}, /audit, /programs, /blog all fall back to the layout's homepage-branded Twitter card. Link unfurls in Slack, X, etc. show the homepage title regardless of which page was shared.

### CC8. OG images are single-image site-wide
Every non-blog page uses `/og-image.png`. Per-page hero OG (e.g. a Service-specific card for /services/aeo) would lift unfurl CTR. Blog posts already do per-post — extending the pattern to commercial pages is the gap.

### CC9. /blog (index) skips heading level H1 → H3
Minor structural inconsistency. Insert a hidden-but-present H2 ("Latest articles" or similar) before the card grid.

### CC10. External blog hero images vs local
3 blog posts use Pixabay CDN images; 4 use local `/blog/*/header.jpg`. Mixed strategy. External CDNs are an availability risk and slightly hurt LCP. Migrating the 3 remaining to local would be ~3 image copies.

### CC11. /audit, /programs are dead ends for internal linking
Neither page links to siblings. /audit's only off-page exit is the form submit; /programs only links to /book. Adding contextual links (e.g. /programs → /services/{category} for each tier, /audit → relevant blog posts) would strengthen internal equity.

---

## Priority recommendations

Ranked by expected impact ÷ effort. Effort is implementation only — no QA/review included.

| # | Recommendation | Why it matters | Effort |
|---|---|---|---|
| **1** | **Add FAQPage schema to /programs** | 6 high-quality FAQs already in JSX; the schema unlocks SERP rich results and AEO citation. The /services/[category] template is the copy-paste source. | small (~15 min) |
| **2** | **Shorten blog titles OR bypass the layout template** | Every blog post's title truncates in SERPs. Two paths: (a) shorten `post.title` strings in `blogs.ts` to ≤45 chars, (b) wrap blog page metadata title in `{absolute: post.title}` so the `| 4Pie Labs` suffix is dropped — saves 13 chars without copy work. | small (option b) / medium (option a) |
| **3** | **Fix author-entity mismatch for Syed Suqlain** | 2 BlogPostings cite a Person URL that resolves to the wrong person. Add a second `Person` block to /about (or split into `/about/syed-belal` + `/about/syed-suqlain`) and switch `author.url` per post. | medium (~1 hr — touches /about + blog template) |
| **4** | **Add Service + WebPage schema to /audit** | Site's #1 conversion page has zero page-level schema and inherits homepage social cards. Service schema explicitly ties the offer to the Organization; per-page OG image would lift CTR on link unfurls. | small (~30 min) |
| **5** | **Add CollectionPage or ItemList schema to /services (catalog)** | 18 services described in `<details>` — Google can read the prose but has no signal that these are distinct service offerings. ItemList with 18 nested Service entries unlocks rich-result eligibility. | small (~30 min) |
| **6** | **Trim over-length descriptions** | Home (187 → ≤155), /about (165 → ≤155), three blog excerpts (162/196/209 → ≤155). Pure copy edits, all in `blogs.ts` for posts and the page metadata for static routes. | small (~20 min total) |
| **7** | **Add per-page Twitter card metadata** | /about, /services (catalog), 3 /services/[cat] pages, /audit, /programs, /blog — 8 pages all currently use the homepage Twitter card. A 4-line `twitter: { title, description, images? }` block per page. | small per page; medium total |
| **8** | **Add `Blog` or `CollectionPage` schema to /blog index** | Each post emits BlogPosting; the index has nothing. Declaring the index as `Blog` with `blogPost[]` lets crawlers and LLMs see the site's editorial structure as a unit. | small (~15 min) |
| **9** | **Migrate 3 external Pixabay blog hero images to local** | Reduce external-CDN dependency, slightly improve LCP, eliminate alt-routing through cdn.pixabay.com. | small per image (download + path swap) |
| **10** | **Cross-link /programs ↔ /services/{cat} and /audit → relevant blog posts** | Two of the most-visited pages don't pass internal equity. ~2 inline links per page is enough to fix. | small (~30 min) |

---

## Notes and caveats

- **Word counts are estimates.** I read the markdown content for blog posts directly (those are clean) but homepage and /services word counts span 12+ component files with interpolated copy — I gave ranges.
- **Headings on client-rendered pages** (Homepage, /programs carousel, /blog browser) are approximated from the source. If a heading is rendered conditionally based on state, only the default-render branch was counted.
- **No live crawler was run.** Numbers here are what the source emits; the deployed site should match because every page was prerendered or ISR-cached during recent runs (verified in earlier dev-server checks during the canonical-host fix).
- **Sitemap source.** Pulled the 16 URLs from `src/app/sitemap.ts`'s `staticRoutes` + `getAllPosts()` static fallback, matching what the production sitemap emits.
- **The `/book` and `/leave-a-review` routes exist** under `(public)` but are intentionally excluded from the sitemap (`/leave-a-review` is in `robots.disallow`; `/book` is a private booking flow not enrolled in the sitemap). Not audited per scope.
