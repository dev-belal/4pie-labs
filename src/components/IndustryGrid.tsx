import { Compass, Home, Sparkles } from "lucide-react";

/**
 * Phase 3 industry grid - three industry tiles surfacing the verticals from
 * the v2 design. Imagery is a styled gradient placeholder for now; swap in
 * real photography (Unsplash or licensed) in a later commit.
 */

const INDUSTRIES = [
  {
    title: "Tour operators",
    sub: "Where 60% of our book lives. Tours, attractions, hospitality.",
    href: "/services#tour",
    Icon: Compass,
    gradient:
      "linear-gradient(135deg, rgba(251,191,36,0.22), rgba(232,155,124,0.24))",
  },
  {
    title: "Painting contractors",
    sub: "Where our craftsmanship pays. Residential + commercial.",
    href: "/services#painting",
    Icon: Home,
    gradient:
      "linear-gradient(135deg, rgba(232,155,124,0.24), rgba(217,119,6,0.22))",
  },
  {
    title: "Other local services",
    sub: "Landscaping, roofing, wellness, professional services.",
    href: "/services#local",
    Icon: Sparkles,
    gradient:
      "linear-gradient(135deg, rgba(217,119,6,0.22), rgba(251,191,36,0.22))",
  },
];

export function IndustryGrid() {
  return (
    <section className="px-4 py-24 md:py-28">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center mb-12 md:mb-14">
          <span
            className="block font-semibold text-[40px] md:text-[56px] leading-none text-primary/30 tracking-tight mb-2"
            aria-hidden
          >
            03
          </span>
          <span className="block text-xs font-medium text-muted-foreground tracking-widest uppercase mb-3">
            Built for
          </span>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-semibold tracking-tight text-foreground leading-[1.15]">
            Three industries we know{" "}
            <span className="font-semibold text-primary">
              deeply.
            </span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {INDUSTRIES.map(({ title, sub, href, Icon, gradient }) => (
            <a
              key={title}
              href={href}
              className="group block rounded-2xl bg-surface border border-card-border overflow-hidden transition-all hover:-translate-y-0.5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]"
            >
              <div
                className="aspect-[16/10] grid place-items-center relative"
                style={{ background: gradient }}
                aria-hidden
              >
                <Icon className="w-12 h-12 text-foreground/40" />
              </div>
              <div className="p-5 md:p-6">
                <h3 className="text-lg font-semibold tracking-tight text-foreground mb-1.5">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-snug">
                  {sub}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
