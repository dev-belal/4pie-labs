"use client";

import { useActionState, useState } from "react";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import { submitTestimonialReview } from "@/lib/actions";
import { initialFormState } from "@/lib/form-types";

/**
 * Public /leave-a-review form. Mirrors the AuditForm pattern -
 * useActionState wiring around the public-form FormState shape, native
 * inputs where possible, React state for rating (so we can render a
 * gold-fill star selector and ship the value through a hidden field).
 *
 * Honeypot: the `website` input is positioned absolutely off-screen with
 * tabIndex=-1 and aria-hidden so real users won't tab into it. Bots
 * scraping forms auto-fill every named input and trip the action's
 * silent-success path.
 */
export function LeaveReviewForm() {
  const [state, formAction, pending] = useActionState(
    submitTestimonialReview,
    initialFormState,
  );
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (state.status === "success") {
    return (
      <div className="bg-surface border border-card-border rounded-2xl p-8 md:p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-success/15 grid place-items-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-success" />
        </div>
        <h2 className="text-xl font-semibold mb-2 tracking-tight">
          Thanks for the review.
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {state.message}
        </p>
        <p className="text-xs text-subtle-foreground mt-4">
          We read every submission. Published reviews appear on our homepage.
        </p>
      </div>
    );
  }

  const fillTo = hoverRating ?? rating;

  return (
    <form
      action={formAction}
      className="bg-surface border border-card-border rounded-2xl p-6 md:p-10 space-y-5"
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Leave a review
        </h2>
        <p className="text-muted-foreground text-sm">
          Five fields, two minutes. We&apos;ll review and publish after a
          quick look.
        </p>
      </div>

      {/* Honeypot. Real users never see or tab into this. Bots that
          enumerate <input> elements fill it; the action then short-
          circuits to a fake success. */}
      <div
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none -left-[9999px] top-auto w-px h-px overflow-hidden"
      >
        <label htmlFor="lr-website">Website (leave blank)</label>
        <input
          id="lr-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          id="lr-name"
          name="name"
          label="Your name"
          required
          placeholder="Jane Smith"
          error={state.errors?.name?.[0]}
        />
        <Field
          id="lr-role"
          name="role"
          label="Role / company"
          required
          placeholder="Owner, Acme Painting Co."
          error={state.errors?.role?.[0]}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="lr-rating"
          className="block text-sm font-medium text-foreground"
        >
          Rating
          <span className="text-primary"> *</span>
        </label>
        <div
          id="lr-rating"
          role="radiogroup"
          aria-label="Rating, 1 to 5 stars"
          className="flex gap-1.5"
          onMouseLeave={() => setHoverRating(null)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= fillTo;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={n === rating}
                aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
                  filled
                    ? "bg-primary/15 text-primary"
                    : "bg-surface text-subtle-foreground hover:bg-surface-hover"
                } border ${filled ? "border-primary/30" : "border-border"}`}
              >
                <Star
                  className="w-5 h-5"
                  fill={filled ? "currentColor" : "none"}
                  strokeWidth={1.75}
                />
              </button>
            );
          })}
        </div>
        <input type="hidden" name="rating" value={rating} />
        {state.errors?.rating?.[0] && (
          <p className="text-xs text-error">{state.errors.rating[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="lr-quote"
          className="block text-sm font-medium text-foreground"
        >
          Your testimonial
          <span className="text-primary"> *</span>
        </label>
        <textarea
          id="lr-quote"
          name="quote"
          rows={5}
          required
          placeholder="What was it like working with us? What changed for your business? Specifics are great."
          className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-y"
        />
        {state.errors?.quote?.[0] && (
          <p className="text-xs text-error">{state.errors.quote[0]}</p>
        )}
      </div>

      <Field
        id="lr-headline"
        name="headline"
        label="Headline (optional)"
        placeholder='"A great experience working with them."'
        error={state.errors?.headline?.[0]}
        hint="A short summary — optional. We may add one for you during review."
      />

      {state.status === "error" && state.message && (
        <p
          aria-live="polite"
          className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-2.5"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-70 text-on-primary px-6 py-3 rounded-lg text-base font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
      >
        {pending ? "Sending…" : "Send review"}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>

      <p className="text-xs text-subtle-foreground">
        Reviews are moderated before they go live. Usually within a day.
      </p>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  placeholder,
  error,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      {hint && !error && (
        <p className="text-xs text-subtle-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
