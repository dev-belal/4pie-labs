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
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full glass-morphism rounded-[32px] border border-red-500/20 p-8 md:p-10 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="text-2xl font-display font-semibold">
            Something broke on the booking page
          </h1>
        </div>

        <p className="text-white/60 mb-6 text-sm">
          This page had a runtime error. The details below will help us fix it.
        </p>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6 font-mono text-xs leading-relaxed overflow-x-auto">
          <div className="text-red-300 font-bold mb-2">
            {error.name}: {error.message}
          </div>
          {error.digest && (
            <div className="text-white/40 mb-2">digest: {error.digest}</div>
          )}
          {error.stack && (
            <pre className="text-white/50 whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </main>
  );
}
