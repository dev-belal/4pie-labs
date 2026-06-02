import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Cpu,
  MessageCircle,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import {
  categories,
  SERVICE_CATEGORY_SLUGS,
  categoryFromSlug,
  services,
  type ServiceCategory,
} from "@/data/services";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

/**
 * One landing page per service category - /services/aeo, /services/ads,
 * /services/ai. Each page is a focused marketing surface for a single
 * pillar: hero with the pillar's value-prop, full-detail list of the six
 * services inside it (title + desc + key deliverables), industry context,
 * cross-links to the other two pillars, and a closing CTA.
 *
 * Built as a dynamic [category] segment with generateStaticParams so the
 * three pages are prerendered at build time; per-category SEO is wired
 * through generateMetadata.
 */

type CategoryMeta = {
  eyebrow: string;
  headlinePrefix: string;
  headlineAccent: string;
  /** Long-form value-prop rendered on the page hero. */
  subhead: string;
  /** Short (<160 char) version used by generateMetadata so search snippets
   *  don't truncate. Kept distinct from `subhead` because the on-page copy
   *  benefits from the longer pitch. */
  metaDescription: string;
  Icon: LucideIcon;
  bullets: string[];
  faqs: { q: string; a: string }[];
};

const CATEGORY_META: Record<ServiceCategory, CategoryMeta> = {
  "AI-First SEO + AEO": {
    eyebrow: "AI-First SEO + AEO",
    headlinePrefix: "Get cited where buyers actually look",
    headlineAccent: "first.",
    subhead:
      "Local SEO + Google Business Profile + Answer Engine Optimization across ChatGPT, Perplexity, Gemini, and Google AI Overviews. We engineer your site to be the source those engines cite, not the link they skip.",
    metaDescription:
      "Get cited by ChatGPT, Perplexity, and Google AI Overviews. 4Pie Labs builds AI-first SEO and answer engine optimization for local service businesses.",
    Icon: MessageCircle,
    bullets: [
      "Top-3 Maps pack rankings for your 50 highest-intent buyer queries",
      "Site re-engineered for schema-first AI retrieval",
      "AEO content engine producing pages that get cited monthly",
      "Google Business Profile + review-velocity system",
    ],
    faqs: [
      {
        q: "How long until I see results?",
        a: "Local rankings begin moving in 30-60 days. AEO citations typically show up in 45-90 days as engines re-crawl. Full pack dominance takes 6-12 months depending on competition.",
      },
      {
        q: "Is AEO really different from regular SEO?",
        a: "Yes. Answer engines (ChatGPT, Perplexity, Gemini, Google AI Overviews) retrieve from different signals than classic search - structured data, schema graphs, brand-entity consistency, and the way your pages answer questions. We engineer for both at once.",
      },
      {
        q: "Do you do the content writing or just the strategy?",
        a: "Both. We produce the long-form pages, location pages, and project showcases as part of the engagement. Strategy without execution doesn't move rankings.",
      },
    ],
  },
  "Performance Ads": {
    eyebrow: "Performance Ads",
    headlinePrefix: "Paid that actually",
    headlineAccent: "pays.",
    subhead:
      "Google Search + Maps, Meta + Instagram, YouTube + TikTok, and the conversion path that ties every click to revenue. Predictable lead flow, every channel measured, no agency theatre.",
    metaDescription:
      "Performance ads that turn clicks into booked jobs. 4Pie Labs runs Google, Maps, and paid campaigns built for local service businesses.",
    Icon: Search,
    bullets: [
      "AI-optimized bidding + ad copy + targeting per channel",
      "Per-campaign landing pages built to convert",
      "Call tracking + lead attribution wired end-to-end",
      "Weekly performance tuning - dashboards you can read at a glance",
    ],
    faqs: [
      {
        q: "What's a realistic monthly ad spend to start with?",
        a: "Most local-services clients start between $3K-$10K/month on ads. Below $3K, paid is hard to make pay back. Above $10K, channel mix matters more than budget. Use our marketing budget calculator on the homepage for a personalized number.",
      },
      {
        q: "Do you handle the creative too, or just the targeting?",
        a: "We handle both. Ad creatives are a separate engagement we run for Performance Ads clients - scripts, edits, design - so the campaign and the creative are tuned together.",
      },
      {
        q: "How long until paid stabilizes?",
        a: "Search ads usually reach a steady CPL within 2-4 weeks. Social ads take longer (4-8 weeks) because creative needs more iteration. You'll see directional data in week 1.",
      },
    ],
  },
  "Custom AI Systems": {
    eyebrow: "Custom AI Systems",
    headlinePrefix: "The infrastructure most agencies",
    headlineAccent: "can't build.",
    subhead:
      "AI operating systems, autonomous agents, workflow automation, CRM integration, custom dashboards. The back-office layer that makes the rest of your marketing actually work - and that gives you data nobody else in your market has.",
    metaDescription:
      "Custom AI systems for local service businesses: lead scoring, attribution, and automation wired into one accountable funnel by 4Pie Labs.",
    Icon: Cpu,
    bullets: [
      "Custom AI agents that answer inquiries 24/7 + book appointments",
      "End-to-end workflow automation across your existing tools",
      "Real-time dashboards - the ones we use, available to you",
      "Secure deployments (HIPAA / GDPR-ready) with private cloud options",
    ],
    faqs: [
      {
        q: "Do I need to be on a specific CRM or tech stack?",
        a: "No. We integrate with whatever you already use - HubSpot, Pipedrive, GHL, Zoho, JobTread, Housecall Pro, etc. If your tools have an API, we can wire them. If they don't, we build the bridge.",
      },
      {
        q: "Who owns the AI agents and automations you build?",
        a: "You do. Everything we build lives in your accounts under your credentials. If you ever part ways with us, the systems stay with you - we don't hold your operations hostage.",
      },
      {
        q: "Is this safe for sensitive customer data?",
        a: "Yes - we ship private-cloud deployments (AWS, Azure, GCP) with end-to-end encryption, granular access control, and PII masking. For regulated industries we run HIPAA / GDPR-compliant architectures.",
      },
    ],
  },
};

