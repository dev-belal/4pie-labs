"use client";

import type { MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Code,
  Rocket,
  Search,
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
    desc: "We dive deep into your manual workflows to find the biggest leverage points for automation.",
    icon: Search,
  },
  {
    week: "Week 1",
    title: "Architecture Design",
    desc: "Designing the custom AI Operating System tailored to your specific agency needs.",
    icon: Code,
  },
  {
    week: "Week 2-3",
    title: "Development & Integration",
    desc: "Building and integrating the automation layers into your existing tech stack.",
    icon: Rocket,
  },
  {
    week: "Week 4",
    title: "Testing & Refinement",
    desc: "Rigorous testing to ensure 99.9% reliability and accuracy across all automated systems.",
    icon: CheckCircle2,
  },
  {
    week: "Week 5",
    title: "Deployment & Scaling",
    desc: "Going live and training your team on how to manage their new autonomous systems.",
    icon: Calendar,
  },
];

function TimelineCard({ step, index }: { step: Step; index: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
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
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="group relative p-8 glass-morphism rounded-[32px] border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-colors shadow-2xl cursor-default"
        >
          <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
            <div className="text-primary font-bold mb-2 tracking-widest uppercase text-xs">
              {step.week}
            </div>
            <h3 className="text-2xl font-display font-bold mb-4">{step.title}</h3>
            <p className="text-white/50 leading-relaxed text-sm">{step.desc}</p>
          </div>
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </div>

      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-4 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 md:w-1/2" />
    </div>
  );
}

export function Timeline() {
  return (
    <section className="py-24 px-4 bg-background border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[130px] rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Lightning-quick <br />
            <span className="text-white/50">deployment.</span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-lg">
            From manual bottleneck to autonomous operation in just 5 weeks.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2 hidden md:block" />

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
