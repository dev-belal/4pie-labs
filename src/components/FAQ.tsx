"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { faqs } from "@/data/faqs";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative py-24 md:py-28 px-4 border-t border-border overflow-hidden"
    >
      <span
        aria-hidden
        className="absolute pointer-events-none top-10 -left-20 w-[400px] h-[400px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(217,119,6,0.20), transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
            Common questions
          </span>
          <h2 className="text-[clamp(32px,4vw,44px)] font-semibold tracking-tight text-foreground leading-[1.1] [text-wrap:balance]">
            Frequently asked{" "}
            <span className="font-semibold text-primary">questions.</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.q}
                className="bg-surface border border-card-border rounded-xl overflow-hidden shadow-[var(--shadow-card)]"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full p-5 md:p-6 text-left flex items-start justify-between gap-4 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset transition-colors"
                >
                  <span className="text-base font-semibold text-foreground tracking-tight pr-4">
                    {faq.q}
                  </span>
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full grid place-items-center transition-colors ${
                      isOpen
                        ? "bg-primary-muted text-primary"
                        : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    <Plus
                      className={`w-3.5 h-3.5 transition-transform ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    />
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6 text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
