"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
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
  X,
  type LucideIcon,
} from "lucide-react";
import { useDialogA11y } from "@/lib/use-dialog-a11y";

// Homepage-only service taxonomy for the local-services pivot. Each card
// opens a popup with `points` rendered as bulleted deliverables and a
// footer link to the matching dedicated landing page at /services/<slug>.

type PillarSlug = "aeo" | "ads" | "ai";

type HomeService = {
  title: string;
  desc: string;
  points: string[];
  icon: LucideIcon;
  color: string;
};

type Pillar = {
  label: string;
  slug: PillarSlug;
  subtitle: string;
  services: HomeService[];
};

const PILLARS: Pillar[] = [
  {
    label: "AI-First SEO + AEO",
    slug: "aeo",
    subtitle:
      "Win every search that matters, including the ones happening inside ChatGPT.",
    services: [
      {
        title: "Local SEO",
        desc: 'Rank in the top 3 for every search a customer in your area is making, Google, Maps, "near me" queries, and long-tail intent.',
        points: [
          "Technical site audit + on-page tuning for E-E-A-T",
          "Top-3 Maps pack rankings for your 50 highest-intent queries",
          "AI-powered keyword research + content cluster mapping",
          "High-authority backlinks targeted to your service area",
        ],
        icon: MapPin,
        color: "from-amber-500 to-orange-400",
      },
      {
        title: "Answer Engine Optimization",
        desc: "Get cited and recommended inside ChatGPT, Perplexity, Google AI Overviews, and Gemini. Most competitors don't even know this exists yet.",
        points: [
          "Schema + structured data engineered for AI retrieval",
          "Brand-entity consistency across the web",
          "AEO content pages that answer buyer questions cleanly",
          "Ongoing monitoring of citations across the four engines",
        ],
        icon: Sparkles,
        color: "from-amber-400 to-yellow-300",
      },
      {
        title: "Google Business Profile",
        desc: "A fully optimized GBP that wins the map pack, surfaces your best reviews, and drives calls directly from search.",
        points: [
          "Profile completeness + service-area + category optimization",
          "Review-velocity system that compounds month over month",
          "Weekly post + photo cadence tuned to local intent",
          "Q&A seeding so the right answers show up in the SERP",
        ],
        icon: Building2,
        color: "from-emerald-500 to-teal-400",
      },
      {
        title: "Content That Ranks",
        desc: "Monthly blog posts, project showcases, and location pages built around the exact searches your buyers run.",
        points: [
          "Voice-of-customer research + topical cluster planning",
          "Long-form pages tuned for both SEO and AEO retrieval",
          "Location pages for every service area you cover",
          "Quarterly performance review + content gap analysis",
        ],
        icon: FileText,
        color: "from-orange-500 to-amber-400",
      },
    ],
  },
  {
    label: "Performance Ads",
    slug: "ads",
    subtitle:
      "Predictable lead flow from every channel where your buyers are looking.",
    services: [
      {
        title: "Google Search + Maps Ads",
        desc: "AI-optimized bidding, ad copy, and targeting that put you at the top when buyer intent is highest.",
        points: [
          "Campaign structure tuned to your service area",
          "AI-driven bid management + automated script optimization",
          "Continuous ad copy testing + landing-page alignment",
          "Call tracking + conversion attribution",
        ],
        icon: Search,
        color: "from-blue-500 to-sky-400",
      },
      {
        title: "YouTube + Video Ads",
        desc: "Short-form ad creative engineered for local awareness and remarketing, designed to make you the obvious choice.",
        points: [
          "Scripted 15s / 30s creatives tuned to your category",
          "Awareness + remarketing layers wired together",
          "Cross-channel retargeting to compound recall",
          "Performance reporting at the campaign + creative level",
        ],
        icon: Play,
        color: "from-rose-500 to-red-400",
      },
      {
        title: "Meta + Social Ads",
        desc: "Facebook, Instagram, and TikTok campaigns built for service businesses, not generic e-commerce templates.",
        points: [
          "Lead-form + click campaigns calibrated per platform",
          "Creative production tuned to local-services buying patterns",
          "Audience segmentation by neighborhood, intent, and lookalike",
          "Weekly creative refresh to avoid fatigue",
        ],
        icon: Share2,
        color: "from-indigo-500 to-violet-400",
      },
      {
        title: "Custom Landing Pages",
        desc: "Each campaign gets its own landing page, built to convert, not a homepage that hopes for the best.",
        points: [
          "Conversion-tuned layout + copy per campaign",
          "Page-speed + Core Web Vitals optimized from day one",
          "A/B test infrastructure baked in",
          "Form / call tracking wired to the same dashboard as ads",
        ],
        icon: MousePointerClick,
        color: "from-purple-500 to-pink-400",
      },
    ],
  },
  {
    label: "Custom AI Systems",
    slug: "ai",
    subtitle:
      "The infrastructure that makes the rest of your marketing actually work.",
    services: [
      {
        title: "Tech-Forward Websites",
        desc: "Fast, mobile-first, conversion-optimized websites built like software, not like templates.",
        points: [
          "Next.js / React stack tuned for speed + AEO retrieval",
          "Schema graph + structured-data coverage out of the box",
          "Headless CMS so your team can edit without touching code",
          "Lead-capture forms wired to your CRM end-to-end",
        ],
        icon: Globe,
        color: "from-cyan-500 to-blue-400",
      },
      {
        title: "AI Agents for Your Business",
        desc: "Custom AI agents that answer inquiries 24/7, qualify leads, book appointments, and integrate with your CRM.",
        points: [
          "Trained on your brand voice and service catalog",
          "Lead-qualification + booking + handoff to humans",
          "Multi-channel: site chat, SMS, email, voice",
          "Private-cloud deployment for sensitive customer data",
        ],
        icon: Bot,
        color: "from-green-500 to-emerald-400",
      },
      {
        title: "CRM Automation",
        desc: "Lead capture → routing → follow-up → reporting, all wired together so no lead gets lost.",
        points: [
          "Integration with HubSpot / Pipedrive / GHL / JobTread / etc.",
          "Automated lead routing + SLA-based escalation",
          "Smart follow-up sequences across email + SMS + voice",
          "Cohort + funnel reporting at the channel level",
        ],
        icon: Workflow,
        color: "from-amber-500 to-orange-400",
      },
      {
        title: "Custom Dashboards",
        desc: "The same dashboards we use to manage your campaigns, available to you, your data, in one place, in real time.",
        points: [
          "Unified view of search + ads + AEO + CRM in real time",
          "Custom KPIs scoped to your business model",
          "Multi-location support for franchises + multi-market brands",
          "Exec-level + ops-level views, same data, different lens",
        ],
        icon: LayoutDashboard,
        color: "from-fuchsia-500 to-purple-400",
      },
    ],
  },
];

