"use client";

import { useState, useTransition } from "react";
import { Download, Loader2, Save } from "lucide-react";
import {
  createClientDocument,
  updateClientDocument,
} from "@/lib/document-actions";
import {
  AD_SPEND_OPTIONS,
  emptyAgreement,
  PAYMENT_METHOD_OPTIONS,
  PROGRAM_TIERS,
  type AdSpendStructure,
  type AgreementFieldValues,
  type PaymentMethod,
  type ProgramTier,
} from "@/lib/documents/types";
import { agreementDefaultsForTier } from "@/lib/documents/program-tiers";
import { DocumentPreview } from "./DocumentPreview";

/**
 * Client Agreement editor. Mirrors the Welcome Pack editor's
 * structure, but with 24 token fields and 3 closed-set dropdowns
 * (PROGRAM, AD_SPEND, PAYMENT_METHOD).
 *
 * CLIENT_LEGAL_NAME is the row-level label - it's what shows up in
 * the list view's client_name column. Deliberately SEPARATE from
 * the Welcome Pack's CLIENT_NAME (friendly): the agreement is
 * legally binding and references the registered entity, the
 * welcome pack uses the display name. Two distinct inputs, never
 * merged - per the operator brief.
 *
 * PROGRAM auto-fill: picking a tier sets MINIMUM_TERM + MONTHLY_FEE
 * from the tier defaults table. Both editable after; switching the
 * tier later overwrites again.
 */
