"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import {
  deleteTestimonial,
  setTestimonialPublished,
} from "@/lib/admin-actions";
import type { TestimonialRow } from "@/lib/admin-data";
import { TestimonialEditor } from "./TestimonialEditor";
import { ConfirmModal } from "./ConfirmModal";

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; row: TestimonialRow };

interface Props {
  testimonials: TestimonialRow[];
  // Optional consumer of AdminShell's topbar globalSearch. Filters the
  // list by name / role / headline / quote.
  globalSearch?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TestimonialsListPanel({ testimonials, globalSearch }: Props) {
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  // Optimistic publish-state. The list state stays the source of truth
  // for everything else; the toggle just shadows is_published until the
  // next page revalidate cycle brings the real value back.
  const [optimisticPublished, setOptimisticPublished] = useState<
    Record<string, boolean>
  >({});
  const [confirming, setConfirming] = useState<TestimonialRow | null>(null);

  const search = (globalSearch ?? "").trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!search) return testimonials;
    return testimonials.filter((t) => {
      const hay =
        `${t.name} ${t.role} ${t.headline} ${t.quote}`.toLowerCase();
      return hay.includes(search);
    });
  }, [testimonials, search]);

  const publishedFlag = (t: TestimonialRow): boolean =>
    optimisticPublished[t.id] ?? t.is_published;

  const handleTogglePublished = (t: TestimonialRow) => {
    const next = !publishedFlag(t);
    setOptimisticPublished((prev) => ({ ...prev, [t.id]: next }));
    startTransition(async () => {
      const res = await setTestimonialPublished(t.id, next);
      if (res.ok) {
        setNotice({
          type: "success",
          message: next ? "Published." : "Hidden from homepage.",
        });
      } else {
        // Roll back optimistic flip on failure.
        setOptimisticPublished((prev) => {
          const copy = { ...prev };
          delete copy[t.id];
          return copy;
        });
        setNotice({ type: "error", message: res.error });
      }
      window.setTimeout(() => setNotice(null), 3500);
    });
  };

  const runDelete = (t: TestimonialRow) => {
    startTransition(async () => {
      const res = await deleteTestimonial(t.id);
      setConfirming(null);
      if (res.ok) {
        setNotice({
          type: "success",
          message: `Deleted "${t.name}".`,
        });
      } else {
        setNotice({ type: "error", message: res.error });
      }
      window.setTimeout(() => setNotice(null), 3500);
    });
  };

  if (mode.kind === "create") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMode({ kind: "list" })}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to testimonials
        </button>
        <TestimonialEditor
          mode="create"
          onCancel={() => setMode({ kind: "list" })}
          onDone={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  if (mode.kind === "edit") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMode({ kind: "list" })}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to testimonials
        </button>
        <TestimonialEditor
          mode="edit"
          initial={mode.row}
          onCancel={() => setMode({ kind: "list" })}
          onDone={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  const liveCount = testimonials.filter((t) => publishedFlag(t)).length;
  const draftCount = testimonials.length - liveCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm text-[var(--muted)]">
          <span className="font-semibold text-[var(--fg)]">
            {filtered.length}
          </span>{" "}
          of {testimonials.length} testimonials
          {testimonials.length > 0 && (
            <span className="ml-2 text-xs">
              <span className="text-emerald-400">{liveCount} live</span>
              {draftCount > 0 && (
                <span className="text-[var(--muted)]">
                  {" "}
                  · {draftCount} draft{draftCount === 1 ? "" : "s"}
                </span>
              )}
            </span>
          )}
          {search && (
            <span className="ml-2 text-xs">
              matching <span className="font-mono">{`"${search}"`}</span>
            </span>
          )}
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setMode({ kind: "create" })}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New testimonial
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-[var(--muted)]">
            {search
              ? "No testimonials match this search."
              : "No testimonials yet. Publish your first one."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Author</th>
                  <th className="text-left px-3 py-3">Headline</th>
                  <th className="text-left px-3 py-3">Rating</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Created</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isLive = publishedFlag(t);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="px-5 py-3 max-w-xs">
                        <div className="font-medium text-[var(--fg)] truncate">
                          {t.name}
                        </div>
                        <div className="text-xs text-[var(--muted)] truncate">
                          {t.role}
                        </div>
                      </td>
                      <td className="px-3 py-3 max-w-md text-[var(--fg)] truncate">
                        {t.headline}
                      </td>
                      <td className="px-3 py-3">
                        <div className="inline-flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= t.rating
                                  ? "fill-primary text-primary"
                                  : "text-[var(--muted)]"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleTogglePublished(t)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                            isLive
                              ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                              : "bg-[var(--surface-hover)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                          }`}
                          title={
                            isLive
                              ? "Live — click to hide from homepage"
                              : "Draft — click to publish to homepage"
                          }
                        >
                          {isLive ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Live
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Draft
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-[var(--muted)] tabular-nums whitespace-nowrap">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMode({ kind: "edit", row: t })}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(t)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium text-white ${
            notice.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {notice.message}
        </div>
      )}

      <ConfirmModal
        open={confirming !== null}
        title="Delete this testimonial?"
        message={
          confirming ? (
            <>
              The review from{" "}
              <span className="font-semibold text-[var(--fg)]">
                {confirming.name}
              </span>{" "}
              will be removed permanently.
            </>
          ) : (
            ""
          )
        }
        warning="This can't be undone."
        confirmLabel="Delete testimonial"
        pendingLabel="Deleting…"
        variant="destructive"
        busy={isPending}
        onConfirm={() => confirming && runDelete(confirming)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
