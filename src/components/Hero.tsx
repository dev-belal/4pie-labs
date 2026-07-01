"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight } from "lucide-react";

// three.js touches window at module-eval time, so HeroScene3D must never SSR.
// Loading: nothing - the AEO card overlay carries the right column on its own
// while the 3D chunk streams in.
const HeroScene3D = dynamic(() => import("./HeroScene3D"), {
  ssr: false,
  loading: () => null,
});

// Phase 3 stats numbers from the v2 design (placeholder - replace before launch).
const STATS = [
  { label: "Active client engagements", val: "11" },
  { label: "Avg. qualified lead increase, 90 days", val: "3.4×" },
  { label: "Monthly local searches won for clients", val: "142K" },
  { label: "Client revenue influenced in 2025", val: "$8.2M" },
];

/**
 * Phase 3 hero - copy on the left, a floating "Live · AEO citations rising"
 * card on the right (desktop); single column on mobile. The Instrument Serif
 * italic accent on "first." is the visual hook. Local depth blobs add
 * atmosphere; the R3F 3D scene sits behind the right column.
 *
 * IMPORTANT LCP note: the six above-the-fold elements below (eyebrow, H1,
 * subhead, CTA row, trust strip, right column) render as plain HTML with
 * NO framer-motion entrance animation. The previous motion.* wrappers
 * had `initial={{ opacity: 0, ... }}` which made the LCP element (the
 * H1) invisible in the SSR paint - the browser could not count LCP
 * until React hydrated + framer-motion loaded + the animation
 * completed, producing an 11.5s mobile LCP. Keeping these as static
 * elements means they paint in the first frame of the SSR HTML. The
 * stats bar below (`whileInView`) still animates because it lives
 * below the fold and its scroll-trigger doesn't hide the LCP element.
 */
export function Hero() {
  return (
    <section className="relative pt-12 md:pt-20 pb-24 md:pb-28 px-4 overflow-hidden">
      {/* Local hero depth blobs */}
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
        className="absolute pointer-events-none -bottom-20 -right-20 w-[380px] h-[380px] rounded-full opacity-55 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,155,124,0.32), transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto">
        <div className="grid md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-center">
          {/* Copy column */}
          <div>
            <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-5">
              AI-first marketing · for local service businesses
            </span>

            <h1 className="text-[clamp(40px,6vw,64px)] font-semibold leading-[1.05] tracking-tight text-foreground [text-wrap:balance]">
              Become the business everyone in your area finds{" "}
              <span className="font-semibold text-primary">
                first.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed">
              4Pie Labs helps painting contractors, tour operators, and local
              service businesses dominate Google, Maps, and AI answer engines -
              so the next customer in your market calls{" "}
              <em className="text-primary not-italic font-medium">you</em>, not
              your competitor.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
              <Link
                href="/book"
                className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-lg text-base font-semibold transition-all hover:shadow-[var(--shadow-cta-strong)] shadow-[var(--shadow-cta)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-5 text-sm text-muted-foreground">
              <span>30-min call</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>No pitch deck</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Leave with a plan, free</span>
            </div>
          </div>

          {/* 3D scene + Live AEO card overlay (desktop only) */}
          <div
            className="hidden md:block relative min-h-[460px] lg:min-h-[520px]"
            aria-hidden
          >
            {/* R3F icosahedron + violet sphere + orbit rings + particles */}
            <div className="absolute inset-0">
              <HeroScene3D />
            </div>

            {/* Top-right "Live · AEO citations rising" pill */}
            <div className="absolute top-2 right-0 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur border border-card-border text-xs font-medium text-foreground shadow-[0_1px_3px_rgba(26,26,26,0.05)]">
              <span className="relative w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-70" />
                <span className="absolute inset-0 rounded-full bg-success" />
              </span>
              Live · AEO citations rising
            </div>

            {/* Bottom card */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-surface/90 backdrop-blur border border-card-border rounded-2xl p-5 shadow-[var(--shadow-card)] flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-primary-muted text-primary grid place-items-center shrink-0">
                <Activity className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  +18 citations this week
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ChatGPT · Perplexity · Gemini
                </div>
              </div>
              <Link
                href="/services/aeo"
                className="text-xs font-medium text-primary hover:underline shrink-0"
              >
                View →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 max-w-[1240px] mx-auto mt-20 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10"
      >
        {STATS.map((s) => (
          <div key={s.label} className="text-center md:text-left">
            <div className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-2">
              {s.val}
            </div>
            <div className="text-xs text-subtle-foreground uppercase tracking-wider font-medium leading-snug">
              {s.label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
