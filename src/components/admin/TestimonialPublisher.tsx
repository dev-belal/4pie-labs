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

  /* eslint-disable react-hooks/set-state-in-effect --
     One-shot reaction to the server-action result (`state` from useActionState):
     show a transient notice and reset the form after a completed submit. This
     fires only when `state` changes (a finished submission), not on every
     render, so it does not cause the cascading re-renders the rule guards
     against. The rating reset is a genuine one-shot side effect and the dismiss
     timer is cleaned up below. */
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
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <>
      <form
        id="testimonial-form"
        action={formAction}
        className="space-y-5 bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 rounded-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="t-name"
              className="text-xs font-medium text-[var(--muted)] ml-1"
            >
              Client Name
            </label>
            <input
              id="t-name"
              name="name"
              type="text"
              required
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]"
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
              className="text-xs font-medium text-[var(--muted)] ml-1"
            >
              Role / Company
            </label>
            <input
              id="t-role"
              name="role"
              type="text"
              required
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]"
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
            className="text-xs font-medium text-[var(--muted)] ml-1"
          >
            Testimonial Headline
          </label>
          <input
            id="t-headline"
            name="headline"
            type="text"
            required
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]"
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
            className="text-xs font-medium text-[var(--muted)] ml-1"
          >
            Quote Content
          </label>
          <textarea
            id="t-quote"
            name="quote"
            rows={4}
            required
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)] resize-none"
            placeholder="Enter the client's words..."
          />
          {state.errors?.quote && (
            <p className="text-xs text-red-400 ml-1">
              {state.errors.quote[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-[var(--muted)] ml-1">
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
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                  star <= rating
                    ? "bg-[var(--accent-soft)] text-primary"
                    : "bg-[var(--surface-hover)] text-[var(--muted)]"
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
          className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
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
            className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-white ${
              notice.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <div>
              <div className="font-semibold text-sm">
                {notice.type === "success" ? "Success" : "Error"}
              </div>
              <div className="opacity-90 text-xs">{notice.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
