"use client";

import { useActionState } from "react";
import { ArrowRight, Lock, User } from "lucide-react";
import { signIn } from "@/lib/auth-actions";
import { signInInitial } from "@/lib/form-types";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, signInInitial);

  return (
    <form action={formAction} className="space-y-6">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="space-y-2">
        <label
          htmlFor="login-email"
          className="text-xs font-medium text-[var(--muted)] ml-1"
        >
          Admin Email
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            id="login-email"
            name="email"
            type="email"
            required
            placeholder="admin@4pielabs.com"
            autoComplete="email"
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 pl-11 pr-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="login-password"
          className="text-xs font-medium text-[var(--muted)] ml-1"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            id="login-password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 pl-11 pr-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]"
          />
        </div>
      </div>

      {state.status === "error" && state.message && (
        <p aria-live="polite" className="text-red-400 text-xs text-center font-medium">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {pending ? "Authenticating..." : "Access Portal"}
        {!pending && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}
