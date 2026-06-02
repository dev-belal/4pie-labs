import type { Metadata } from "next";
import Image from "next/image";
import { Quote, Search, Sparkles, Map } from "lucide-react";
import { AboutCTA } from "@/components/AboutCTA";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

// Founder identity used by the Person JSON-LD below. The visible social
// links in the founder card are currently still hardcoded; if you update
// the URLs in one place, update both so the schema doesn't drift from
// what's on the page.
const FOUNDER = {
  name: "Syed Belal",
  jobTitle: "Founder & CEO",
  sameAs: [
    "https://www.instagram.com/devbelaal",
    "https://www.linkedin.com/in/syedbilalraza",
    "https://www.x.com/devbelaal",
    "https://www.youtube.com/@devbelaal",
  ],
} as const;

export const metadata: Metadata = {
  title: "About",
  description:
    "We help painting contractors, tour operators, and local service businesses dominate Google, Maps, and AI answer engines. Meet the team behind 4Pie Labs.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About 4Pie Labs",
    description:
      "AI-first marketing for local service businesses. Meet the team behind 4Pie Labs.",
    url: "/about",
    type: "website",
  },
};

// v2 pillars - realigned around local search + AEO + accountable growth.
const PILLARS = [
  {
    title: "Local search, not vanity rankings",
    desc: "Maps pack, Google Business Profile, NAP consistency, citation depth - the dials that actually decide who gets called. We don't chase city-wide #1s when the buyer search is three miles wide.",
    icon: Map,
  },
  {
    title: "AEO as a first-class channel",
    desc: "ChatGPT, Perplexity, Gemini, and Google AI Overviews already shape the first answer a buyer sees. We engineer your site to be the source those engines cite, not the link they skip.",
    icon: Sparkles,
  },
  {
    title: "One funnel, accountable",
    desc: "Search, ads, content, and conversion path - wired into the same dashboard with call tracking and lead attribution. You always know which channel made you money this month.",
    icon: Search,
  },
];

const MILESTONES = [
  { year: "2021", label: "Started as a front-end developer" },
  { year: "2023", label: "Went deep on AI automation" },
  { year: "2024", label: "Founded 4Pie Labs" },
  { year: "2025", label: "Pivoted to local-service marketing + AEO" },
  { year: "Now", label: "Full-stack local growth partner" },
];

