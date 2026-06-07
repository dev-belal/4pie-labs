import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ProgramsCarousel } from "@/components/ProgramsCarousel";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  // Keyword-bearing title - replaces the bland "Programs" so the page
  // ranks for the buyer query, not a category label.
  title: {
    absolute: "Marketing Programs for Local Service Businesses | 4Pie Labs",
  },
  description:
    "Four programs from foundation to full-stack - Core, Pipeline, Operating System, Pulse. AEO is included in every tier. No pricing on the site - book a call.",
  alternates: { canonical: "/programs" },
};

const FAQS = [
  {
    q: "Is AEO really included in every tier?",
    a: "Yes. AEO is our differentiator and the floor of what we offer, not an upsell. Every program - Core through Operating System - includes ongoing AEO work for ChatGPT, Perplexity, Google AI Overviews, and Gemini.",
  },
  {
    q: "Why no pricing on the site?",
    a: "Local markets vary too much for a fixed price list to be useful. A painting contractor in Portland competing for high-end residential has a different cost than a tour operator in a saturated coastal market. We quote against your market and your goals on the strategy call.",
  },
  {
    q: "Do you offer market exclusivity?",
    a: "Yes - for Core and above. We don't run two competing painting contractors in the same service area, or two tour operators selling overlapping experiences.",
  },
  {
    q: "Can I switch tiers mid-engagement?",
    a: "Always. Most clients start at Core and graduate to Pipeline once ranking + AEO momentum kicks in. The transition is structured - nothing gets dropped.",
  },
  {
    q: "What does the first 90 days look like?",
    a: "Discovery week → audit week → foundation build (website, GBP, schema, tracking) over weeks 3–6 → AEO + content engine live by week 8 → ads launch (Pipeline+) by week 9–12. After that, every additional week compounds.",
  },
  {
    q: "Do you work with marketing agencies?",
    a: "We do, but it's not what we lead with on the site. If you're an agency wanting AEO + AI infrastructure work, email hello@fourpielabs.com directly.",
  },
];

export default function ProgramsPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
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
        name: "Programs",
        item: `${SITE.url}/programs`,
      },
    ],
  };

  return (
    <main className="px-4 pb-32">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center pt-12 pb-12 md:pt-20 md:pb-14">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
          Programs
        </span>
        <h1 className="text-[clamp(36px,5vw,56px)] font-semibold leading-[1.1] tracking-tight text-foreground mb-6 [text-wrap:balance]">
          Four programs.{" "}
          <span className="font-semibold text-primary">
            One philosophy.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Every engagement combines some mix of these. AEO runs through all of
          them - it&apos;s the floor, not an upsell. Swipe, arrow, or pick from
          the deck below to jump between tiers.
        </p>
      </section>

      {/* Carousel - client component owns hash + keyboard + swipe state */}
      <ProgramsCarousel />

      {/* CTA strip */}
      <section className="max-w-3xl mx-auto text-center mt-20 mb-24">
        <Link
          href="/book"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-lg text-base font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
        >
          Book a strategy call
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-sm text-muted-foreground mt-4">
          30-min call · No pitch deck · You leave with a plan.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground text-center mb-10">
          Common questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((f) => (
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
    </main>
  );
}
