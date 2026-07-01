"use client";

import { useEffect, useState } from "react";
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
  // Two-part 3D-scene bring-up:
  //
  // 1. PRELOAD the chunk as soon as the client-side Hero mounts. The
  //    plain `import("./HeroScene3D")` call kicks off the network
  //    fetch + parse of the three.js bundle in parallel with
  //    hydration + first paint. Module loader dedupes against
  //    next/dynamic's own import above, so the chunk downloads
  //    exactly once and both imports see the same module.
  //
  // 2. MOUNT after the first paint commits, via double
  //    requestAnimationFrame. First rAF fires before next paint;
  //    second fires after that paint lands - so the <img> poster
  //    (LCP anchor) + all above-the-fold text are already on-screen
  //    before we flip mount3D. Since the chunk is already
  //    downloading from step 1, React's dynamic() import in the
  //    render tree resolves instantly (cache hit) and the scene
  //    fades in the moment WebGL init finishes.
  //
  // Previous version (5b8d4b1) only did step 2, so mount3D flipped
  // fast but the chunk download only started THEN - user saw a
  // multi-second gap while three.js was fetched over the network.
  const [mount3D, setMount3D] = useState(false);
  useEffect(() => {
    // Fire-and-forget preload. Cache hit for the render-time import.
    // If the component unmounts before the promise resolves the
    // module stays in the loader cache; nothing to clean up.
    void import("./HeroScene3D");

    let secondRafId: number | null = null;
    const firstRafId = window.requestAnimationFrame(() => {
      secondRafId = window.requestAnimationFrame(() => setMount3D(true));
    });
    return () => {
      window.cancelAnimationFrame(firstRafId);
      if (secondRafId != null) window.cancelAnimationFrame(secondRafId);
    };
  }, []);

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

          {/* 3D scene + Live AEO card overlay (desktop only).
              NOTE the outer wrapper is NOT aria-hidden - it contains
              real overlays (the "Live · AEO citations rising" pill
              and the "+18 citations this week" card whose "View →"
              link is keyboard-focusable). Only the truly decorative
              children below (poster img + Canvas) carry
              aria-hidden="true". Lighthouse's aria-hidden-focus rule
              triggers when a focusable element sits inside an
              aria-hidden subtree; keeping aria-hidden off the parent
              and pushing it down to just the decorative bits
              resolves it while still hiding the visual chrome from
              AT. */}
          <div className="hidden md:block relative min-h-[460px] lg:min-h-[520px]">
            {/* Static "amber sphere" poster — an <img> (not a CSS
                gradient div) so it's a valid LCP candidate under
                Chrome's LCP algorithm. Rendered as an inline SVG
                data-URI so there's zero network cost and the whole
                poster lives in the SSR HTML for first-paint. The
                Canvas below uses alpha:true and mounts on top; where
                the icosahedron renders opaquely it covers this poster,
                where it's transparent the amber glow shows through as
                intended. Once Lighthouse registers this <img> as the
                LCP element at first paint, the later-mounting Canvas
                (same size, same container) doesn't reset the LCP
                timestamp - which is the whole point of anchoring on
                an <img> instead of a gradient <div>. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data-URI, no external asset to route through next/image */}
            <img
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
              src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><radialGradient id='g' cx='50%' cy='45%'><stop offset='0%' stop-color='%23fbbf24'/><stop offset='22%' stop-color='%23fbbf24' stop-opacity='0.45'/><stop offset='45%' stop-color='%23fbbf24' stop-opacity='0.12'/><stop offset='65%' stop-color='%23fbbf24' stop-opacity='0'/></radialGradient></defs><rect width='400' height='500' fill='url(%23g)'/></svg>"
            />

            {/* R3F icosahedron + violet sphere + orbit rings + particles.
                Wrapper is always present so layout is stable; the actual
                HeroScene3D render is gated behind `mount3D` so the
                three.js chunk parse + WebGL setup happens after the
                browser has been idle. `transition-opacity` gives the
                scene a soft fade-in when it finally mounts, so the swap
                from poster-only to poster+canvas isn't abrupt. */}
            <div
              className={`absolute inset-0 transition-opacity duration-[350ms] ${
                mount3D ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            >
              {mount3D ? <HeroScene3D /> : null}
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