export function AgreementEditor({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: { id: string; client_name: string; field_values: Record<string, string> };
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<AgreementFieldValues>(() =>
    initial ? mergeIntoEmpty(initial.field_values) : emptyAgreement(),
  );
  const [savedId, setSavedId] = useState<string | null>(initial?.id ?? null);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const setField = <K extends keyof AgreementFieldValues>(
    key: K,
    value: AgreementFieldValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleProgramChange = (next: ProgramTier | "") => {
    setValues((prev) => {
      const merged: AgreementFieldValues = { ...prev, PROGRAM: next };
      const defaults = agreementDefaultsForTier(next);
      if (defaults) {
        Object.assign(merged, defaults);
      }
      return merged;
    });
  };

  const save = () => {
    if (!values.CLIENT_LEGAL_NAME.trim()) {
      setNotice({
        type: "error",
        message: "Client legal name is required.",
      });
      window.setTimeout(() => setNotice(null), 3500);
      return;
    }
    startTransition(async () => {
      // values has union-typed PROGRAM / AD_SPEND / PAYMENT_METHOD
      // at the type level; at runtime every field is a string.
      // Bridge through unknown rather than a narrower assertion.
      const fieldValues = values as unknown as Record<string, string>;
      let nextId: string;
      if (savedId) {
        const res = await updateClientDocument({
          id: savedId,
          client_name: values.CLIENT_LEGAL_NAME,
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
          doc_type: "client_agreement",
          client_name: values.CLIENT_LEGAL_NAME,
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
              {savedId ? "Edit Client Agreement" : "New Client Agreement"}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              CLIENT_LEGAL_NAME drives the saved label. Keep it the
              full legal entity name.
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

        <FieldGroup title="Parties">
          <Field label="Client legal name" htmlFor="ag-CLIENT_LEGAL_NAME">
            <input
              id="ag-CLIENT_LEGAL_NAME"
              type="text"
              required
              value={values.CLIENT_LEGAL_NAME}
              onChange={(e) => setField("CLIENT_LEGAL_NAME", e.target.value)}
              placeholder="Acme Painting, LLC"
              className={inputClass}
            />
          </Field>
          <Field label="Business / trading name" htmlFor="ag-CLIENT_BUSINESS_NAME">
            <input
              id="ag-CLIENT_BUSINESS_NAME"
              type="text"
              value={values.CLIENT_BUSINESS_NAME}
              onChange={(e) => setField("CLIENT_BUSINESS_NAME", e.target.value)}
              placeholder="Acme Painting"
              className={inputClass}
            />
          </Field>
          <Field label="Client address" htmlFor="ag-CLIENT_ADDRESS">
            <textarea
              id="ag-CLIENT_ADDRESS"
              value={values.CLIENT_ADDRESS}
              onChange={(e) => setField("CLIENT_ADDRESS", e.target.value)}
              rows={2}
              placeholder="123 Main St&#10;Portland, OR 97201"
              className={`${inputClass} resize-y min-h-[64px]`}
            />
          </Field>
        </FieldGroup>

        <FieldGroup title="Engagement">
          <Field label="Program" htmlFor="ag-PROGRAM">
            <select
              id="ag-PROGRAM"
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly fee" htmlFor="ag-MONTHLY_FEE">
              <input
                id="ag-MONTHLY_FEE"
                type="text"
                value={values.MONTHLY_FEE}
                onChange={(e) => setField("MONTHLY_FEE", e.target.value)}
                placeholder="$1,500"
                className={inputClass}
              />
            </Field>
            <Field label="Minimum term" htmlFor="ag-MINIMUM_TERM">
              <input
                id="ag-MINIMUM_TERM"
                type="text"
                value={values.MINIMUM_TERM}
                onChange={(e) => setField("MINIMUM_TERM", e.target.value)}
                placeholder="6 months"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" htmlFor="ag-START_DATE">
              <input
                id="ag-START_DATE"
                type="text"
                value={values.START_DATE}
                onChange={(e) => setField("START_DATE", e.target.value)}
                placeholder="15 July 2026"
                className={inputClass}
              />
            </Field>
            <Field label="Billing day" htmlFor="ag-BILLING_DAY">
              <input
                id="ag-BILLING_DAY"
                type="text"
                value={values.BILLING_DAY}
                onChange={(e) => setField("BILLING_DAY", e.target.value)}
                placeholder="1st"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Service area" htmlFor="ag-SERVICE_AREA">
            <input
              id="ag-SERVICE_AREA"
              type="text"
              value={values.SERVICE_AREA}
              onChange={(e) => setField("SERVICE_AREA", e.target.value)}
              placeholder="Portland metro"
              className={inputClass}
            />
          </Field>
          <Field label="Ad spend structure" htmlFor="ag-AD_SPEND">
            <select
              id="ag-AD_SPEND"
              value={values.AD_SPEND}
              onChange={(e) =>
                setField("AD_SPEND", e.target.value as AdSpendStructure | "")
              }
              className={inputClass}
            >
              <option value="">Choose…</option>
              {AD_SPEND_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Setup fees" htmlFor="ag-SETUP_FEES">
              <input
                id="ag-SETUP_FEES"
                type="text"
                value={values.SETUP_FEES}
                onChange={(e) => setField("SETUP_FEES", e.target.value)}
                placeholder="$0"
                className={inputClass}
              />
            </Field>
            <Field label="Approval window (days)" htmlFor="ag-APPROVAL_DAYS">
              <input
                id="ag-APPROVAL_DAYS"
                type="text"
                value={values.APPROVAL_DAYS}
                onChange={(e) => setField("APPROVAL_DAYS", e.target.value)}
                placeholder="3 business days"
                className={inputClass}
              />
            </Field>
          </div>
        </FieldGroup>

        <FieldGroup title="Payment">
          <Field label="Payment method" htmlFor="ag-PAYMENT_METHOD">
            <select
              id="ag-PAYMENT_METHOD"
              value={values.PAYMENT_METHOD}
              onChange={(e) =>
                setField(
                  "PAYMENT_METHOD",
                  e.target.value as PaymentMethod | "",
                )
              }
              className={inputClass}
            >
              <option value="">Choose…</option>
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Account name" htmlFor="ag-ACCOUNT_NAME">
              <input
                id="ag-ACCOUNT_NAME"
                type="text"
                value={values.ACCOUNT_NAME}
                onChange={(e) => setField("ACCOUNT_NAME", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Account / routing" htmlFor="ag-ACCOUNT_ROUTING">
              <input
                id="ag-ACCOUNT_ROUTING"
                type="text"
                value={values.ACCOUNT_ROUTING}
                onChange={(e) =>
                  setField("ACCOUNT_ROUTING", e.target.value)
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Bank name" htmlFor="ag-BANK_NAME">
            <input
              id="ag-BANK_NAME"
              type="text"
              value={values.BANK_NAME}
              onChange={(e) => setField("BANK_NAME", e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice link" htmlFor="ag-INVOICE_LINK">
              <input
                id="ag-INVOICE_LINK"
                type="text"
                value={values.INVOICE_LINK}
                onChange={(e) => setField("INVOICE_LINK", e.target.value)}
                placeholder="https://invoice.stripe.com/…"
                className={inputClass}
              />
            </Field>
            <Field label="Payment reference" htmlFor="ag-PAYMENT_REFERENCE">
              <input
                id="ag-PAYMENT_REFERENCE"
                type="text"
                value={values.PAYMENT_REFERENCE}
                onChange={(e) =>
                  setField("PAYMENT_REFERENCE", e.target.value)
                }
                placeholder="ACME-2026"
                className={inputClass}
              />
            </Field>
          </div>
        </FieldGroup>

        <FieldGroup title="Legal">
          <Field label="Governing law" htmlFor="ag-GOVERNING_LAW">
            <input
              id="ag-GOVERNING_LAW"
              type="text"
              value={values.GOVERNING_LAW}
              onChange={(e) => setField("GOVERNING_LAW", e.target.value)}
              placeholder="Oregon, USA"
              className={inputClass}
            />
          </Field>
        </FieldGroup>

        <FieldGroup title="Signatures">
          <Field label="Authorised signatory (client)" htmlFor="ag-AUTHORISED_SIGNATORY">
            <input
              id="ag-AUTHORISED_SIGNATORY"
              type="text"
              value={values.AUTHORISED_SIGNATORY}
              onChange={(e) =>
                setField("AUTHORISED_SIGNATORY", e.target.value)
              }
              placeholder="Jane Doe"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client signatory title" htmlFor="ag-CLIENT_SIGNATORY_TITLE">
              <input
                id="ag-CLIENT_SIGNATORY_TITLE"
                type="text"
                value={values.CLIENT_SIGNATORY_TITLE}
                onChange={(e) =>
                  setField("CLIENT_SIGNATORY_TITLE", e.target.value)
                }
                placeholder="Owner"
                className={inputClass}
              />
            </Field>
            <Field label="Client sign date" htmlFor="ag-CLIENT_SIGN_DATE">
              <input
                id="ag-CLIENT_SIGN_DATE"
                type="text"
                value={values.CLIENT_SIGN_DATE}
                onChange={(e) =>
                  setField("CLIENT_SIGN_DATE", e.target.value)
                }
                placeholder="10 July 2026"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Agency signatory title" htmlFor="ag-AGENCY_SIGNATORY_TITLE">
              <input
                id="ag-AGENCY_SIGNATORY_TITLE"
                type="text"
                value={values.AGENCY_SIGNATORY_TITLE}
                onChange={(e) =>
                  setField("AGENCY_SIGNATORY_TITLE", e.target.value)
                }
                placeholder="Founder, 4Pie Labs"
                className={inputClass}
              />
            </Field>
            <Field label="Agency sign date" htmlFor="ag-AGENCY_SIGN_DATE">
              <input
                id="ag-AGENCY_SIGN_DATE"
                type="text"
                value={values.AGENCY_SIGN_DATE}
                onChange={(e) =>
                  setField("AGENCY_SIGN_DATE", e.target.value)
                }
                placeholder="10 July 2026"
                className={inputClass}
              />
            </Field>
          </div>
        </FieldGroup>
      </form>

      <DocumentPreview
        docType="client_agreement"
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

function mergeIntoEmpty(
  saved: Record<string, string>,
): AgreementFieldValues {
  const empty = emptyAgreement();
  const out: Record<string, string> = { ...empty };
  for (const k of Object.keys(empty)) {
    if (saved[k] != null) out[k] = saved[k];
  }
  return out as unknown as AgreementFieldValues;
}
