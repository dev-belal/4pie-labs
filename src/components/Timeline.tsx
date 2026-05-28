"use client";

import { type MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  Megaphone,
  Search,
  Sparkles,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface Step {
  week: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    week: "Week 1",
    title: "Discovery & Audit",
    desc: "We map your current presence (Google, Maps, GBP, AI engines, ads) against your top competitors and your top 50 buyer queries. You see exactly where you're losing — and what's possible.",
    icon: Search,
  },
  {
    week: "Week 2",
    title: "Foundation Build",
    desc: "Website, technical SEO, GBP, tracking, and landing pages set up correctly the first time. No legacy junk carried forward.",
    icon: Wrench,
  },
  {
    week: "Week 3–4",
    title: "AEO + Content Engine",
    desc: "Your business gets structured for AI answer engines and search engines simultaneously. First wave of content, schema, and citations go live.",
    icon: Sparkles,
  },
  {
    week: "Week 5–8",
    title: "Ads Launch + Optimization",
    desc: "Campaigns go live with AI-optimized bidding and creative. Daily monitoring, weekly tuning. Lead flow begins.",
    icon: Megaphone,
  },
  {
    week: "Week 9–12",
    title: "Scale & Compound",
    desc: "Rankings climb, ad efficiency improves, and the AI lead-handling layer comes online. From here, every additional week compounds.",
    icon: TrendingUp,
  },
];

/**
 * Respect the OS-level "reduce motion" preference. When on, we skip the
 * mouse-follow 3D tilt entirely — both for accessibility (vestibular
 * disorders) and to avoid jank on low-end devices that tend to match
 * this setting by default.
 */
function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

function TimelineCard({ step, index }: { step: Step; index: number }) {
  const reduced = usePrefersReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = step.icon;

  return (
    <div
      className={`flex flex-col md:flex-row items-center gap-8 md:gap-0 ${
        index % 2 === 0 ? "md:flex-row-reverse" : ""
      }`}
      style={{ perspective: "1000px" }}
    >
      <div className="flex-1 md:w-1/2 px-4 md:px-12 text-center md:text-left">
        <motion.div
          onMouseMove={reduced ? undefined : handleMouseMove}
          onMouseLeave={reduced ? undefined : handleMouseLeave}
          style={{
            rotateX: reduced ? "0deg" : rotateX,
            rotateY: reduced ? "0deg" : rotateY,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="group relative p-8 glass-morphism rounded-[32px] border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.07] transition-colors shadow-2xl cursor-default transform-gpu"
        >
          <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
            <div className="text-primary font-bold mb-2 tracking-widest uppercase text-xs">
              {step.week}
            </div>
            <h3 className="text-2xl font-display font-bold mb-4">{step.title}</h3>
            <p className="text-foreground/50 leading-relaxed text-sm">{step.desc}</p>
          </div>
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </div>

      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-4 border-primary/30 shadow-[var(--shadow-dot-glow)]">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 md:w-1/2" />
    </div>
  );
}

export function Timeline() {
  return (
    <section className="py-24 px-4 bg-background border-t border-foreground/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[130px] rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-20">
          <div className="text-xs font-bold text-foreground/30 uppercase tracking-[0.2em] mb-4">
            Ready to rank?
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            From signed to ranked <br />
            <span className="text-foreground/50">— in 90 days.</span>
          </h2>
          <p className="text-foreground/40 max-w-2xl mx-auto text-lg">
            A structured rollout designed to compound from week one.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/10 -translate-x-1/2 hidden md:block" />

          <div className="space-y-12 md:space-y-0">
            {steps.map((step, i) => (
              <TimelineCard key={step.title} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
