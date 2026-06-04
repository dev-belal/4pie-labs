"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  publishTestimonial,
  updateTestimonial,
} from "@/lib/admin-actions";
import { publishInitial } from "@/lib/form-types";
import type { TestimonialRow } from "@/lib/admin-data";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  // Required in edit mode; ignored in create mode.
  initial?: TestimonialRow;
  // Called after a successful publish/update so the parent list panel
  // can return to list view.
  onDone?: () => void;
  // Cancel button - omit to hide it.
  onCancel?: () => void;
}

export function TestimonialEditor({
  mode,
  initial,
  onDone,
  onCancel,
}: Props) {
  const action = mode === "edit" ? updateTestimonial : publishTestimonial;
  const [state, formAction, pending] = useActionState(action, publishInitial);

  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [avatar, setAvatar] = useState(initial?.avatar ?? "");
  // is_published starts true for create mode (matches the legacy
  // publisher's hardcoded default); seeds from the row in edit mode.
  const [isPublished, setIsPublished] = useState(
    initial?.is_published ?? true,
  );
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  /* eslint-disable react-hooks/set-state-in-effect --
     One-shot reaction to a finished useActionState submit (same pattern
     as BlogEditor). Fires only when `state` changes (a finished
     submission), not on every render. */
  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "success") {
      setNotice({ type: "success", message: state.message ?? "Saved" });
      if (mode === "create") {
        // Reset so the admin can publish another without leaving the
        // screen. Edit mode does NOT reset - row values are the source
        // of truth.
        setRating(5);
        setAvatar("");
        setIsPublished(true);
        const form = document.getElementById(
          "testimonial-editor-form",
        ) as HTMLFormElement | null;
        form?.reset();
      }
      if (onDone) {
        const t = window.setTimeout(onDone, 1200);
        return () => window.clearTimeout(t);
      }
    } else if (state.status === "error") {
      setNotice({ type: "error", message: state.message ?? "Failed" });
    }
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [state, mode, onDone]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <>
      <form
        id="testimonial-editor-form"
        action={formAction}
        className="space-y-5 bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 rounded-2xl"
      >
        {/* Edit mode carries the row id so updateTestimonial knows
            which row to write back to. */}
        {mode === "edit" && initial && (
          <input type="hidden" name="id" value={initial.id} />
        )}
        {/* Star rating + publish flag are React-state-controlled
            instead of native inputs so we sync them through hidden
            fields. */}
        <input type="hidden" name="rating" value={rating} />
        <input
          type="hidden"
          name="isPublished"
          value={isPublished ? "true" : "false"}
        />

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
              defaultValue={initial?.name ?? ""}
              required
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]"
              placeholder="Christina Cheney"
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
              defaultValue={initial?.role ?? ""}
              required
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]"
              placeholder="Operations Lead, Tour Operator"
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
            defaultValue={initial?.headline ?? ""}
            required
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]"
            placeholder="I HIGHLY recommend 4Pie Labs."
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
            defaultValue={initial?.quote ?? ""}
            rows={4}
            required
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)] resize-none"
            placeholder="The 4Pie Labs team is a total rock star..."
          />
          {state.errors?.quote && (
            <p className="text-xs text-red-400 ml-1">
              {state.errors.quote[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="t-avatar"
              className="text-xs font-medium text-[var(--muted)] ml-1 flex items-center gap-2"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Avatar URL or Path
            </label>
            <input
              id="t-avatar"
              name="avatar"
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)] font-mono text-sm"
              placeholder="/testimonials/maria.jpeg or https://..."
            />
            {state.errors?.avatar && (
              <p className="text-xs text-red-400 ml-1">
                {state.errors.avatar[0]}
              </p>
            )}
            <p className="text-xs text-[var(--muted)] ml-1">
              Leave blank to render a ui-avatars initials chip.
            </p>
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
            <p className="text-xs text-[var(--muted)] ml-1">
              Stored for future use. The carousel currently renders five
              stars regardless of this value.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            onClick={() => setIsPublished(!isPublished)}
            className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
              isPublished
                ? "bg-emerald-500/80"
                : "bg-[var(--border-strong)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isPublished ? "translate-x-4" : ""
              }`}
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)]">
              {isPublished ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Live on the homepage
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-[var(--muted)]" />
                  Draft (hidden from the homepage)
                </>
              )}
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              {isPublished
                ? "This testimonial appears in the Results & feedback carousel after the next revalidation cycle."
                : "Save as draft to refine the wording without exposing it publicly. Toggle back on when ready."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="px-4 py-3 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "edit" ? "Saving..." : "Publishing..."}
              </>
            ) : (
              <>
                {mode === "edit" ? "Save changes" : "Publish testimonial"}{" "}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
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
