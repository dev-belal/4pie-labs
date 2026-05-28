"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  FileText,
  Globe,
  LayoutDashboard,
  MapPin,
  MousePointerClick,
  Play,
  Search,
  Share2,
  Sparkles,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Homepage-only service taxonomy for the local-services pivot. Kept local to
// this component on purpose: the shared `@/data/services` powers the /services
// page + footer (out of scope for this PR), so we don't touch it here.
type HomeService = {
  title: string;
  desc: string;
  slug: string;
  icon: LucideIcon;
  color: string;
};

type Pillar = {
  label: string;
  subtitle: string;
  services: HomeService[];
};

const PILLARS: Pillar[] = [
  {
    label: "AI-First SEO + AEO",
    subtitle:
      "Win every search that matters — including the ones happening inside ChatGPT.",
    services: [
      {
        title: "Local SEO",
        slug: "local-seo",
        desc: 'Rank in the top 3 for every search a customer in your area is making — Google, Maps, "near me" queries, and long-tail intent.',
        icon: MapPin,
        color: "from-blue-500 to-cyan-400",
      },
      {
        title: "Answer Engine Optimization",
        slug: "aeo",
        desc: "Get cited and recommended inside ChatGPT, Perplexity, Google AI Overviews, and Gemini. Most competitors don't even know this exists yet.",
        icon: Sparkles,
        color: "from-violet-500 to-purple-400",
      },
      {
        title: "Google Business Profile",
        slug: "gbp",
        desc: "A fully optimized GBP that wins the map pack, surfaces your best reviews, and drives calls directly from search.",
        icon: Building2,
        color: "from-emerald-500 to-teal-400",
      },
      {
        title: "Content That Ranks",
        slug: "content",
        desc: "Monthly blog posts, project showcases, and location pages built around the exact searches your buyers run.",
        icon: FileText,
        color: "from-orange-500 to-amber-400",
      },
    ],
  },
  {
    label: "Performance Ads",
    subtitle:
      "Predictable lead flow from every channel where your buyers are looking.",
    services: [
      {
        title: "Google Search + Maps Ads",
        slug: "google-ads",
        desc: "AI-optimized bidding, ad copy, and targeting that put you at the top when buyer intent is highest.",
        icon: Search,
        color: "from-blue-500 to-sky-400",
      },
      {
        title: "YouTube + Video Ads",
        slug: "video-ads",
        desc: "Short-form ad creative engineered for local awareness and remarketing — designed to make you the obvious choice.",
        icon: Play,
        color: "from-rose-500 to-red-400",
      },
      {
        title: "Meta + Social Ads",
        slug: "social-ads",
        desc: "Facebook, Instagram, and TikTok campaigns built for service businesses, not generic e-commerce templates.",
        icon: Share2,
        color: "from-indigo-500 to-violet-400",
      },
      {
        title: "Custom Landing Pages",
        slug: "landing-pages",
        desc: "Each campaign gets its own landing page, built to convert — not a homepage that hopes for the best.",
        icon: MousePointerClick,
        color: "from-purple-500 to-pink-400",
      },
    ],
  },
  {
    label: "Custom AI Systems",
    subtitle:
      "The infrastructure that makes the rest of your marketing actually work.",
    services: [
      {
        title: "Tech-Forward Websites",
        slug: "websites",
        desc: "Fast, mobile-first, conversion-optimized websites built like software, not like templates.",
        icon: Globe,
        color: "from-cyan-500 to-blue-400",
      },
      {
        title: "AI Agents for Your Business",
        slug: "ai-agents",
        desc: "Custom AI agents that answer inquiries 24/7, qualify leads, book appointments, and integrate with your CRM.",
        icon: Bot,
        color: "from-green-500 to-emerald-400",
      },
      {
        title: "CRM Automation",
        slug: "crm-automation",
        desc: "Lead capture → routing → follow-up → reporting, all wired together so no lead gets lost.",
        icon: Workflow,
        color: "from-amber-500 to-orange-400",
      },
      {
        title: "Custom Dashboards",
        slug: "dashboards",
        desc: "The same dashboards we use to manage your campaigns, available to you — your data, in one place, in real time.",
        icon: LayoutDashboard,
        color: "from-fuchsia-500 to-purple-400",
      },
    ],
  },
];

export function Services() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = PILLARS[activeIndex];

  return (
    <section
      id="services"
      className="py-24 px-4 bg-background overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            The services that build <br />
            <span className="text-foreground/50">your local dominance.</span>
          </h2>
          <p className="text-foreground/40 max-w-2xl mx-auto text-lg mb-12">
            Three pillars, twelve services, one system designed to make your
            business the obvious choice.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {PILLARS.map((pillar, i) => (
              <button
                type="button"
                key={pillar.label}
                onClick={() => setActiveIndex(i)}
                aria-pressed={activeIndex === i}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeIndex === i
                    ? "bg-primary text-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "glass-morphism text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {pillar.label}
              </button>
            ))}
          </div>

          <p className="text-foreground/50 max-w-2xl mx-auto text-base mb-16">
            {active.subtitle}
          </p>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {active.services.map((service) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={`${active.label}-${service.title}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    layout: { duration: 0.3 },
                    y: { duration: 0.3 },
                  }}
                >
                  <Link
                    href={`/services#${service.slug}`}
                    className="group relative p-8 glass-morphism rounded-[32px] border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.07] transition-all cursor-pointer overflow-hidden shadow-2xl text-left flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${service.color} p-0.5 mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    <h3 className="text-xl font-display font-bold mb-4">
                      {service.title}
                    </h3>
                    <p className="text-foreground/50 text-sm leading-relaxed mb-6 flex-1">
                      {service.desc}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold text-foreground/30 group-hover:text-foreground transition-colors">
                      LEARN MORE
                      <Zap className="w-3 h-3" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <div className="mt-16 text-center">
          <Link
            href="/services"
            className="group inline-flex items-center gap-3 mx-auto bg-foreground/5 hover:bg-foreground/10 text-foreground px-10 py-5 rounded-full text-lg font-bold transition-all border border-foreground/10 hover:border-foreground/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            See all Services
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