export default function AboutPage() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle,
    url: `${SITE.url}/about`,
    image: `${SITE.url}/founder.jpg`,
    worksFor: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    sameAs: FOUNDER.sameAs,
  };

  return (
    <main className="relative pt-12 md:pt-20 pb-32 px-4 overflow-hidden">
      <JsonLd data={personSchema} />
      {/* Local depth blobs */}
      <span
        aria-hidden
        className="absolute pointer-events-none -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.40), transparent 60%)",
        }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none top-[40%] -right-24 w-[420px] h-[420px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(217,119,6,0.30), transparent 60%)",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 max-w-3xl mx-auto text-center pb-16 md:pb-20">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-5">
          About 4Pie Labs
        </span>
        <h1 className="text-[clamp(40px,6vw,60px)] font-semibold leading-[1.05] tracking-tight text-foreground [text-wrap:balance]">
          Built around how local search{" "}
          <span className="font-semibold text-primary">
            actually works
          </span>{" "}
          now.
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
          We&apos;re not a generalist agency that bolted AI onto old playbooks.
          We rebuilt the entire local-marketing system for the era of answer
          engines, AI Overviews, and a Maps pack that turns over weekly.
        </p>
      </section>

      {/* Founder card */}
      <section className="relative z-10 max-w-[1100px] mx-auto mb-28 md:mb-32">
        <div className="bg-surface border border-card-border rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(26,26,26,0.06),0_1px_3px_rgba(26,26,26,0.04)]">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-[42%] relative">
              <div className="relative h-[420px] lg:h-full min-h-[520px] overflow-hidden">
                <Image
                  src="/founder.jpg"
                  alt="Syed Belal - Founder of 4Pie Labs"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-top"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-black via-black/60 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 lg:bottom-8 lg:left-8 lg:right-8 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-white">
                      Syed Belal
                    </h3>
                    <p className="text-white/75 text-sm font-medium">
                      Founder &amp; CEO, 4Pie Labs
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-white/85">
                    <a
                      href="https://www.instagram.com/devbelaal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-all duration-300 hover:text-[#E4405F]"
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
                      className="transition-all duration-300 hover:text-[#0A66C2]"
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
                      className="transition-all duration-300 hover:text-white"
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
                      className="transition-all duration-300 hover:text-[#FF0000]"
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

            <div className="lg:w-[58%] p-8 lg:p-14 flex flex-col justify-center">
              <div className="mb-7">
                <Quote className="w-9 h-9 text-primary/40 mb-3" />
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Founder&apos;s note
                </h2>
                <div className="w-12 h-0.5 bg-primary/60 rounded-full mt-3" />
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed text-[15px]">
                <p>
                  I started out as a front-end developer in 2021 - five years
                  building interfaces, learning to think in systems, and
                  developing a taste for clean, functional design.
                </p>
                <p>
                  Then AI happened. I went deep on autonomous agents and
                  agency-grade automation - the kind of work{" "}
                  <strong className="text-foreground">Liam Ottley</strong> and{" "}
                  <strong className="text-foreground">Nate Herk</strong> were
                  pioneering - and founded 4Pie Labs in 2024 as an AI
                  automation studio.
                </p>
                <p>
                  Working with painting contractors and tour operators changed
                  the company. Their problem wasn&apos;t &ldquo;more
                  automation.&rdquo; It was{" "}
                  <em className="text-foreground not-italic font-medium">
                    visibility
                  </em>{" "}
                  - being the business the next customer in their area finds
                  first, on Google, Maps, and now ChatGPT and Perplexity. The
                  AI tooling we&apos;d built turned into a real edge:
                  schema-first sites, AEO-grade content, Maps pack monitoring,
                  attribution wired end-to-end.
                </p>
                <p>
                  So we rebuilt 4Pie Labs around that. One funnel - search,
                  ads, AEO, conversion - accountable to revenue. Same
                  systems-thinking, applied to a problem local service
                  businesses actually wake up worrying about.
                </p>
                <p className="text-foreground font-medium italic">
                  We&apos;re just getting started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative z-10 max-w-3xl mx-auto mb-28 md:mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground [text-wrap:balance]">
            From code to{" "}
            <span className="font-semibold text-primary">
              local growth partner.
            </span>
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-2 bottom-2 w-px bg-border -translate-x-1/2" />

          <ul className="space-y-8">
            {MILESTONES.map((m, i) => (
              <li
                key={m.label}
                className={`flex items-center gap-6 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
              >
                <div
                  className={`flex-1 ${i % 2 === 0 ? "text-right" : "text-left"}`}
                >
                  <div className="text-primary text-xs font-semibold uppercase tracking-widest mb-1">
                    {m.year}
                  </div>
                  <div className="text-foreground font-medium">{m.label}</div>
                </div>
                <span className="relative z-10 w-3 h-3 rounded-full bg-primary shrink-0 ring-4 ring-background" />
                <div className="flex-1" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pillars */}
      <section className="relative z-10 max-w-[1100px] mx-auto mb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground [text-wrap:balance]">
            Three pillars.{" "}
            <span className="font-semibold text-primary">
              One funnel.
            </span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Everything we build is designed to make local service businesses
            the first call in their market - and the cited answer in every AI
            engine that matters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-surface border border-card-border rounded-2xl p-7 lg:p-8 shadow-[0_1px_3px_rgba(26,26,26,0.04)] hover:shadow-[0_4px_12px_rgba(26,26,26,0.06),0_1px_3px_rgba(26,26,26,0.04)] transition-shadow"
              >
                <span className="w-12 h-12 rounded-xl bg-primary-muted text-primary grid place-items-center mb-5">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <AboutCTA />
    </main>
  );
}
