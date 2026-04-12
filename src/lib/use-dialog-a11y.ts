"use client";

import { useEffect } from "react";

/**
 * Close-on-Escape + body-scroll-lock for modal dialogs.
 * Pair with role="dialog" + aria-modal="true" on the dialog element.
 */
export function useDialogA11y(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);
}
