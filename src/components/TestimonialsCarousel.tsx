"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export interface Testimonial {
  headline: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.9,
    filter: "blur(10px)",
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
    scale: 0.9,
    filter: "blur(10px)",
  }),
};

const transition = {
  x: { type: "spring" as const, stiffness: 200, damping: 25, restDelta: 0.5 },
  opacity: { duration: 0.4, ease: "easeInOut" as const },
  scale: { duration: 0.4, ease: "easeInOut" as const },
  filter: { duration: 0.4, ease: "easeInOut" as const },
};

export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex(
      (prev) => (prev + newDirection + testimonials.length) % testimonials.length,
    );
  };

  const getVisibleTestimonials = () => {
    const items: Testimonial[] = [];
    for (let i = 0; i < Math.min(3, testimonials.length); i++) {
      items.push(testimonials[(currentIndex + i) % testimonials.length]);
    }
    return items;
  };

  return (
    <>
      <div className="relative px-4 md:px-16 group/carousel">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20 hidden md:block">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => paginate(-1)}
            className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 hover:bg-white/[0.05] transition-all group/btn"
          >
            <ChevronLeft className="w-6 h-6 text-white/50 group-hover/btn:text-primary transition-colors" />
          </button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-0 z-20 hidden md:block">
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => paginate(1)}
            className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 hover:bg-white/[0.05] transition-all group/btn"
          >
            <ChevronRight className="w-6 h-6 text-white/50 group-hover/btn:text-primary transition-colors" />
          </button>
        </div>

        <div className="relative min-h-[460px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              {getVisibleTestimonials().map((t, i) => (
                <motion.div
                  key={`${t.name}-${currentIndex}-${i}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={transition}
                  className={`p-8 glass-morphism rounded-[40px] border-white/10 hover:border-primary/20 hover:bg-white/[0.07] transition-all shadow-2xl flex flex-col justify-between h-full ${
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
          className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 text-white/50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => paginate(1)}
          className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 text-white/50"
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
            className={`h-1.5 rounded-full transition-all duration-500 ${
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
