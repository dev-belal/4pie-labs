"use client";

import { useState, useTransition } from "react";
import { Download, Loader2, Save } from "lucide-react";
import {
  createClientDocument,
  updateClientDocument,
} from "@/lib/document-actions";
import {
  emptyWelcomePack,
  PROGRAM_TIERS,
  type ProgramTier,
  type WelcomePackFieldValues,
} from "@/lib/documents/types";
import { welcomePackDefaultsForTier } from "@/lib/documents/program-tiers";
import { DocumentPreview } from "./DocumentPreview";

/**
 * Welcome Pack editor. Single controlled values object keyed by the
 * literal {{TOKEN}} names, so saving is a no-translation copy into
 * field_values jsonb.
 *
 * PROGRAM auto-fill: picking a tier overwrites DELIVERABLE_1..5
 * unconditionally. The operator can still edit any deliverable
 * AFTER picking the tier. If they pick a different tier later,
 * the deliverables overwrite again - that's the documented
 * behaviour (any post-pick edits are intended to refine THAT
 * tier's defaults, not to survive a tier switch).
 *
 * Save flow: createClientDocument on first save (returns id, panel
 * pivots to edit mode in place via onSaved). updateClientDocument
 * thereafter. Export button is a plain <a href> to the route
 * handler from commit 3; only enabled once there's an id.
 */
