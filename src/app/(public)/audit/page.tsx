import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { AuditForm } from "@/components/AuditForm";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const AUDIT_DESCRIPTION =
  "12-point audit of your local visibility across Google, Maps, and AI answer engines. No pitch, no pressure - you leave with a plan.";

export const metadata: Metadata = {
  title: "Free AI marketing audit",
  description: AUDIT_DESCRIPTION,
  alternates: { canonical: "/audit" },
  openGraph: {
    title: "Free AI marketing audit - 4Pie Labs",
    description: AUDIT_DESCRIPTION,
    url: "/audit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI marketing audit - 4Pie Labs",
    description: AUDIT_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

const POINTS = [
  "Google Maps pack position for your top 50 buyer queries",
  "Google Business Profile completeness + review velocity",
  "AEO presence: ChatGPT, Perplexity, Google AI Overviews, Gemini",
  "Top-3 local SEO competitors + the gap to close",
  "Page speed and Core Web Vitals on mobile",
  "Schema / structured data coverage for AI retrieval",
  "Local citation consistency (NAP, directories, niche maps)",
  "Conversion path: from search → call/book on top landing pages",
  "Ad coverage if you're running paid (Google / Meta / YouTube)",
  "Content gaps vs. the queries your buyers actually run",
  "Brand sentiment across reviews and forums",
  "Tracking integrity (analytics, call tracking, lead attribution)",
];

export default function AuditPage() {
  const pageUrl = `${SITE.url}/audit`;
  const serviceId = `${pageUrl}#service`;

  // Service: the actual audit offering. provider references the
  // Organization declared in layout.tsx by @id so we don't redeclare
  // it. areaServed mirrors the /services/[category] convention
  // (Country = US) because the same SITE.areaServed isn't defined
  // anywhere yet - kept conservative + consistent with the rest of
  // the site's structured data.
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": serviceId,
    name: "Free AI Marketing Audit",
    description: AUDIT_DESCRIPTION,
    provider: {
      "@type": "Organization",
      "@id": `${SITE.url}#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: pageUrl,
    name: "Free AI marketing audit",
    description: AUDIT_DESCRIPTION,
    mainEntity: { "@id": serviceId },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Free Audit",
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="px-4 pb-32">
      <JsonLd data={serviceSchema} />
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center pt-12 pb-10 md:pt-20 md:pb-12">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
          Free AI marketing audit
        </span>
        <h1 className="text-[clamp(36px,5vw,52px)] font-semibold leading-[1.1] tracking-tight text-foreground mb-6 [text-wrap:balance]">
          See where you stand{" "}
          <span className="font-semibold text-primary">
            before you spend.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground mb-3">
          A 12-point audit of your local visibility - Google, Maps, AI answer
          engines, ads, conversion path. No pitch deck, no pressure. You leave
          with a plan, free.
        </p>
        <p className="text-xs text-subtle-foreground">
          30-min call · No card required · Plan emailed within 48 hours
        </p>
      </section>

      {/* Two-column: checklist + form */}
      <section className="max-w-[1100px] mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-12 items-start">
        <div className="bg-surface border border-card-border rounded-2xl p-6 md:p-10 lg:sticky lg:top-28">
          <h2 className="text-xl font-semibold mb-6 tracking-tight">
            What we check
          </h2>
          <ul className="grid gap-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-foreground/90 leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <AuditForm />
      </section>
    </main>
  );
}
