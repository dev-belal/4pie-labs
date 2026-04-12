import type { Metadata } from "next";
import Image from "next/image";
import {
  Bot,
  Megaphone,
  Palette,
  Quote,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { AboutCTA } from "@/components/AboutCTA";

export const metadata: Metadata = {
  title: "About",
  description:
    "Built by builders, powered by obsession. Meet the team behind 4Pie Labs — AI automation, design, and digital marketing for modern agencies.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About 4Pie Labs",
    description:
      "Built by builders, powered by obsession. Meet the team behind 4Pie Labs.",
    url: "/about",
    type: "website",
  },
};

interface Pillar {
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

const pillars: Pillar[] = [
  {
    title: "AI Automation",
    desc: "We build intelligent systems that automate repetitive workflows, deploy autonomous agents, and integrate AI into every layer of your operations — so your team can focus on what humans do best.",
    icon: Bot,
    color: "from-blue-500 to-cyan-400",
  },
  {
    title: "Design Creatives",
    desc: "From brand identity to high-converting ad creatives, our design team produces premium visual assets at scale — powered by AI-enhanced workflows and a relentless eye for detail.",
    icon: Palette,
    color: "from-pink-500 to-rose-400",
  },
  {
    title: "Digital Marketing",
    desc: "Data-driven growth strategies across SEO, PPC, social media, and email marketing. We don't just run campaigns — we engineer predictable, scalable customer acquisition systems.",
    icon: Megaphone,
    color: "from-purple-500 to-indigo-400",
  },
];

const milestones = [
  { year: "2021", label: "Started as a Front-End Developer" },
  { year: "2023", label: "Transitioned to AI Automation" },
  { year: "2024", label: "Founded 4Pie Labs" },
  { year: "2025", label: "Expanded into Digital Marketing" },
  { year: "Now", label: "Full-service AI & Design Agency" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto mb-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-morphism text-xs font-bold uppercase tracking-widest text-white/50 mb-8">
            <Rocket className="w-3.5 h-3.5 text-primary" />
            About 4Pie Labs
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
            Built by builders. <br />
            <span className="text-white/50">Powered by obsession.</span>
          </h1>
          <p className="text-white/40 max-w-2xl mx-auto text-lg">
            We&apos;re not another agency that bolts AI onto old processes. We
            rethink the entire system from scratch.
          </p>
        </div>
      </div>

      <section className="max-w-7xl mx-auto mb-32">
        <div className="relative glass-morphism rounded-[40px] border-white/10 overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-[40%] relative">
              <div className="relative h-[400px] lg:h-full min-h-[500px] overflow-hidden">
                <Image
                  src="/founder.jpg"
                  alt="Syed Belal — Founder of 4Pie Labs"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-top"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background hidden lg:block" />
                <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black via-black/70 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 lg:bottom-8 lg:left-8 lg:right-8 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-white via-white/80 to-white bg-clip-text text-transparent">
                      Syed Belal
                    </h3>
                    <p className="text-white/50 text-sm font-medium">
                      Founder &amp; CEO, 4Pie Labs
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://www.instagram.com/devbelaal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white transition-all duration-300 hover:text-[#E4405F] hover:drop-shadow-[0_0_8px_rgba(225,48,108,0.8)]"
                      aria-label="Instagram"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/syedbilalraza"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white transition-all duration-300 hover:text-[#0A66C2] hover:drop-shadow-[0_0_8px_rgba(10,102,194,0.8)]"
                      aria-label="LinkedIn"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                    <a
                      href="https://www.x.com/devbelaal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white transition-all duration-300 hover:text-gray-400 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      aria-label="X"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      href="https://www.youtube.com/@devbelaal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white transition-all duration-300 hover:text-[#FF0000] hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]"
                      aria-label="YouTube"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-[60%] p-10 lg:p-16 flex flex-col justify-center">
              <div className="mb-8">
                <Quote className="w-10 h-10 text-primary/30 mb-4" />
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  Founder&apos;s Message
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
              </div>

              <div className="space-y-5 text-white/60 leading-relaxed">
                <p>
                  My journey into the world of technology started over five
                  years ago as a{" "}
                  <strong className="text-white/80">Front-End Developer</strong>
                  . For two years, I built interfaces, learned to think in
                  systems, and developed a deep appreciation for clean,
                  functional design.
                </p>
                <p>
                  Then everything changed. I discovered the world of{" "}
                  <strong className="text-white/80">AI Automation</strong> —
                  and more specifically, the work of people like{" "}
                  <strong className="text-white/80">Liam Ottley</strong> and{" "}
                  <strong className="text-white/80">Nate Herk</strong>, who
                  showed me what was truly possible when you combine AI with
                  agency operations. Their vision of building autonomous
                  systems that replace entire manual workflows became the north
                  star of my career.
                </p>
                <p>
                  Over the next three years, I went deep — building AI-powered
                  solutions for businesses, deploying autonomous agents, and
                  automating processes that used to take teams of people to
                  manage. That experience eventually led me to found{" "}
                  <strong className="text-white/80">4Pie Labs</strong> as an AI
                  Automation and Design Agency.
                </p>
                <p>
                  As we grew, a natural evolution happened. Our clients
                  didn&apos;t just need automation and design — they needed
                  full-stack growth. So we expanded into{" "}
                  <strong className="text-white/80">Digital Marketing</strong>,
                  bringing the same systems-thinking and data-driven approach
                  to SEO, PPC, and social media. Today, 4Pie Labs is a fully
                  integrated agency where AI, design, and marketing work
                  together as one system.
                </p>
                <p className="text-white/80 font-medium italic">
                  We&apos;re just getting started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            The Journey
          </h2>
          <p className="text-white/40">From code to company.</p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />

          <div className="space-y-0">
            {milestones.map((m, i) => (
              <div
                key={m.label}
                className={`flex items-center gap-6 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
              >
                <div className={`flex-1 ${i % 2 === 0 ? "text-right" : "text-left"}`}>
                  <div className="text-primary font-bold text-sm uppercase tracking-widest">
                    {m.year}
                  </div>
                  <div className="text-white/70 font-medium">{m.label}</div>
                </div>
                <div className="relative z-10 w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto mb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Three pillars. <br />
            <span className="text-white/50">One vision.</span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-lg">
            Everything we build is designed to make agencies autonomous,
            creative, and unstoppable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group glass-morphism p-10 rounded-[32px] border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.color} p-0.5 mb-8 group-hover:scale-110 transition-transform`}
                >
                  <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                    <Icon className="w-7 h-7" />
                  </div>
                </div>
                <h3 className="text-2xl font-display font-bold mb-4 relative z-10">
                  {pillar.title}
                </h3>
                <p className="text-white/50 leading-relaxed relative z-10">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <AboutCTA />
    </div>
  );
}
