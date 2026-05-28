"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Programs carousel — one card at a time, deep-linkable via #hash.
 *
 * Navigation:
 *   - Click the menu item in the navbar (`/programs#pipeline`) → reads
 *     the hash on mount, opens with that program active.
 *   - Arrow buttons on either side, or the dots / mini-pill deck below.
 *   - Keyboard ← / → while focus is on the page.
 *   - Touch swipe (mobile, one-finger): horizontal drag past ~50px commits.
 *   - Trackpad two-finger horizontal swipe: wheel events with |deltaX| >
 *     |deltaY| past a small accumulation threshold.
 *
 * The URL hash is kept in sync via `history.replaceState` so the carousel
 * stays shareable without flooding the browser back stack.
 */

export type Program = {
  id: string;
  name: string;
  tagline: string;
  tag: string;
  tagColor?: "primary";
  featured?: boolean;
  intro: string;
  whatsIncluded: string[];
  terms: string;
  Icon: LucideIcon;
};

// Duplicated from page.tsx so the page stays a server component for
// metadata. Keeping the data here lets the carousel own the index logic.
export const PROGRAMS: Program[] = [
  {
    id: "core",
    name: "Core",
    tagline: "Foundation",
    tag: "Foundation",
    intro:
      "Where most clients start. Visibility-first — search, maps, AI answer engines, and the website that converts them.",
    whatsIncluded: [
      "Local SEO + on-page technical SEO",
      "Answer Engine Optimization (ChatGPT / Perplexity / AI Overviews / Gemini)",
      "Google Business Profile management + review velocity",
      "Conversion-tuned website (or rebuild)",
      "Monthly content production — long-form pages tuned for AI retrieval",
      "Market exclusivity in your service area",
    ],
    terms: "Month-to-month after an initial 90-day commitment.",
    Icon: Layers,
  },
  {
    id: "pipeline",
    name: "Pipeline",
    tagline: "Most popular",
    tag: "Most popular",
    tagColor: "primary",
    featured: true,
    intro:
      "Core, plus the demand-capture engine. Paid that pays — and the AI scoring layer that turns clicks into booked jobs.",
    whatsIncluded: [
      "Everything in Core",
      "Google Search + Maps ads",
      "Per-campaign landing pages built to convert",
      "AI lead scoring + routing",
      "Call tracking + attribution",
      "Weekly performance tuning",
    ],
    terms: "6-month minimum engagement.",
    Icon: Plus,
  },
  {
    id: "os",
    name: "Operating System",
    tagline: "Full-stack",
    tag: "Full-stack",
    intro:
      "Pipeline, plus the AI operating layer most agencies can't build. The full stack — visibility, capture, automation, and your own performance dashboards.",
    whatsIncluded: [
      "Everything in Pipeline",
      "Multi-channel ads (Google / Meta / YouTube)",
      "Custom AI agent for your inquiries",
      "CRM automation + integrations",
      "Your own performance dashboards (the ones we use)",
      "Quarterly strategy sessions",
    ],
    terms: "12-month minimum engagement.",
    Icon: Box,
  },
  {
    id: "pulse",
    name: "Pulse",
    tagline: "Social-first",
    tag: "Social-first",
    intro:
      "A parallel path for brands whose growth is on social. Creative production + paid social, run in parallel with Pipeline or standalone.",
    whatsIncluded: [
      "Meta + Instagram ads",
      "YouTube + TikTok short-form ads",
      "Creative production (scripts, edits, assets)",
      "Community + DM management",
      "Monthly creative refresh",
      "Weekly performance review",
    ],
    terms: "6-month minimum engagement.",
    Icon: Activity,
  },
];

const SWIPE_THRESHOLD_PX = 50;
const WHEEL_THRESHOLD_PX = 60;
const WHEEL_COOLDOWN_MS = 600;

function indexFromHash(): number {
  if (typeof window === "undefined") return 0;
  const hash = window.location.hash.replace("#", "");
  const idx = PROGRAMS.findIndex((p) => p.id === hash);
  return idx >= 0 ? idx : 0;
}

