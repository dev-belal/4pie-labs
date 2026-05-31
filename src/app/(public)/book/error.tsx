"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Surfaces the real error instead of letting Vercel show its generic
 * platform 500 page. Remove or slim down once the booking flow is stable.
 */
export default function BookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/book] render error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full bg-surface border border-error/30 rounded-2xl shadow-[var(--shadow-card)] p-7 md:p-9">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-11 h-11 rounded-xl bg-error/15 grid place-items-center">
            <AlertTriangle className="w-5 h-5 text-error" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Something broke on the booking page
          </h1>
        </div>

        <p className="text-muted-foreground mb-6 text-sm">
          This page hit a runtime error. The details below will help us fix
          it.
        </p>

        <div className="bg-surface-2 border border-border rounded-lg p-4 mb-6 font-mono text-xs leading-relaxed overflow-x-auto">
          <div className="text-error font-semibold mb-2">
            {error.name}: {error.message}
          </div>
          {error.digest && (
            <div className="text-subtle-foreground mb-2">
              digest: {error.digest}
            </div>
          )}
          {error.stack && (
            <pre className="text-muted-foreground whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>

        <button
          type="button"
          onClick={reset}
          className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Try again
        </button>
      </div>
    </main>
  );
}
