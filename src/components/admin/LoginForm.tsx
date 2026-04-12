"use client";

import { useActionState } from "react";
import { ArrowRight, Lock, User } from "lucide-react";
import { signIn, signInInitial } from "@/lib/auth-actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, signInInitial);

  return (
    <form action={formAction} className="space-y-6">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="space-y-2">
        <label
          htmlFor="login-email"
          className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
        >
          Admin Email
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            id="login-email"
            name="email"
            type="email"
            required
            placeholder="admin@4pielabs.com"
            autoComplete="email"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="login-password"
          className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            id="login-password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
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
        className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
      >
        {pending ? "Authenticating..." : "Access Portal"}
        {!pending && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}
