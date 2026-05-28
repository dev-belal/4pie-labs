import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { AuditForm } from "@/components/AuditForm";

export const metadata: Metadata = {
  title: "Free AI marketing audit",
  description:
    "12-point audit of your local visibility across Google, Maps, and AI answer engines. No pitch, no pressure — you leave with a plan.",
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
  return (
    <main className="px-4 pb-32">
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center pt-12 pb-10 md:pt-20 md:pb-12">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
          Free AI marketing audit
        </span>
        <h1 className="text-[clamp(36px,5vw,52px)] font-semibold leading-[1.1] tracking-tight text-foreground mb-6 [text-wrap:balance]">
          See where you stand{" "}
          <span className="font-serif italic font-normal text-primary">
            before you spend.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground mb-3">
          A 12-point audit of your local visibility — Google, Maps, AI answer
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
