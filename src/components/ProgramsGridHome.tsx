import Link from "next/link";
import { Activity, ArrowRight, Box, Layers, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Phase 3 four-program teaser on the homepage. Pipeline is the featured tile
 * (dark fill) to telegraph the "most popular" path. Each card links to the
 * corresponding anchor on the full /programs page.
 */

const PROGRAMS = [
  {
    id: "core",
    name: "Core",
    tag: "Foundation",
    blurb: "SEO + AEO + GBP + monthly content. Where most clients start.",
    Icon: Layers,
  },
  {
    id: "pipeline",
    name: "Pipeline",
    tag: "Most popular",
    featured: true,
    blurb: "Core + ads + landing pages + AI lead scoring. 6-month minimum.",
    Icon: Plus,
  },
  {
    id: "os",
    name: "Operating System",
    tag: "Full-stack",
    blurb: "Pipeline + AI agent + CRM + custom dashboards. 12-month minimum.",
    Icon: Box,
  },
  {
    id: "pulse",
    name: "Pulse",
    tag: "Social-first",
    blurb: "Meta + YouTube + TikTok + creative. 6-month minimum.",
    Icon: Activity,
  },
];

export function ProgramsGridHome() {
  return (
    <section className="px-4 py-24 md:py-28">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center mb-12 md:mb-14">
          <span
            className="block font-semibold text-[40px] md:text-[56px] leading-none text-primary/30 tracking-tight mb-2"
            aria-hidden
          >
            04
          </span>
          <span className="block text-xs font-medium text-muted-foreground tracking-widest uppercase mb-3">
            Programs
          </span>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-semibold tracking-tight text-foreground leading-[1.15]">
            Pick the engagement that{" "}
            <span className="font-semibold text-primary">
              fits.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mt-5 max-w-2xl mx-auto">
            AEO is included in every tier. No pricing on the site - book a call
            and we&apos;ll quote against your market.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROGRAMS.map((p) => (
            <Link
              key={p.id}
              href={`/programs#${p.id}`}
              className={cn(
                "group block rounded-2xl border p-6 transition-all hover:-translate-y-0.5",
                p.featured
                  ? "bg-foreground text-background border-foreground hover:shadow-[var(--shadow-cta-strong)]"
                  : "bg-surface border-card-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={cn(
                    "w-10 h-10 rounded-lg grid place-items-center bg-primary-muted text-primary",
                  )}
                >
                  <p.Icon className="w-4.5 h-4.5" />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-full",
                    p.featured
                      ? "bg-primary-muted text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {p.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-1.5">
                {p.name}
              </h3>
              <p
                className={cn(
                  "text-sm leading-snug mb-4",
                  p.featured
                    ? "text-background/80"
                    : "text-muted-foreground",
                )}
              >
                {p.blurb}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium group-hover:translate-x-0.5 transition-transform",
                  p.featured ? "text-primary" : "text-primary",
                )}
              >
                Details <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Compare programs side by side
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
