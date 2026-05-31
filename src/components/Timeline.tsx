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
    desc: "We map your current presence (Google, Maps, GBP, AI engines, ads) against your top competitors and your top 50 buyer queries. You see exactly where you're losing, and what's possible.",
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

function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

function TimelineCard({ step, index }: { step: Step; index: number }) {
  const reduced = usePrefersReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

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
          className="group relative p-7 md:p-8 bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow cursor-default transform-gpu"
        >
          <div
            style={{ transform: "translateZ(40px)" }}
            className="relative z-10"
          >
            <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-3">
              {step.week}
            </span>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
              {step.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {step.desc}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary/40 shadow-[var(--shadow-dot-glow)] shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 md:w-1/2" />
    </div>
  );
}

export function Timeline() {
  return (
    <section className="relative py-24 md:py-28 px-4 border-t border-border overflow-hidden">
      <span
        aria-hidden
        className="absolute pointer-events-none top-10 right-0 w-[500px] h-[500px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.20), transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
            Ready to rank?
          </span>
          <h2 className="text-[clamp(32px,4.5vw,48px)] font-semibold tracking-tight text-foreground mb-5 leading-[1.1] [text-wrap:balance]">
            From signed to ranked{" "}
            <span className="font-semibold text-primary">in 90 days.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A structured rollout designed to compound from week one.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />

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