export function ProgramsCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  // Holds drag state across touch lifecycle without re-renders.
  const dragRef = useRef<{ x: number; y: number; active: boolean } | null>(
    null,
  );
  // Wheel accumulator + cooldown so a single trackpad swipe doesn't
  // burn through multiple slides.
  const wheelRef = useRef<{ accum: number; locked: boolean }>({
    accum: 0,
    locked: false,
  });

  // Initial hash sync (runs once on mount) + listen for hashchange so an
  // in-page navigation (e.g. menu re-click) moves the carousel.
  useEffect(() => {
    const sync = () => {
      const next = indexFromHash();
      setActive((prev) => {
        if (prev === next) return prev;
        setDirection(next > prev ? 1 : -1);
        return next;
      });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const goTo = useCallback((next: number) => {
    setActive((prev) => {
      const clamped = Math.max(0, Math.min(PROGRAMS.length - 1, next));
      if (clamped === prev) return prev;
      setDirection(clamped > prev ? 1 : -1);
      // Sync URL hash without scrolling or stacking history entries.
      const id = PROGRAMS[clamped]?.id;
      if (id) {
        history.replaceState(null, "", `#${id}`);
      }
      return clamped;
    });
  }, []);

  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  // Keyboard arrow nav.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack arrows inside form fields.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // Touch swipe — record start, commit on end if horizontal travel passed
  // the threshold and dominated vertical travel.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    dragRef.current = { x: t.clientX, y: t.clientY, active: true };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start?.active) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) < Math.abs(dy)) return; // mostly vertical — ignore
    if (dx < 0) next();
    else prev();
  };

  // Trackpad two-finger horizontal swipe via wheel. We accumulate deltaX
  // (passing the threshold fires once, then cools down) and only act when
  // horizontal travel dominates so we never hijack page scroll.
  const onWheel = (e: React.WheelEvent) => {
    const w = wheelRef.current;
    if (w.locked) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
      w.accum = 0;
      return;
    }
    e.preventDefault();
    w.accum += e.deltaX;
    if (Math.abs(w.accum) >= WHEEL_THRESHOLD_PX) {
      if (w.accum > 0) next();
      else prev();
      w.accum = 0;
      w.locked = true;
      window.setTimeout(() => {
        wheelRef.current.locked = false;
      }, WHEEL_COOLDOWN_MS);
    }
  };

  const program = PROGRAMS[active];
  if (!program) return null;
  const Icon = program.Icon;

  return (
    <section
      className="relative max-w-[1100px] mx-auto"
      aria-roledescription="carousel"
      aria-label="Programs"
    >
      <div className="flex items-center gap-3 md:gap-6">
        {/* Prev arrow (desktop) */}
        <button
          type="button"
          onClick={prev}
          disabled={active === 0}
          aria-label="Previous program"
          className="hidden md:grid place-items-center shrink-0 w-12 h-12 rounded-full bg-surface border border-card-border text-foreground hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-[var(--shadow-pill)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Card stage — single program at a time, animated on switch. */}
        <div
          className="flex-1 relative overflow-hidden touch-pan-y select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.article
              key={program.id}
              custom={direction}
              initial={{ opacity: 0, x: 32 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 * direction }}
              transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              className={cn(
                "rounded-2xl p-8 md:p-12 border flex flex-col min-h-[520px] md:min-h-[560px]",
                program.featured
                  ? "bg-foreground text-background border-foreground"
                  : "bg-surface border-card-border shadow-[var(--shadow-card)]",
              )}
              role="group"
              aria-roledescription="slide"
              aria-label={`${active + 1} of ${PROGRAMS.length}: ${program.name}`}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="w-12 h-12 rounded-xl grid place-items-center bg-primary-muted text-primary">
                  <Icon className="w-5 h-5" />
                </span>
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    program.featured
                      ? "bg-primary-muted text-primary"
                      : program.tagColor === "primary"
                        ? "text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  {program.tag}
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                {program.name}
                <span
                  className={cn(
                    "ml-2 text-base font-normal align-middle",
                    program.featured
                      ? "text-background/60"
                      : "text-muted-foreground",
                  )}
                >
                  · {program.tagline}
                </span>
              </h2>

              <p
                className={cn(
                  "leading-relaxed mb-7 text-base md:text-lg max-w-3xl",
                  program.featured
                    ? "text-background/85"
                    : "text-muted-foreground",
                )}
              >
                {program.intro}
              </p>

              <h3
                className={cn(
                  "text-xs font-medium uppercase tracking-widest mb-3",
                  program.featured
                    ? "text-background/60"
                    : "text-subtle-foreground",
                )}
              >
                What&apos;s included
              </h3>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-6 flex-1">
                {program.whatsIncluded.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-snug"
                  >
                    <CheckCircle2
                      className={cn(
                        "w-4 h-4 shrink-0 mt-0.5",
                        program.featured ? "text-primary" : "text-success",
                      )}
                    />
                    <span
                      className={
                        program.featured
                          ? "text-background/90"
                          : "text-foreground/90"
                      }
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "text-xs pt-4 border-t",
                  program.featured
                    ? "text-background/60 border-background/15"
                    : "text-subtle-foreground border-border",
                )}
              >
                {program.terms}
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        {/* Next arrow (desktop) */}
        <button
          type="button"
          onClick={next}
          disabled={active === PROGRAMS.length - 1}
          aria-label="Next program"
          className="hidden md:grid place-items-center shrink-0 w-12 h-12 rounded-full bg-surface border border-card-border text-foreground hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-[var(--shadow-pill)]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile arrows row */}
      <div className="md:hidden flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={prev}
          disabled={active === 0}
          aria-label="Previous program"
          className="grid place-items-center w-11 h-11 rounded-full bg-surface border border-card-border text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">
          {active + 1} / {PROGRAMS.length}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={active === PROGRAMS.length - 1}
          aria-label="Next program"
          className="grid place-items-center w-11 h-11 rounded-full bg-surface border border-card-border text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mini-pill deck — jump to any program */}
      <div
        className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3"
        role="tablist"
        aria-label="Jump to program"
      >
        {PROGRAMS.map((p, i) => {
          const isActive = i === active;
          const PIcon = p.Icon;
          return (
            <button
              type="button"
              key={p.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`program-${p.id}`}
              onClick={() => goTo(i)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                isActive
                  ? "bg-primary-muted border-primary text-foreground"
                  : "bg-surface border-card-border text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              <span
                className={cn(
                  "w-8 h-8 rounded-lg grid place-items-center shrink-0",
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-primary-muted text-primary",
                )}
              >
                <PIcon className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight truncate">
                  {p.name}
                </span>
                <span className="block text-[11px] text-muted-foreground tracking-wider uppercase truncate">
                  {p.tagline}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div
        className="mt-6 flex items-center justify-center gap-2"
        aria-hidden
      >
        {PROGRAMS.map((p, i) => (
          <button
            type="button"
            key={p.id}
            onClick={() => goTo(i)}
            tabIndex={-1}
            aria-label={`Go to ${p.name}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-8 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground",
            )}
          />
        ))}
      </div>
    </section>
  );
}
