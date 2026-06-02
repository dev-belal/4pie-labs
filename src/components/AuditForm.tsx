"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { submitAuditLead } from "@/lib/actions";
import { initialFormState } from "@/lib/form-types";

/**
 * Phase 3 audit lead form - posts to submitAuditLead which validates with
 * auditLeadSchema and inserts into the leads table under source "Free AI
 * audit" (type "contact" since the lead_type enum doesn't have an "audit"
 * value; the source string is the discriminator the admin panel uses).
 */
export function AuditForm() {
  const [state, formAction, pending] = useActionState(
    submitAuditLead,
    initialFormState,
  );

  if (state.status === "success") {
    return (
      <div className="bg-surface border border-card-border rounded-2xl p-8 md:p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-success/15 grid place-items-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-success" />
        </div>
        <h2 className="text-xl font-semibold mb-2 tracking-tight">
          You&apos;re booked.
        </h2>
        <p className="text-muted-foreground text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="bg-surface border border-card-border rounded-2xl p-6 md:p-10 space-y-5"
    >
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Request your audit
        </h2>
        <p className="text-muted-foreground text-sm">
          Five fields, two minutes. Audit report emailed within 48 hours.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field id="audit-name" name="name" label="Your name" required placeholder="Jane Doe" error={state.errors?.name?.[0]} />
        <Field id="audit-email" name="email" type="email" label="Work email" required placeholder="jane@acme.com" error={state.errors?.email?.[0]} />
      </div>

      <Field
        id="audit-business"
        name="businessName"
        label="Business name"
        required
        placeholder="Acme Painting Co."
        error={state.errors?.businessName?.[0]}
      />

      <Field
        id="audit-url"
        name="businessUrl"
        label="Website URL"
        required
        placeholder="example.com or https://example.com"
        error={state.errors?.businessUrl?.[0]}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="audit-industry"
            className="block text-sm font-medium text-foreground"
          >
            Industry
          </label>
          <select
            id="audit-industry"
            name="industry"
            defaultValue=""
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          >
            <option value="">Select…</option>
            <option>Painting contractor</option>
            <option>Tour operator</option>
            <option>Other local service</option>
          </select>
        </div>
        <Field
          id="audit-budget"
          name="monthlyBudget"
          label="Monthly marketing budget (optional)"
          placeholder="$5K – $15K"
          error={state.errors?.monthlyBudget?.[0]}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="audit-notes"
          className="block text-sm font-medium text-foreground"
        >
          Anything we should know? (optional)
        </label>
        <textarea
          id="audit-notes"
          name="notes"
          rows={3}
          placeholder="Top competitors, target markets, current pain points…"
          className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-y"
        />
        {state.errors?.notes?.[0] && (
          <p className="text-xs text-error">{state.errors.notes[0]}</p>
        )}
      </div>

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
        {pending ? "Submitting…" : "Get my audit"}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
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
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
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
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