export function WelcomePackEditor({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: { id: string; client_name: string; field_values: Record<string, string> };
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<WelcomePackFieldValues>(() =>
    initial ? mergeIntoEmpty(initial.field_values) : emptyWelcomePack(),
  );
  const [savedId, setSavedId] = useState<string | null>(initial?.id ?? null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const setField = <K extends keyof WelcomePackFieldValues>(
    key: K,
    value: WelcomePackFieldValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleProgramChange = (next: ProgramTier | "") => {
    setValues((prev) => {
      const merged: WelcomePackFieldValues = { ...prev, PROGRAM: next };
      const defaults = welcomePackDefaultsForTier(next);
      if (defaults) {
        Object.assign(merged, defaults);
      }
      return merged;
    });
  };

  const save = () => {
    if (!values.CLIENT_NAME.trim()) {
      setNotice({ type: "error", message: "Client name is required." });
      window.setTimeout(() => setNotice(null), 3500);
      return;
    }
    startTransition(async () => {
      // CLIENT_NAME is the display-row label for Welcome Packs.
      // Mirroring it into the client_name column means the list
      // view doesn't need a jsonb pluck per row.
      //
      // values is { ..., PROGRAM: ProgramTier | "" } at the type
      // level; at runtime every field is a string. Bridge through
      // unknown rather than a narrower assertion.
      const fieldValues = values as unknown as Record<string, string>;
      let nextId: string;
      if (savedId) {
        const res = await updateClientDocument({
          id: savedId,
          client_name: values.CLIENT_NAME,
          field_values: fieldValues,
        });
        if (!res.ok) {
          setNotice({ type: "error", message: res.error });
          window.setTimeout(() => setNotice(null), 4000);
          return;
        }
        nextId = savedId;
      } else {
        const res = await createClientDocument({
          doc_type: "welcome_pack",
          client_name: values.CLIENT_NAME,
          field_values: fieldValues,
        });
        if (!res.ok) {
          setNotice({ type: "error", message: res.error });
          window.setTimeout(() => setNotice(null), 4000);
          return;
        }
        nextId = res.id;
        setSavedId(nextId);
      }
      setNotice({ type: "success", message: "Saved." });
      window.setTimeout(() => setNotice(null), 2500);
      onSaved(nextId);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-5 bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="text-lg font-semibold text-[var(--fg)]">
              {savedId ? "Edit Welcome Pack" : "New Welcome Pack"}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              Live preview reflects every change. Export once saved.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </button>
            {savedId && (
              <a
                href={`/admin/documents/${savedId}/export`}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-[var(--accent-soft)] text-[var(--on-soft)] hover:opacity-90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </a>
            )}
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className={`px-3 py-2 rounded-lg text-xs border ${
              notice.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {notice.message}
          </div>
        )}

        <FieldGroup title="Client">
          <Field label="Client name (friendly)" htmlFor="wp-CLIENT_NAME">
            <input
              id="wp-CLIENT_NAME"
              type="text"
              required
              value={values.CLIENT_NAME}
              onChange={(e) => setField("CLIENT_NAME", e.target.value)}
              placeholder="e.g. Acme Painting"
              className={inputClass}
            />
          </Field>
          <Field label="Business name" htmlFor="wp-CLIENT_BUSINESS_NAME">
            <input
              id="wp-CLIENT_BUSINESS_NAME"
              type="text"
              value={values.CLIENT_BUSINESS_NAME}
              onChange={(e) => setField("CLIENT_BUSINESS_NAME", e.target.value)}
              placeholder="Acme Painting, LLC"
              className={inputClass}
            />
          </Field>
        </FieldGroup>

        <FieldGroup title="Engagement">
          <Field label="Program" htmlFor="wp-PROGRAM">
            <select
              id="wp-PROGRAM"
              value={values.PROGRAM}
              onChange={(e) =>
                handleProgramChange(e.target.value as ProgramTier | "")
              }
              className={inputClass}
            >
              <option value="">Choose a tier…</option>
              {PROGRAM_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date" htmlFor="wp-START_DATE">
            <input
              id="wp-START_DATE"
              type="text"
              value={values.START_DATE}
              onChange={(e) => setField("START_DATE", e.target.value)}
              placeholder="15 July 2026"
              className={inputClass}
            />
          </Field>
          <Field label="Service area" htmlFor="wp-SERVICE_AREA">
            <input
              id="wp-SERVICE_AREA"
              type="text"
              value={values.SERVICE_AREA}
              onChange={(e) => setField("SERVICE_AREA", e.target.value)}
              placeholder="Portland metro"
              className={inputClass}
            />
          </Field>
          <Field label="Main contact" htmlFor="wp-MAIN_CONTACT">
            <input
              id="wp-MAIN_CONTACT"
              type="text"
              value={values.MAIN_CONTACT}
              onChange={(e) => setField("MAIN_CONTACT", e.target.value)}
              placeholder="Jane Doe — jane@acmepainting.com"
              className={inputClass}
            />
          </Field>
        </FieldGroup>

        <FieldGroup title="First 90 days">
          <p className="text-xs text-[var(--muted)] -mt-2 mb-2">
            Picking a program seeds these from the tier defaults. Edit
            any line to fit the engagement.
          </p>
          {([1, 2, 3, 4, 5] as const).map((n) => {
            const key = `DELIVERABLE_${n}` as
              | "DELIVERABLE_1"
              | "DELIVERABLE_2"
              | "DELIVERABLE_3"
              | "DELIVERABLE_4"
              | "DELIVERABLE_5";
            return (
              <Field key={key} label={`Deliverable ${n}`} htmlFor={`wp-${key}`}>
                <input
                  id={`wp-${key}`}
                  type="text"
                  value={values[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className={inputClass}
                />
              </Field>
            );
          })}
        </FieldGroup>

        <FieldGroup title="Resources">
          <Field label="Portal link" htmlFor="wp-PORTAL_LINK">
            <input
              id="wp-PORTAL_LINK"
              type="text"
              value={values.PORTAL_LINK}
              onChange={(e) => setField("PORTAL_LINK", e.target.value)}
              placeholder="https://portal.fourpielabs.com/acme"
              className={inputClass}
            />
          </Field>
        </FieldGroup>
      </form>

      <DocumentPreview
        docType="welcome_pack"
        values={values as unknown as Record<string, string>}
      />
    </div>
  );
}

const inputClass =
  "w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all placeholder:text-[var(--muted)]";

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-widest">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-[var(--muted)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Merge a saved field_values jsonb (which may carry only a subset
 * of keys after Phase 1 schema lands) into the empty seed. Ensures
 * every controlled input has a string value on mount even when the
 * row was saved before a template gained a new placeholder.
 */
function mergeIntoEmpty(
  saved: Record<string, string>,
): WelcomePackFieldValues {
  const empty = emptyWelcomePack();
  const out: Record<string, string> = { ...empty };
  for (const k of Object.keys(empty)) {
    if (saved[k] != null) out[k] = saved[k];
  }
  return out as unknown as WelcomePackFieldValues;
}
