import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Box,
  CheckCircle2,
  Layers,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Four programs from foundation to full-stack — Core, Pipeline, Operating System, Pulse. AEO is included in every tier. No pricing on the site — book a call.",
};

type Program = {
  id: string;
  name: string;
  tagline: string;
  tag: string;
  tagColor?: "primary";
  featured?: boolean;
  intro: string;
  whatsIncluded: string[];
  terms: string;
  Icon: LucideIcon;
};

const PROGRAMS: Program[] = [
  {
    id: "core",
    name: "Core",
    tagline: "Foundation",
    tag: "Foundation",
    intro:
      "Where most clients start. Visibility-first — search, maps, AI answer engines, and the website that converts them.",
    whatsIncluded: [
      "Local SEO + on-page technical SEO",
      "Answer Engine Optimization (ChatGPT / Perplexity / AI Overviews / Gemini)",
      "Google Business Profile management + review velocity",
      "Conversion-tuned website (or rebuild)",
      "Monthly content production — long-form pages tuned for AI retrieval",
      "Market exclusivity in your service area",
    ],
    terms: "Month-to-month after an initial 90-day commitment.",
    Icon: Layers,
  },
  {
    id: "pipeline",
    name: "Pipeline",
    tagline: "Most popular",
    tag: "Most popular",
    tagColor: "primary",
    featured: true,
    intro:
      "Core, plus the demand-capture engine. Paid that pays — and the AI scoring layer that turns clicks into booked jobs.",
    whatsIncluded: [
      "Everything in Core",
      "Google Search + Maps ads",
      "Per-campaign landing pages built to convert",
      "AI lead scoring + routing",
      "Call tracking + attribution",
      "Weekly performance tuning",
    ],
    terms: "6-month minimum engagement.",
    Icon: Plus,
  },
  {
    id: "os",
    name: "Operating System",
    tagline: "Full-stack",
    tag: "Full-stack",
    intro:
      "Pipeline, plus the AI operating layer most agencies can't build. The full stack — visibility, capture, automation, and your own performance dashboards.",
    whatsIncluded: [
      "Everything in Pipeline",
      "Multi-channel ads (Google / Meta / YouTube)",
      "Custom AI agent for your inquiries",
      "CRM automation + integrations",
      "Your own performance dashboards (the ones we use)",
      "Quarterly strategy sessions",
    ],
    terms: "12-month minimum engagement.",
    Icon: Box,
  },
  {
    id: "pulse",
    name: "Pulse",
    tagline: "Social-first",
    tag: "Social-first",
    intro:
      "A parallel path for brands whose growth is on social. Creative production + paid social, run in parallel with Pipeline or standalone.",
    whatsIncluded: [
      "Meta + Instagram ads",
      "YouTube + TikTok short-form ads",
      "Creative production (scripts, edits, assets)",
      "Community + DM management",
      "Monthly creative refresh",
      "Weekly performance review",
    ],
    terms: "6-month minimum engagement.",
    Icon: Activity,
  },
];

const FAQS = [
  {
    q: "Is AEO really included in every tier?",
    a: "Yes. AEO is our differentiator and the floor of what we offer, not an upsell. Every program — Core through Operating System — includes ongoing AEO work for ChatGPT, Perplexity, Google AI Overviews, and Gemini.",
  },
  {
    q: "Why no pricing on the site?",
    a: "Local markets vary too much for a fixed price list to be useful. A painting contractor in Portland competing for high-end residential has a different cost than a tour operator in a saturated coastal market. We quote against your market and your goals on the strategy call.",
  },
  {
    q: "Do you offer market exclusivity?",
    a: "Yes — for Core and above. We don't run two competing painting contractors in the same service area, or two tour operators selling overlapping experiences.",
  },
  {
    q: "Can I switch tiers mid-engagement?",
    a: "Always. Most clients start at Core and graduate to Pipeline once ranking + AEO momentum kicks in. The transition is structured — nothing gets dropped.",
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
  return (
    <main className="px-4 pb-32">
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center pt-12 pb-16 md:pt-20 md:pb-20">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
          Programs
        </span>
        <h1 className="text-[clamp(36px,5vw,56px)] font-semibold leading-[1.1] tracking-tight text-foreground mb-6 [text-wrap:balance]">
          Four programs.{" "}
          <span className="font-serif italic font-normal text-primary">
            One philosophy.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Every engagement combines some mix of these. AEO runs through all of
          them — it&apos;s the floor, not an upsell. No pricing on the site —
          book a call and we&apos;ll quote against your market.
        </p>
      </section>

      {/* Programs grid */}
      <section className="max-w-[1240px] mx-auto grid md:grid-cols-2 gap-5 md:gap-6">
        {PROGRAMS.map((p) => (
          <article
            id={p.id}
            key={p.id}
            className={cn(
              "rounded-2xl p-8 md:p-10 border flex flex-col",
              p.featured
                ? "bg-foreground text-background border-foreground"
                : "bg-surface border-card-border",
            )}
          >
            <div className="flex items-start justify-between mb-6">
              <span className="w-11 h-11 rounded-xl grid place-items-center bg-primary-muted text-primary">
                <p.Icon className="w-5 h-5" />
              </span>
              <span
                className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  p.featured
                    ? "bg-primary-muted text-primary"
                    : p.tagColor === "primary"
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                {p.tag}
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              {p.name}
              <span
                className={cn(
                  "ml-2 text-sm font-normal align-middle",
                  p.featured ? "text-background/60" : "text-muted-foreground",
                )}
              >
                · {p.tagline}
              </span>
            </h2>
            <p
              className={cn(
                "leading-relaxed mb-6",
                p.featured ? "text-background/85" : "text-muted-foreground",
              )}
            >
              {p.intro}
            </p>

            <h3
              className={cn(
                "text-xs font-medium uppercase tracking-widest mb-3",
                p.featured ? "text-background/60" : "text-subtle-foreground",
              )}
            >
              What&apos;s included
            </h3>
            <ul className="space-y-2.5 mb-6 flex-1">
              {p.whatsIncluded.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-snug"
                >
                  <CheckCircle2
                    className={cn(
                      "w-4 h-4 shrink-0 mt-0.5",
                      p.featured ? "text-primary" : "text-success",
                    )}
                  />
                  <span
                    className={
                      p.featured ? "text-background/90" : "text-foreground/90"
                    }
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className={cn(
                "text-xs pt-4 border-t",
                p.featured
                  ? "text-background/60 border-background/15"
                  : "text-subtle-foreground border-border",
              )}
            >
              {p.terms}
            </div>
          </article>
        ))}
      </section>

      {/* CTA strip */}
      <section className="max-w-3xl mx-auto text-center mt-20 mb-24">
        <Link
          href="/book"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-lg text-base font-medium transition-colors"
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
