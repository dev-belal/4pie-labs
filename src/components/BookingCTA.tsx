"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, Phone, Sparkles } from "lucide-react";

export function BookingCTA() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section id="book-call" className="py-24 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="glass-morphism rounded-[48px] p-12 md:p-20 text-center border-foreground/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-foreground/10 text-primary text-xs font-bold tracking-widest uppercase mb-8">
              <Sparkles className="w-4 h-4" />
              Ready to grow?
            </div>

            <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-tight">
              Become the obvious choice{" "}
              <span className="text-gradient">in your market.</span>
            </h2>

            <p className="text-foreground/50 text-xl max-w-2xl mx-auto mb-12">
              Stop watching competitors outrank you. Book a free 30-minute
              strategy session and we&apos;ll show you exactly what&apos;s
              holding your business back — and what we&apos;d do about it.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/book"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <Calendar className="w-5 h-5" />
                Book a Strategy Call
                <span className="relative w-5 h-5 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {isHovered ? (
                      <motion.span
                        key="phone"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <Phone className="w-5 h-5 text-primary" />
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
              </Link>

              <p className="text-sm text-foreground/40 font-medium max-w-xs sm:text-left text-center">
                No pitch, no pressure. Just a real conversation about your
                market.
              </p>
            </div>
          </motion.div>

          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent blur-2xl -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>
    </section>
  );
}
