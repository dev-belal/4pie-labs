"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play, Rocket } from "lucide-react";
import { useModals } from "./modal-provider";

const STATS = [
  { label: "Successful Deployments", val: "50+" },
  { label: "Reduction in processing time", val: "83%" },
  { label: "Hours automated for clients", val: "115k" },
  { label: "Cost savings delivered", val: "$2.4M" },
];

// three.js touches `window` at module-eval time, so the scene must never
// render on the server. ssr:false is only legal from a client component
// in App Router — Hero already has 'use client'.
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

export function Hero() {
  const { openContact } = useModals();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative pt-32 pb-24 overflow-hidden min-h-[85vh] flex flex-col justify-center">
      {/* Layer 1 — soft brand glow */}
      <div className="hero-glow" />

      {/* Layer 2 — full-bleed 3D background scene */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <HeroScene />
      </div>

      {/* Layer 3 — radial vignette + subtle bottom fade for text legibility */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 55%, transparent 80%), linear-gradient(to bottom, transparent 60%, var(--color-background) 100%)",
        }}
      />

      {/* Layer 4 — content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-morphism border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase text-white/70 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI Automation · Design · Marketing
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[1.05] tracking-tight mb-8 [text-wrap:balance]"
        >
          Scale your operations{" "}
          <span className="text-gradient font-bold">10×</span>
          <br className="hidden sm:block" /> without hiring{" "}
          <span className="text-white/40 font-light italic">100</span> people.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-xl text-base md:text-lg text-white/60 mb-10 mx-auto leading-relaxed"
        >
          Humans should do human work. AI should do everything else. We build
          the systems that make this happen for high-growth agencies.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={openContact}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-black px-7 py-3.5 rounded-full text-base font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Start Your Automation
            <span className="relative w-4 h-4 overflow-hidden">
              <AnimatePresence mode="wait">
                {isHovered ? (
                  <motion.span
                    key="rocket"
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    <Rocket className="w-4 h-4 text-primary" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="arrow"
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
          <button
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 glass-morphism border-white/10 px-7 py-3.5 rounded-full text-base font-bold hover:bg-white/5 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Video
          </button>
        </motion.div>
      </div>

      {/* Stats — clear of the 3D, sits on the bottom fade */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="relative z-10 mt-20 max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8"
      >
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl md:text-3xl font-display font-bold mb-1.5">
              {stat.val}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
