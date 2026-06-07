import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  categories,
  SERVICE_CATEGORY_SLUGS,
  services,
} from "@/data/services";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const SERVICES_DESCRIPTION =
  "Explore 4Pie Labs marketing services: AI-first SEO and AEO, performance ads, and custom AI systems built for local service businesses.";

export const metadata: Metadata = {
  // Keyword-bearing title - replaces the bland "Services" so search
  // listings carry the three pillars in the title rather than a generic
  // category label.
  title: {
    absolute: "Local SEO, AEO & Performance Ads Services | 4Pie Labs",
  },
  description: SERVICES_DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Services - 4Pie Labs",
    description: SERVICES_DESCRIPTION,
    url: "/services",
    type: "website",
  },
};

/**
 * /services - the full catalog, server-rendered.
 *
 * Each service's full detail (description, deliverables `points[]`, and the
 * SEO blurb `seoDesc`) is written into the static HTML inside a native
 * `<details>` accordion. Collapsed by default, expanded on click via the
 * browser's built-in toggle (no client JS needed). Crawlers and AI
 * indexers see all 18 services' content because it's present in the DOM
 * regardless of open/closed state.
 *
 * This replaces the previous client-side `<ServicesBrowser />` which kept
 * the deep content in a click-mounted modal and shipped only ~272
 * indexable words to crawlers.
 */
export default function ServicesPage() {
  const pageUrl = `${SITE.url}/services`;

  // Individual services don't have their own pages - they're listed
  // on this catalog and re-listed inside the relevant
  // /services/[category] landing page. So each ItemList entry's
  // `url` points to the category section anchor on this page
  // (`#aeo`, `#ads`, `#ai`), which is the closest real on-page
  // location for each service.
  const serviceListItems = services.map((s, i) => {
    const categorySlug = SERVICE_CATEGORY_SLUGS[s.category];
    return {
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.desc,
        url: `${pageUrl}#${categorySlug}`,
        category: s.category,
        provider: {
          "@type": "Organization",
          "@id": `${SITE.url}#organization`,
        },
      },
    };
  });

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: pageUrl,
    name: "Local SEO, AEO & Performance Ads Services",
    description: SERVICES_DESCRIPTION,
    mainEntity: {
      "@type": "ItemList",
      name: "4Pie Labs services",
      numberOfItems: services.length,
      itemListElement: serviceListItems,
    },
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
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="relative pt-12 md:pt-20 pb-24 px-4 overflow-hidden">
      <JsonLd data={collectionPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Local depth blobs */}
      <span
        aria-hidden
        className="absolute pointer-events-none -top-24 -left-32 w-[460px] h-[460px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.40), transparent 60%)",
        }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none top-[30%] -right-24 w-[380px] h-[380px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(217,119,6,0.30), transparent 60%)",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 max-w-3xl mx-auto text-center pb-10 md:pb-14">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-5">
          The full local-growth catalog
        </span>
        <h1 className="text-[clamp(36px,5.5vw,56px)] font-semibold leading-[1.05] tracking-tight text-foreground [text-wrap:balance]">
          Everything we run, so you{" "}
          <span className="font-semibold text-primary">
            don&apos;t have to.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
          Local SEO, Google Business Profile, AEO, paid search and social, and
          the conversion path that ties them all to revenue. Pick the engine
          you need, or wrap them in a program and let us run the whole funnel.
        </p>
      </section>

      {/* Quick-nav anchor pills - jump straight to a category section. */}
      <nav
        aria-label="Service categories"
        className="relative z-10 max-w-3xl mx-auto mb-14 md:mb-16"
      >
        <ul className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <li key={c}>
              <a
                href={`#${SERVICE_CATEGORY_SLUGS[c]}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface border border-card-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                {c}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Catalog: three category sections, each a grid of <details> cards. */}
      <div className="relative z-10 max-w-[1240px] mx-auto space-y-20 md:space-y-24">
        {categories.map((category) => {
          const slug = SERVICE_CATEGORY_SLUGS[category];
          const items = services.filter((s) => s.category === category);
          return (
            <section
              key={category}
              id={slug}
              aria-labelledby={`heading-${slug}`}
              className="scroll-mt-28"
            >
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-10">
                <div>
                  <span className="block text-xs font-medium text-primary tracking-widest uppercase mb-2">
                    {category}
                  </span>
                  <h2
                    id={`heading-${slug}`}
                    className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground"
                  >
                    {items.length} services inside this pillar
                  </h2>
                </div>
                <Link
                  href={`/services/${slug}`}
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline shrink-0"
                >
                  Open the {category} landing page
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                {items.map((s) => {
                  const Icon = s.icon;
                  return (
                    <details
                      key={s.title}
                      className="group bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] open:shadow-[var(--shadow-card-hover)] transition-shadow [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="cursor-pointer list-none p-6 md:p-7 flex items-start gap-4">
                        <span
                          aria-hidden
                          className="w-11 h-11 rounded-xl grid place-items-center bg-primary-muted text-primary shrink-0"
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold tracking-tight text-foreground mb-1.5">
                            {s.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {s.desc}
                          </p>
                        </div>
                        <span
                          aria-hidden
                          className="shrink-0 w-7 h-7 rounded-full bg-surface-2 grid place-items-center text-muted-foreground group-open:bg-primary-muted group-open:text-primary transition-colors mt-1"
                        >
                          <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                        </span>
                      </summary>
                      <div className="px-6 md:px-7 pb-6 md:pb-7">
                        {s.details && (
                          <p className="text-xs text-subtle-foreground italic mb-4">
                            {s.details}
                          </p>
                        )}
                        <h4 className="text-[11px] font-medium text-subtle-foreground uppercase tracking-widest mb-3">
                          What&apos;s included
                        </h4>
                        <ul className="space-y-2.5 mb-5">
                          {s.points.map((p) => (
                            <li
                              key={p}
                              className="flex items-start gap-2.5 text-sm"
                            >
                              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                              <span className="text-foreground/90 leading-snug">
                                {p}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm text-muted-foreground leading-relaxed pt-4 border-t border-border">
                          {s.seoDesc}
                        </p>
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Closing CTA */}
      <section className="relative z-10 max-w-3xl mx-auto text-center mt-24">
        <div className="bg-surface border border-card-border rounded-2xl p-10 md:p-12 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3 [text-wrap:balance]">
            Not sure where to{" "}
            <span className="font-semibold text-primary">start?</span>
          </h2>
          <p className="text-muted-foreground mb-7 max-w-xl mx-auto">
            Get a free 12-point audit. We will tell you which pillar matters
            most for your market, with no pitch deck.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/audit"
              className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-lg text-base font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
            >
              Get a free AI audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-surface-2 hover:bg-surface border border-border text-foreground px-7 py-3.5 rounded-lg text-base font-medium transition-colors"
            >
              Book a strategy call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
