"use client";

import type {
  AgreementFieldValues,
  DocType,
  WelcomePackFieldValues,
} from "@/lib/documents/types";

/**
 * Readable HTML preview of the filled document. The user spec
 * explicitly allows "doesn't need to pixel-match the DOCX" - the
 * point is to give the operator confidence that the values they've
 * entered will render correctly when exported.
 *
 * The preview groups fields into the same semantic sections the
 * .docx templates use (intro / deliverables / contacts for
 * welcome_pack; parties / commercial / payment / signatures for
 * client_agreement). Missing fields render with a muted
 * "(not set)" placeholder so the operator can see at a glance
 * what's still incomplete.
 */
export function DocumentPreview({
  docType,
  values,
}: {
  docType: DocType;
  values: Record<string, string>;
}) {
  return (
    <aside className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-7 sticky top-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
      <div className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-widest mb-4">
        Live preview
      </div>
      {docType === "welcome_pack" ? (
        <WelcomePackPreview values={values as Partial<WelcomePackFieldValues>} />
      ) : (
        <AgreementPreview values={values as Partial<AgreementFieldValues>} />
      )}
    </aside>
  );
}

function WelcomePackPreview({
  values,
}: {
  values: Partial<WelcomePackFieldValues>;
}) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <div className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">
          Welcome Pack
        </div>
        <h3 className="text-lg font-semibold text-[var(--fg)] leading-snug">
          Welcome, <Value v={values.CLIENT_NAME} />
        </h3>
        <p className="text-xs text-[var(--muted)] mt-1">
          <Value v={values.CLIENT_BUSINESS_NAME} fallback="business name" />
        </p>
      </div>

      <Section title="Program">
        <Row label="Tier" value={values.PROGRAM} />
        <Row label="Start" value={values.START_DATE} />
        <Row label="Service area" value={values.SERVICE_AREA} />
        <Row label="Main contact" value={values.MAIN_CONTACT} />
      </Section>

      <Section title="First 90 days">
        <ol className="space-y-1.5 list-decimal list-inside text-[var(--fg)]/85">
          <li><Value v={values.DELIVERABLE_1} /></li>
          <li><Value v={values.DELIVERABLE_2} /></li>
          <li><Value v={values.DELIVERABLE_3} /></li>
          <li><Value v={values.DELIVERABLE_4} /></li>
          <li><Value v={values.DELIVERABLE_5} /></li>
        </ol>
      </Section>

      <Section title="Resources">
        <Row label="Portal" value={values.PORTAL_LINK} />
      </Section>
    </div>
  );
}

function AgreementPreview({
  values,
}: {
  values: Partial<AgreementFieldValues>;
}) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <div className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">
          Client Agreement
        </div>
        <h3 className="text-lg font-semibold text-[var(--fg)] leading-snug">
          <Value v={values.CLIENT_LEGAL_NAME} fallback="Legal entity" />
        </h3>
        <p className="text-xs text-[var(--muted)] mt-1 whitespace-pre-line">
          <Value v={values.CLIENT_ADDRESS} />
        </p>
      </div>

      <Section title="Engagement">
        <Row label="Program" value={values.PROGRAM} />
        <Row label="Monthly fee" value={values.MONTHLY_FEE} />
        <Row label="Minimum term" value={values.MINIMUM_TERM} />
        <Row label="Start" value={values.START_DATE} />
        <Row label="Billing day" value={values.BILLING_DAY} />
        <Row label="Service area" value={values.SERVICE_AREA} />
        <Row label="Ad spend" value={values.AD_SPEND} />
        <Row label="Setup fees" value={values.SETUP_FEES} />
        <Row label="Approval window" value={values.APPROVAL_DAYS} />
      </Section>

      <Section title="Payment">
        <Row label="Method" value={values.PAYMENT_METHOD} />
        <Row label="Account name" value={values.ACCOUNT_NAME} />
        <Row label="Routing" value={values.ACCOUNT_ROUTING} />
        <Row label="Bank" value={values.BANK_NAME} />
        <Row label="Invoice link" value={values.INVOICE_LINK} />
        <Row label="Reference" value={values.PAYMENT_REFERENCE} />
      </Section>

      <Section title="Legal">
        <Row label="Governing law" value={values.GOVERNING_LAW} />
      </Section>

      <Section title="Signatures">
        <Row label="Client signatory" value={values.AUTHORISED_SIGNATORY} />
        <Row label="Client title" value={values.CLIENT_SIGNATORY_TITLE} />
        <Row label="Client signs" value={values.CLIENT_SIGN_DATE} />
        <Row label="Agency title" value={values.AGENCY_SIGNATORY_TITLE} />
        <Row label="Agency signs" value={values.AGENCY_SIGN_DATE} />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-2 border-t border-[var(--border)] pt-4">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-xs">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-[var(--fg)]/90 break-words">
        <Value v={value} />
      </span>
    </div>
  );
}

function Value({
  v,
  fallback = "not set",
}: {
  v: string | undefined;
  fallback?: string;
}) {
  if (!v || v.trim().length === 0) {
    return <span className="text-[var(--muted)]/60 italic">({fallback})</span>;
  }
  return <>{v}</>;
}
