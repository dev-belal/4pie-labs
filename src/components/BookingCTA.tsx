"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";

export function BookingCTA() {
  return (
    <section id="book-call" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-surface-2 rounded-2xl p-12 md:p-20 text-center border border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-muted text-primary text-xs font-medium tracking-widest uppercase mb-8">
              <Sparkles className="w-4 h-4" />
              Ready to grow?
            </div>

            <h2 className="text-[clamp(32px,4vw,40px)] font-display font-semibold mb-8 leading-tight text-foreground">
              Become the obvious choice{" "}
              <span className="text-gradient">in your market.</span>
            </h2>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
              Stop watching competitors outrank you. Book a free 30-minute
              strategy session and we&apos;ll show you exactly what&apos;s
              holding your business back — and what we&apos;d do about it.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/book"
                className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-lg text-base font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2"
              >
                <Calendar className="w-4 h-4" />
                Book a Strategy Call
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="text-sm text-muted-foreground max-w-xs sm:text-left text-center">
                No pitch, no pressure. Just a real conversation about your
                market.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
