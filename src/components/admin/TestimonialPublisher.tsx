"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { publishTestimonial } from "@/lib/admin-actions";
import { publishInitial } from "@/lib/form-types";

export function TestimonialPublisher() {
  const [state, formAction, pending] = useActionState(
    publishTestimonial,
    publishInitial,
  );
  const [rating, setRating] = useState(5);
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "success") {
      setNotice({ type: "success", message: state.message ?? "Published" });
      setRating(5);
      const form = document.getElementById(
        "testimonial-form",
      ) as HTMLFormElement | null;
      form?.reset();
    } else if (state.status === "error") {
      setNotice({ type: "error", message: state.message ?? "Failed" });
    }
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <>
      <form
        id="testimonial-form"
        action={formAction}
        className="space-y-6 glass-morphism p-10 rounded-[40px] border-white/5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="t-name"
              className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
            >
              Client Name
            </label>
            <input
              id="t-name"
              name="name"
              type="text"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all"
              placeholder="John Doe"
            />
            {state.errors?.name && (
              <p className="text-xs text-red-400 ml-1">
                {state.errors.name[0]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="t-role"
              className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
            >
              Role / Company
            </label>
            <input
              id="t-role"
              name="role"
              type="text"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all"
              placeholder="CEO, TechCo"
            />
            {state.errors?.role && (
              <p className="text-xs text-red-400 ml-1">
                {state.errors.role[0]}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="t-headline"
            className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
          >
            Testimonial Headline
          </label>
          <input
            id="t-headline"
            name="headline"
            type="text"
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all"
            placeholder="Impactful title..."
          />
          {state.errors?.headline && (
            <p className="text-xs text-red-400 ml-1">
              {state.errors.headline[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="t-quote"
            className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
          >
            Quote Content
          </label>
          <textarea
            id="t-quote"
            name="quote"
            rows={4}
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all resize-none"
            placeholder="Enter the client's words..."
          />
          {state.errors?.quote && (
            <p className="text-xs text-red-400 ml-1">
              {state.errors.quote[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">
            Rating
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === rating}
                aria-label={`${star} star`}
                onClick={() => setRating(star)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                  star <= rating
                    ? "bg-amber-400/20 text-amber-400"
                    : "bg-white/5 text-white/20"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <input type="hidden" name="rating" value={rating} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
            </>
          ) : (
            <>
              Publish Testimonial <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-12 right-12 z-50 px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 ${
              notice.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <div>
              <div className="font-bold">
                {notice.type === "success" ? "Success!" : "Error"}
              </div>
              <div className="text-white/80 text-[10px] uppercase font-bold tracking-widest">
                {notice.message}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
