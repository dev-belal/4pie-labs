import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Box, Layers, Plus, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Four programs from foundation to full-stack — Core, Pipeline, Operating System, Pulse. AEO is included in every tier.",
};

// Stub for the new /programs page introduced by the Phase 3 design.
// The full 4-tier comparison, FAQ, and "Most popular" featured tile land in a
// subsequent commit on this branch. For now this stub keeps the nav links from
// 404-ing and gives visitors a sensible holding page in the new theme.
const PROGRAMS = [
  {
    id: "core",
    name: "Core",
    tag: "Foundation",
    desc: "Where most clients start. SEO + AEO + GBP + website + monthly content + market exclusivity. Month-to-month after the initial 90 days.",
    Icon: Layers,
  },
  {
    id: "pipeline",
    name: "Pipeline",
    tag: "Most popular",
    featured: true,
    desc: "Core, plus Google + Maps ads, landing pages, and AI lead scoring. The lead-gen engine. 6-month minimum.",
    Icon: Plus,
  },
  {
    id: "os",
    name: "Operating System",
    tag: "Full-stack",
    desc: "Pipeline, plus multi-channel ads, a custom AI agent, CRM automation, and your own performance dashboards. 12-month minimum.",
    Icon: Box,
  },
  {
    id: "pulse",
    name: "Pulse",
    tag: "Social-first",
    desc: "Meta + YouTube + Instagram + TikTok + creative production, run in parallel with Pipeline. 6-month minimum.",
    Icon: Activity,
  },
];

export default function ProgramsPage() {
  return (
    <main className="px-4 pb-32">
      <section className="max-w-5xl mx-auto text-center pt-12 pb-16">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
          Programs
        </span>
        <h1 className="text-[clamp(36px,5vw,52px)] font-semibold leading-[1.1] tracking-tight text-foreground mb-6">
          Four programs.{" "}
          <span className="font-serif italic text-primary">One philosophy.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every engagement combines some mix of these. AEO runs through all of
          them — it&apos;s the floor, not an upsell.
        </p>
      </section>

      <section className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4 md:gap-6">
        {PROGRAMS.map((p) => (
          <article
            id={p.id}
            key={p.id}
            className={
              p.featured
                ? "rounded-2xl p-8 md:p-10 bg-foreground text-background border border-foreground"
                : "rounded-2xl p-8 md:p-10 bg-surface border border-card-border"
            }
          >
            <div className="flex items-start justify-between mb-6">
              <span
                className={
                  p.featured
                    ? "w-11 h-11 rounded-xl grid place-items-center bg-primary-muted text-primary"
                    : "w-11 h-11 rounded-xl grid place-items-center bg-primary-muted text-primary"
                }
              >
                <p.Icon className="w-5 h-5" />
              </span>
              <span
                className={
                  p.featured
                    ? "text-xs font-medium text-primary px-2.5 py-1 rounded-full bg-primary-muted"
                    : "text-xs font-medium text-muted-foreground"
                }
              >
                {p.tag}
              </span>
            </div>
            <h2 className="text-2xl font-semibold mb-3 tracking-tight">
              {p.name}
            </h2>
            <p
              className={
                p.featured
                  ? "text-background/80 leading-relaxed"
                  : "text-muted-foreground leading-relaxed"
              }
            >
              {p.desc}
            </p>
          </article>
        ))}
      </section>

      <section className="max-w-3xl mx-auto text-center mt-20">
        <p className="text-sm text-muted-foreground mb-6">
          Full comparison table, FAQ, and per-program detail are landing in the
          next commit on this branch.
        </p>
        <Link
          href="/book"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-lg text-base font-medium transition-colors"
        >
          Book a strategy call
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  );
}
