"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export interface Testimonial {
  headline: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

/** Minimum horizontal distance (px) to register as a swipe. */
const SWIPE_THRESHOLD = 50;

/** Minimum wheel deltaX (px per gesture) to count as a scroll intent. */
const WHEEL_THRESHOLD = 40;

/** Cool-down between gesture-driven paginations (both touch + wheel). */
const GESTURE_COOLDOWN_MS = 350;

/** How many cards are visible side-by-side at the desktop breakpoint. */
const VISIBLE_DESKTOP = 3;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const reduced = useReducedMotion() ?? false;
  const total = testimonials.length;

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /**
   * `visible` = how many cards fit in the viewport at this breakpoint.
   * Used to size the strip and clamp scroll position so we never reveal
   * empty space past the last card.
   */
  const visible = isDesktop ? VISIBLE_DESKTOP : 1;
  const maxIndex = Math.max(0, total - visible);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Re-clamp when the viewport flips (e.g. rotate phone) so we never
  // get stuck pointing at a now-out-of-range card.
  useEffect(() => {
    setCurrentIndex((i) => clamp(i, 0, maxIndex));
  }, [maxIndex]);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastGestureAtRef = useRef(0);
  const wheelAccumRef = useRef(0);

  const goTo = useCallback(
    (next: number) => {
      setCurrentIndex(clamp(next, 0, maxIndex));
    },
    [maxIndex],
  );

  const paginate = useCallback(
    (dir: number) => {
      goTo(currentIndex + dir);
    },
    [goTo, currentIndex],
  );

  const paginateFromGesture = useCallback(
    (dir: number) => {
      const now = Date.now();
      if (now - lastGestureAtRef.current < GESTURE_COOLDOWN_MS) return;
      lastGestureAtRef.current = now;
      paginate(dir);
    },
    [paginate],
  );

  // Touch swipe — distinguishes horizontal from vertical so vertical
  // page scroll still flows through naturally.
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      if (startX == null || startY == null) return;

      const end = e.changedTouches[0];
      const dx = end.clientX - startX;
      const dy = end.clientY - startY;

      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) return;

      paginateFromGesture(dx < 0 ? 1 : -1);
    },
    [paginateFromGesture],
  );

  // Trackpad horizontal scroll — only when horizontal intent dominates
  // vertical, so vertical page scroll still flows through.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      wheelAccumRef.current += e.deltaX;
      if (Math.abs(wheelAccumRef.current) >= WHEEL_THRESHOLD) {
        const dir = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        paginateFromGesture(dir);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [paginateFromGesture]);

  // Strip math:
  //   strip width = (total / visible) × 100% of the viewport container
  //   each card   = (100 / total)% of the strip → exactly viewport/visible
  //   translateX  = -(currentIndex / total) × strip-width
  //                = -(currentIndex / total) × (total / visible) × 100%
  //                = -(currentIndex / visible) × 100%   (relative to viewport)
  // We feed the equivalent expressed relative to the strip's own width
  // so framer-motion can interpolate a single % string.
  const stripWidthPct = (100 * total) / visible;
  const cardWidthPct = 100 / total;
  const translatePct = -currentIndex * cardWidthPct;

  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex === maxIndex;

  return (
    <>
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative px-4 md:px-16 group/carousel touch-pan-y select-none"
      >
        {/* Prev / Next — desktop overlay */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20 hidden md:block">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => paginate(-1)}
            disabled={isAtStart}
            className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all group/btn disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-6 h-6 text-white/50 group-hover/btn:text-primary transition-colors" />
          </button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-0 z-20 hidden md:block">
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => paginate(1)}
            disabled={isAtEnd}
            className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all group/btn disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-6 h-6 text-white/50 group-hover/btn:text-primary transition-colors" />
          </button>
        </div>

        {/* Viewport — clips the strip to one row of cards. */}
        <div className="overflow-hidden">
          <motion.div
            className="flex"
            style={{ width: `${stripWidthPct}%` }}
            animate={{ x: `${translatePct}%` }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 240, damping: 32, mass: 0.9 }
            }
          >
            {testimonials.map((t) => (
              <article
                key={t.name}
                style={{ flex: `0 0 ${cardWidthPct}%` }}
                className="px-3"
              >
                <motion.div
                  whileHover={
                    reduced
                      ? undefined
                      : { y: -6, transition: { duration: 0.25 } }
                  }
                  className="p-8 glass-morphism rounded-[40px] border-white/10 hover:border-primary/30 hover:bg-white/[0.07] hover:shadow-[0_20px_50px_-12px_rgba(139,92,246,0.25)] shadow-2xl flex flex-col justify-between h-full transform-gpu transition-colors"
                >
                  <div>
                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-3.5 h-3.5 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-white leading-tight min-h-[3.5rem]">
                      {t.headline}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8 italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-6 mt-auto">
                    <div className="relative group/avatar w-12 h-12">
                      <div className="absolute inset-0 bg-primary/20 blur-md rounded-full pointer-events-none opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        fill
                        sizes="48px"
                        className="rounded-full object-cover relative border border-white/10 grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </article>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile prev / next */}
      <div className="flex md:hidden justify-center gap-4 mt-8">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => paginate(-1)}
          disabled={isAtStart}
          className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background text-white/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => paginate(1)}
          disabled={isAtEnd}
          className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background text-white/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Pagination dots — one per scroll position, not per card */}
      <div className="flex justify-center gap-2 mt-12">
        {Array.from({ length: maxIndex + 1 }, (_, i) => (
          <button
            type="button"
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              i === currentIndex
                ? "bg-primary w-8"
                : "bg-white/10 w-2 hover:bg-white/20"
            }`}
          />
        ))}
      </div>
    </>
  );
}
