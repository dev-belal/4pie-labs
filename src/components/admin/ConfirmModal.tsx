"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "./Modal";

export type ConfirmVariant = "destructive" | "warning" | "default";

/**
 * Branded admin confirm dialog. Replaces every window.confirm() call site
 * across the admin panels: delete blog, delete lead, delete testimonial,
 * delete opportunity, delete pipeline stage, archive pipeline.
 *
 * Pure UI primitive: does NOT run server actions and does NOT own toasts.
 * Callers handle their own optimistic UI + server-action + toast flow;
 * this component only renders the dialog and calls back when the user
 * clicks confirm / cancel.
 *
 * Focus management:
 *   - destructive + warning variants auto-focus CANCEL on open, so an
 *     accidental Enter does not fire a delete. The user has to
 *     deliberately tab/click to the confirm button.
 *   - default variant focuses CONFIRM (Enter == "yes, proceed").
 *
 * Dismissal:
 *   - Esc key cancels.
 *   - Click-outside (on the scrim) cancels.
 *   - Both are gated by `busy` (no dismiss mid-action) so the server
 *     action always sees a single click and the caller's optimistic
 *     state can't get out of sync.
 */
export function ConfirmModal({
  open,
  title,
  message,
  warning,
  confirmLabel,
  pendingLabel,
  variant = "destructive",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  /** String OR ReactNode so callers can inline a <strong> on the entity name. */
  message: React.ReactNode;
  /** Optional separate strip with an AlertTriangle icon. */
  warning?: string;
  confirmLabel: string;
  /** Label shown on the confirm button while busy. Defaults to "Working…". */
  pendingLabel?: string;
  variant?: ConfirmVariant;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  // Focus the safe option on open. Re-runs whenever `open` flips so a
  // re-open of the same modal instance refocuses correctly.
  useEffect(() => {
    if (!open) return;
    const target =
      variant === "destructive" || variant === "warning"
        ? cancelRef.current
        : confirmRef.current;
    target?.focus();
  }, [open, variant]);

  // Block dismiss when busy so the user can't tear down the modal
  // mid-server-action and leave the optimistic UI out of sync with
  // whatever the server eventually returns.
  const cancel = () => {
    if (busy) return;
    onCancel();
  };

  // ----- Variant -> tailwind classes for the confirm button + warning strip
  const confirmClass =
    variant === "destructive"
      ? "bg-red-500 hover:bg-red-500/90 text-white"
      : variant === "warning"
        ? "bg-amber-500 hover:bg-amber-500/90 text-white"
        : "bg-primary hover:opacity-90 text-on-primary";

  const warningClass =
    variant === "destructive"
      ? "bg-red-500/10 border-red-500/30 text-red-300"
      : variant === "warning"
        ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
        : "bg-[var(--accent-softer)] border-primary/20 text-[var(--fg)]";

  const iconClass =
    variant === "destructive"
      ? "text-red-400"
      : variant === "warning"
        ? "text-amber-400"
        : "text-primary";

  return (
    <Modal
      open={open}
      onClose={cancel}
      dismissOnScrimClick={!busy}
      dismissOnEscape={!busy}
    >
      <Modal.Card ariaLabel={title} role="alertdialog">
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--fg)]">
              {title}
            </h3>
            <div className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              {message}
            </div>
          </div>

          {warning && (
            <div
              className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${warningClass}`}
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${iconClass}`}
              />
              <span>{warning}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              ref={cancelRef}
              type="button"
              onClick={cancel}
              disabled={busy}
              className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)] transition-colors"
            >
              Cancel
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] focus-visible:ring-current transition-colors ${confirmClass}`}
            >
              {busy && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
              )}
              {busy ? (pendingLabel ?? "Working…") : confirmLabel}
            </button>
          </div>
        </div>
      </Modal.Card>
    </Modal>
  );
}
