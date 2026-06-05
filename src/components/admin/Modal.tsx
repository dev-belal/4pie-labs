"use client";

import { useEffect } from "react";

/**
 * Shared admin modal chrome - centered card on a tinted scrim.
 *
 * Promoted from AddToPipelineModal's local helper so ConfirmModal,
 * AddToPipelineModal, and any future admin dialog all share the same
 * scrim treatment (z-index, blur, click-outside semantics, Esc) and
 * stop drifting visually.
 *
 *   <Modal open={isOpen} onClose={close}>
 *     <Modal.Card className="max-w-md">
 *       ... contents ...
 *     </Modal.Card>
 *   </Modal>
 *
 * Behavior contract:
 *   - Scrim click closes (unless dismissOnScrimClick={false}).
 *   - Esc key closes (unless dismissOnEscape={false}).
 *   - The card stops click propagation so a click *inside* the card
 *     never reaches the scrim's onClose handler.
 *   - Inert when `open` is false - returns null. No portal; mounts
 *     in-tree which is fine because the scrim is fixed inset-0 z-50.
 */
export function Modal({
  open,
  onClose,
  children,
  dismissOnScrimClick = true,
  dismissOnEscape = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dismissOnScrimClick?: boolean;
  dismissOnEscape?: boolean;
}) {
  useEffect(() => {
    if (!open || !dismissOnEscape) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose, dismissOnEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={dismissOnScrimClick ? onClose : undefined}
    >
      {children}
    </div>
  );
}

/**
 * The card that sits inside <Modal>. Stops click propagation so a
 * click inside the card does NOT bubble to the scrim's close handler.
 * Token-themed (dark/light auto via CSS vars).
 *
 * Pass a width class via className (e.g. "max-w-md", "max-w-lg") so
 * each caller can size its own dialog without re-defining the chrome.
 */
function ModalCard({
  className = "max-w-md",
  children,
  role = "dialog",
  ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
}) {
  return (
    <div
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${className} bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl`}
    >
      {children}
    </div>
  );
}

Modal.Card = ModalCard;