const CATEGORY_ICONS: Record<ServiceCategory, LucideIcon> = {
  "AI-First SEO + AEO": MessageCircle,
  "Performance Ads": Search,
  "Custom AI Systems": Cpu,
};

const CATEGORY_BLURBS: Record<ServiceCategory, string> = {
  "AI-First SEO + AEO": "Get cited by ChatGPT, Perplexity, Gemini.",
  "Performance Ads": "Paid that pays. Google, Meta, YouTube.",
  "Custom AI Systems": "Agents, dashboards, CRM automation.",
};

type Params = { category: string };

export function generateStaticParams(): Params[] {
  return Object.values(SERVICE_CATEGORY_SLUGS).map((slug) => ({
    category: slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = categoryFromSlug(slug);
  if (!category) {
    return { title: "Services" };
  }
  const meta = CATEGORY_META[category];
  return {
    title: meta.eyebrow,
    description: meta.metaDescription,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: `${meta.eyebrow} - 4Pie Labs`,
      description: meta.metaDescription,
      url: `/services/${slug}`,
      type: "website",
    },
  };
}

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category: slug } = await params;
  const category = categoryFromSlug(slug);
  if (!category) notFound();

  const meta = CATEGORY_META[category];
  const HeroIcon = meta.Icon;
  const categoryServices = services.filter((s) => s.category === category);
  const otherCategories = categories.filter((c) => c !== category);

  // Structured data, all bound to real values from CATEGORY_META + services.
  // 4Pie Labs is a remote / national agency, so areaServed is the US as a
  // Country - NOT a LocalBusiness, which would imply a physical storefront.
  const headline = `${meta.headlinePrefix} ${meta.headlineAccent}`.trim();
  const pageUrl = `${SITE.url}/services/${slug}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: headline,
    serviceType: category,
    description: meta.metaDescription,
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${category} catalog`,
      itemListElement: categoryServices.map((s, i) => ({
        "@type": "Offer",
        position: i + 1,
        itemOffered: {
          "@type": "Service",
          name: s.title,
          description: s.desc,
        },
      })),
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: `${SITE.url}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category,
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="relative px-4 pb-32 overflow-hidden">
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Local depth blobs */}
      <span
        aria-hidden
        className="absolute pointer-events-none -top-24 -left-32 w-[480px] h-[480px] rounded-full opacity-55 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.42), transparent 60%)",
        }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none top-[35%] -right-24 w-[400px] h-[400px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,155,124,0.32), transparent 60%)",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 max-w-[1100px] mx-auto pt-12 md:pt-20 pb-16 md:pb-20">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8"
        >
          <Link
            href="/services"
            className="hover:text-foreground transition-colors"
          >
            Services
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{meta.eyebrow}</span>
        </nav>

        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end mb-10">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-primary tracking-widest uppercase mb-5">
              <HeroIcon className="w-3.5 h-3.5" />
              {meta.eyebrow}
            </span>
            <h1 className="text-[clamp(36px,5vw,60px)] font-semibold leading-[1.05] tracking-tight text-foreground [text-wrap:balance]">
              {meta.headlinePrefix}{" "}
              <span className="font-semibold text-primary">
                {meta.headlineAccent}
              </span>
            </h1>
          </div>
          <span
            aria-hidden
            className="hidden md:grid w-20 h-20 rounded-2xl bg-primary-muted text-primary place-items-center shrink-0"
          >
            <HeroIcon className="w-9 h-9" />
          </span>
        </div>

        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-10">
          {meta.subhead}
        </p>

        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-3xl mb-12">
          {meta.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span className="text-foreground/90 leading-snug">{b}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row items-start gap-3">
          <Link
            href="/book"
            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-lg text-base font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
          >
            Book a strategy call
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-surface hover:bg-surface-2 border border-border text-foreground px-7 py-3.5 rounded-lg text-base font-medium transition-colors"
          >
            Get a free AI audit
          </Link>
        </div>
      </section>

      {/* What's inside */}
      <section className="relative z-10 max-w-[1240px] mx-auto mb-24">
        <div className="text-center mb-12 md:mb-14">
          <span className="block text-xs font-medium text-muted-foreground tracking-widest uppercase mb-3">
            Inside this pillar
          </span>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-semibold tracking-tight text-foreground leading-[1.15] [text-wrap:balance]">
            Six services, one focused{" "}
            <span className="font-semibold text-primary">engagement.</span>
          </h2>
          <p className="text-base text-muted-foreground mt-4 max-w-2xl mx-auto">
            Mix and match, or run them as a package. Every engagement is
            scoped to your market and your goals on the strategy call.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {categoryServices.map((s, i) => {
            const Icon = s.icon;
            return (
              <article
                key={s.title}
                className="group bg-surface border border-card-border rounded-2xl p-7 md:p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="w-11 h-11 rounded-xl grid place-items-center bg-primary-muted text-primary">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-medium text-subtle-foreground tracking-wider tabular-nums">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {s.desc}
                </p>
                {s.details && (
                  <p className="text-xs text-subtle-foreground italic mb-5">
                    {s.details}
                  </p>
                )}
                <ul className="space-y-2 mb-5 flex-1">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm leading-snug"
                    >
                      <span
                        aria-hidden
                        className="w-1 h-1 mt-2 rounded-full bg-primary shrink-0"
                      />
                      <span className="text-foreground/85">{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-border text-xs text-subtle-foreground italic leading-relaxed">
                  {s.seoDesc}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative z-10 max-w-3xl mx-auto text-center mb-24">
        <div className="bg-surface border border-card-border rounded-2xl p-10 md:p-12 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3 [text-wrap:balance]">
            Want to see what{" "}
            <span className="font-semibold text-primary">
              {meta.eyebrow.toLowerCase()}
            </span>{" "}
            looks like for your market?
          </h2>
          <p className="text-muted-foreground mb-7 max-w-xl mx-auto">
            Book a 30-min call or grab a free 12-point audit. Either way, you
            leave with a plan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/book"
              className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-lg text-base font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
            >
              Book a strategy call
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 bg-surface-2 hover:bg-surface border border-border text-foreground px-7 py-3.5 rounded-lg text-base font-medium transition-colors"
            >
              Get a free AI audit
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-3xl mx-auto mb-24">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground text-center mb-10">
          Common questions
        </h2>
        <div className="space-y-4">
          {meta.faqs.map((f) => (
            <details
              key={f.q}
              className="group bg-surface border border-card-border rounded-xl p-5 md:p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                <span className="text-base font-semibold text-foreground tracking-tight pr-4">
                  {f.q}
                </span>
                <span className="shrink-0 w-7 h-7 rounded-full bg-surface-2 grid place-items-center text-muted-foreground group-open:bg-primary-muted group-open:text-primary transition-colors">
                  <Plus className="w-3.5 h-3.5 group-open:rotate-45 transition-transform" />
                </span>
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed text-sm">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Cross-links to the other pillars */}
      <section className="relative z-10 max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <span className="block text-xs font-medium text-muted-foreground tracking-widest uppercase mb-3">
            Also explore
          </span>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            The other pillars in our stack
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {otherCategories.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            const href = `/services/${SERVICE_CATEGORY_SLUGS[c]}`;
            return (
              <Link
                key={c}
                href={href}
                className="group flex items-start gap-4 p-6 bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all"
              >
                <span className="w-12 h-12 rounded-xl grid place-items-center bg-primary-muted text-primary shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold tracking-tight text-foreground mb-1">
                    {c}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {CATEGORY_BLURBS[c]}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Browse the full catalog
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
