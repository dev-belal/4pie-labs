"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export interface Testimonial {
  headline: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

/**
 * Per-card slide variants. The custom prop here is:
 *   { direction: -1 | 1, index: number, reduced: boolean }
 *
 * `direction` is which way the carousel moved (+1 = next, −1 = prev).
 * `index` is the slot within the visible trio (0/1/2) — used to
 *   stagger entries so cards cascade in instead of jumping together.
 * `reduced` collapses the animation to a simple fade when the visitor
 *   has `prefers-reduced-motion: reduce`.
 */
type SlideCustom = { direction: number; index: number; reduced: boolean };

const slideVariants = {
  enter: ({ direction, reduced }: SlideCustom) =>
    reduced
      ? { opacity: 0 }
      : {
          x: direction > 0 ? "60%" : "-60%",
          rotateY: direction > 0 ? 18 : -18,
          opacity: 0,
          scale: 0.92,
          filter: "blur(6px)",
        },
  center: ({ index, reduced }: SlideCustom) =>
    reduced
      ? { opacity: 1, transition: { duration: 0.25 } }
      : {
          x: 0,
          rotateY: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            // Cascade each visible card in, rightward. Gives a "magazine
            // spread" feel vs. the old synchronous slide.
            delay: index * 0.08,
            x: { type: "spring" as const, stiffness: 260, damping: 28 },
            rotateY: { type: "spring" as const, stiffness: 260, damping: 28 },
            opacity: { duration: 0.45, ease: "easeOut" as const },
            scale: { duration: 0.45, ease: "easeOut" as const },
            filter: { duration: 0.35, ease: "easeOut" as const },
          },
        },
  exit: ({ direction, reduced }: SlideCustom) =>
    reduced
      ? { opacity: 0, transition: { duration: 0.18 } }
      : {
          x: direction > 0 ? "-40%" : "40%",
          rotateY: direction > 0 ? -12 : 12,
          opacity: 0,
          scale: 0.9,
          filter: "blur(4px)",
          transition: { duration: 0.35, ease: "easeIn" as const },
        },
};

/** Minimum horizontal distance (px) to register as a swipe. */
const SWIPE_THRESHOLD = 50;

/** Minimum wheel deltaX (px per gesture) to count as a scroll intent. */
const WHEEL_THRESHOLD = 40;

/** Cool-down between gesture-driven paginations (both touch + wheel). */
const GESTURE_COOLDOWN_MS = 500;

export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const reduced = useReducedMotion() ?? false;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastGestureAtRef = useRef(0);
  const wheelAccumRef = useRef(0);

  const paginate = useCallback(
    (newDirection: number) => {
      setDirection(newDirection);
      setCurrentIndex(
        (prev) =>
          (prev + newDirection + testimonials.length) % testimonials.length,
      );
    },
    [testimonials.length],
  );

  /**
   * Gesture-driven pagination. One tick per cooldown window so a single
   * physical swipe / trackpad flick can't skip several testimonials.
   */
  const paginateFromGesture = useCallback(
    (newDirection: number) => {
      const now = Date.now();
      if (now - lastGestureAtRef.current < GESTURE_COOLDOWN_MS) return;
      lastGestureAtRef.current = now;
      paginate(newDirection);
    },
    [paginate],
  );

  // Touch swipe (mobile + touchscreen laptops). Track X/Y on start so we
  // can distinguish horizontal swipes from accidental vertical scrolls.
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

      // Horizontal intent only — ignore vertical page scrolls.
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) return;

      paginateFromGesture(dx < 0 ? 1 : -1);
    },
    [paginateFromGesture],
  );

  // Trackpad two-finger horizontal scroll. Accumulate deltaX until it
  // crosses the threshold so slow flicks still register, then reset.
  // Use a non-passive listener so we can preventDefault and stop the
  // browser from scrolling the page horizontally while we navigate.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Only react when horizontal intent dominates — preserves vertical
      // page scrolling when the user is scrolling through the page.
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

  const getVisibleTestimonials = () => {
    const items: Testimonial[] = [];
    for (let i = 0; i < Math.min(3, testimonials.length); i++) {
      items.push(testimonials[(currentIndex + i) % testimonials.length]);
    }
    return items;
  };

  return (
    <>
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative px-4 md:px-16 group/carousel touch-pan-y select-none"
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20 hidden md:block">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => paginate(-1)}
            className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all group/btn"
          >
            <ChevronLeft className="w-6 h-6 text-white/50 group-hover/btn:text-primary transition-colors" />
          </button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-0 z-20 hidden md:block">
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => paginate(1)}
            className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all group/btn"
          >
            <ChevronRight className="w-6 h-6 text-white/50 group-hover/btn:text-primary transition-colors" />
          </button>
        </div>

        <div
          className="relative min-h-[460px]"
          style={{ perspective: "1400px" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence initial={false} mode="popLayout">
              {getVisibleTestimonials().map((t, i) => (
                <motion.div
                  key={`${t.name}-${currentIndex}-${i}`}
                  custom={{ direction, index: i, reduced }}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  whileHover={
                    reduced
                      ? undefined
                      : { y: -6, scale: 1.015, transition: { duration: 0.25 } }
                  }
                  style={{ transformStyle: "preserve-3d" }}
                  className={`p-8 glass-morphism rounded-[40px] border-white/10 hover:border-primary/30 hover:bg-white/[0.07] hover:shadow-[0_20px_50px_-12px_rgba(139,92,246,0.25)] shadow-2xl flex flex-col justify-between h-full transform-gpu ${
                    i > 0 ? "hidden md:flex" : "flex"
                  }`}
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
                      <div className="font-bold text-sm text-white">{t.name}</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex md:hidden justify-center gap-4 mt-8">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => paginate(-1)}
          className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background text-white/50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => paginate(1)}
          className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background text-white/50"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-12">
        {testimonials.map((t, i) => (
          <button
            type="button"
            key={t.name}
            aria-label={`Go to testimonial ${i + 1}`}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
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
