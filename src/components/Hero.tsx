"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play, Rocket } from "lucide-react";
import { useModals } from "./modal-provider";

const STATS = [
  { label: "Successful Deployments", val: "50+" },
  { label: "Reduction in processing time", val: "83%" },
  { label: "Hours automated for clients", val: "115k" },
  { label: "Cost savings delivered", val: "$2.4M" },
];

export function Hero() {
  const { openContact } = useModals();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="hero-glow" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0">
          <div className="w-full lg:w-[60%] text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight mb-8"
            >
              Scale your operations <br />
              <span className="text-gradient">[10x]</span> without hiring <br />
              <span className="text-white/50">[100]</span> people.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl lg:max-w-xl text-lg md:text-xl text-white/60 mb-10 mx-auto lg:mx-0"
            >
              Humans should do human work. AI should do everything else. We
              build the systems that make this happen for high-growth agencies.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
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
          </div>

          {/*
            3D interactive element slot.
            Spline was removed in the Next.js migration. Drop the replacement
            3D component here (expected: fills the aspect, self-contained).
            Hidden on mobile for performance budget.
          */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex w-full lg:w-[40%] h-[500px] xl:h-[600px] relative items-center justify-center"
          >
            <div className="relative w-full h-full rounded-[40px] border border-dashed border-white/10 glass-morphism flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
              <div className="relative z-10 text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center">
                  <Rocket className="w-7 h-7 text-primary" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-2">
                  3D slot
                </p>
                <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed">
                  Interactive 3D element goes here. Swap this placeholder for
                  the new visual once chosen.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8"
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
