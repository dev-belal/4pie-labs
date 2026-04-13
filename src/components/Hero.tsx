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
  loading: () => (
    <div className="w-full h-[420px] md:h-[520px] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  ),
});

export function Hero() {
  const { openContact } = useModals();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="hero-glow" />

      <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold leading-[1.05] mb-8"
        >
          Scale your operations <br />
          <span className="text-gradient">[10x]</span> without hiring{" "}
          <span className="text-white/50">[100]</span> people.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-lg md:text-xl text-white/60 mb-10 mx-auto"
        >
          Humans should do human work. AI should do everything else. We build
          the systems that make this happen for high-growth agencies.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            type="button"
            onClick={openContact}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-full text-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Start Your Automation
            <span className="relative w-5 h-5 overflow-hidden">
              <AnimatePresence mode="wait">
                {isHovered ? (
                  <motion.span
                    key="rocket"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    <Rocket className="w-5 h-5 text-primary" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="arrow"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
          <button
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 glass-morphism px-8 py-4 rounded-full text-lg font-bold hover:bg-white/5 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            Watch Video
          </button>
        </motion.div>

        {/* 3D interactive scene — react-three-fiber, lazy-loaded */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-4xl mx-auto"
          aria-hidden
        >
          <div className="absolute inset-x-0 top-1/4 -bottom-1/4 bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-10" />
          <HeroScene />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold mb-2">
                {stat.val}
              </div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
