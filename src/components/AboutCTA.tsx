"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useModals } from "./modal-provider";

export function AboutCTA() {
  const { openContact } = useModals();

  return (
    <section className="relative z-10 max-w-3xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-surface border border-card-border rounded-2xl p-10 md:p-14 shadow-[0_4px_12px_rgba(26,26,26,0.06),0_1px_3px_rgba(26,26,26,0.04)]"
      >
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-3 [text-wrap:balance]">
          Ready to be the{" "}
          <span className="font-semibold text-primary">
            first call
          </span>{" "}
          in your market?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Book a 30-minute strategy call or grab a free 12-point audit. Either
          way, you leave with a plan.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/book"
            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-lg text-base font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
          >
            Book a strategy call
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            type="button"
            onClick={openContact}
            className="inline-flex items-center gap-2 bg-surface hover:bg-surface-2 border border-border text-foreground px-7 py-3.5 rounded-lg text-base font-medium transition-colors"
          >
            Talk to us
          </button>
        </div>
      </motion.div>
    </section>
  );
}
