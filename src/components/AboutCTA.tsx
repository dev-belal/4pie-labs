"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useModals } from "./modal-provider";

export function AboutCTA() {
  const { openContact } = useModals();

  return (
    <section className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass-morphism rounded-[40px] p-16 border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 relative z-10">
          Ready to build the future?
        </h2>
        <p className="text-white/50 mb-8 relative z-10">
          Let&apos;s talk about how 4Pie Labs can transform your agency
          operations.
        </p>
        <button
          type="button"
          onClick={openContact}
          className="relative z-10 flex items-center gap-3 mx-auto bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
          Start Your Automation
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </section>
  );
}
