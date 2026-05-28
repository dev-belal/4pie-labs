"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// PLACEHOLDER STATS: User will replace numbers and verify labels before public
// launch. Do not invent new numbers — keep these exact placeholder values.
const STATS = [
  { label: "Active Clients", val: "50+" },
  { label: "Average Lead Increase", val: "83%" },
  { label: "Monthly Searches Won", val: "115k" },
  { label: "Client Revenue Influenced", val: "$500k" },
];

/**
 * Phase 2 hero — type-only design (option (a)). The Phase 1 purple orb, the
 * 3D HeroScene backdrop, and the dark vignette overlay are all removed for
 * the warm light theme. Re-introduce a soft cream mesh (option b) or dot grid
 * (option c) here later if testing shows the hero feels too empty.
 *
 * PR #10's `useMediaQuery` swap is moot here because the 3D scene that needed
 * the `isDesktop` gate has been removed entirely.
 */
export function Hero() {
  return (
    <section className="relative pt-32 md:pt-40 pb-24 md:pb-32 px-4">
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[clamp(40px,6vw,56px)] font-display font-semibold leading-[1.1] mb-8 [text-wrap:balance] text-foreground"
        >
          Become the business everyone in your area{" "}
          <span className="text-gradient font-semibold">finds first.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-lg text-muted-foreground mb-10 mx-auto leading-relaxed"
        >
          4Pie Labs helps painting contractors, tour operators, and local
          service businesses dominate Google, Maps, and AI answer engines — so
          the next customer in your market calls you, not your competitor.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4"
        >
          <Link
            href="/book"
            className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-lg text-base font-medium transition-all hover:shadow-[0_2px_4px_rgba(124,92,255,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Book a Strategy Call
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* TODO: replace with /audit landing page in Phase 1F */}
          <Link
            href="/book?source=audit"
            className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors"
          >
            Get a free AI marketing audit
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Stats */}
      {/* PLACEHOLDER STATS: User will replace numbers and verify labels before public launch. Do not invent new numbers — keep these exact placeholder values. */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="relative z-10 mt-24 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
      >
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">
              {stat.val}
            </div>
            <div className="text-xs text-subtle-foreground uppercase tracking-wider font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