interface SelectedService {
  service: HomeService;
  pillar: Pillar;
}

export function Services() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<SelectedService | null>(null);
  const active = PILLARS[activeIndex];

  return (
    <section
      id="services"
      className="relative py-24 md:py-28 px-4 overflow-hidden"
    >
      <span
        aria-hidden
        className="absolute pointer-events-none -top-10 right-0 w-[500px] h-[500px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,155,124,0.20), transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
            The system
          </span>
          <h2 className="text-[clamp(32px,4.5vw,48px)] font-semibold tracking-tight text-foreground mb-5 leading-[1.1] [text-wrap:balance]">
            The services that build your{" "}
            <span className="font-semibold text-primary">local dominance.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Three pillars, twelve services, one system designed to make your
            business the obvious choice.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {PILLARS.map((pillar, i) => (
            <button
              type="button"
              key={pillar.label}
              onClick={() => setActiveIndex(i)}
              aria-pressed={activeIndex === i}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                activeIndex === i
                  ? "bg-primary-muted border-primary text-foreground"
                  : "bg-surface border-card-border text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {pillar.label}
            </button>
          ))}
        </div>

        <p className="text-center text-muted-foreground max-w-2xl mx-auto text-base mb-12">
          {active.subtitle}
        </p>

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {active.services.map((service) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={`${active.label}-${service.title}`}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 16 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    layout: { duration: 0.3 },
                    y: { duration: 0.25 },
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected({ service, pillar: active })}
                    className="group w-full h-full text-left bg-surface border border-card-border rounded-2xl p-7 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="w-11 h-11 rounded-xl grid place-items-center bg-primary-muted text-primary mb-5">
                      <Icon className="w-5 h-5" />
                    </span>

                    <h3 className="text-lg font-semibold tracking-tight text-foreground mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                      {service.desc}
                    </p>

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider group-hover:gap-2 transition-all">
                      Learn more
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/services/${active.slug}`}
            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3 rounded-lg text-sm font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
          >
            Explore {active.label}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-surface hover:bg-surface-2 border border-border text-foreground px-7 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            See all services
          </Link>
        </div>
      </div>

      <HomeServiceModal
        selected={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}

function HomeServiceModal({
  selected,
  onClose,
}: {
  selected: SelectedService | null;
  onClose: () => void;
}) {
  useDialogA11y(!!selected, onClose);

  return (
    <AnimatePresence>
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-service-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card-elevated)] overflow-hidden flex flex-col max-h-[88vh]"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-surface-2 hover:bg-surface text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="overflow-y-auto flex-1 p-7 md:p-9">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-12 h-12 rounded-xl grid place-items-center bg-primary-muted text-primary shrink-0">
                  <selected.service.icon className="w-5 h-5" />
                </span>
                <div>
                  <span className="block text-[10px] font-medium text-primary uppercase tracking-widest mb-0.5">
                    {selected.pillar.label}
                  </span>
                  <h2
                    id="home-service-title"
                    className="text-xl font-semibold tracking-tight text-foreground leading-tight"
                  >
                    {selected.service.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {selected.service.desc}
              </p>

              <div className="mb-6">
                <h3 className="text-[11px] font-medium text-subtle-foreground uppercase tracking-widest mb-3">
                  What&apos;s included
                </h3>
                <ul className="space-y-2.5">
                  {selected.service.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground/90 leading-snug">
                        {p}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-border p-5 md:p-6 bg-surface-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href={`/services/${selected.pillar.slug}`}
                onClick={onClose}
                className="group flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
              >
                View full {selected.pillar.label} page
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/book"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 bg-surface border border-border hover:bg-surface text-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Book a call
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
