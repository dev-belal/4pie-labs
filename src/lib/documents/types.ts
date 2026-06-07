/**
 * Shared types for the Client Documents admin feature. The two doc
 * types (Welcome Pack, Client Agreement) live in the same
 * `client_documents` table (jsonb field_values column) and render
 * through the same docxtemplater pipeline, but their field SHAPES
 * differ - the agreement carries ~24 legal/billing tokens, the
 * welcome pack carries ~12 onboarding tokens.
 *
 * Each FieldValues type's keys are the LITERAL template placeholder
 * names from the .docx files in src/lib/documents/templates/. The
 * render helper (commit 3) hands the whole object straight to
 * docxtemplater - no key translation in between.
 */

export type DocType = "welcome_pack" | "client_agreement";

export const DOC_TYPES: readonly DocType[] = [
  "welcome_pack",
  "client_agreement",
] as const;

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  welcome_pack: "Welcome Pack",
  client_agreement: "Client Agreement",
};

/**
 * The 4 program tiers shown in the homepage Programs section.
 * Drives the PROGRAM dropdown + the auto-fill mapping for term /
 * monthly fee / deliverables on both forms (see ./program-tiers.ts).
 */
export type ProgramTier = "Core" | "Pipeline" | "Operating System" | "Pulse";

export const PROGRAM_TIERS: readonly ProgramTier[] = [
  "Core",
  "Pipeline",
  "Operating System",
  "Pulse",
] as const;

/**
 * Closed-set dropdowns on the agreement form. Strings match what the
 * .docx template eventually renders, so the form's <option value> is
 * the rendered text verbatim.
 */
export type AdSpendStructure =
  | "Client-funded directly"
  | "Pre-funded & managed";

export const AD_SPEND_OPTIONS: readonly AdSpendStructure[] = [
  "Client-funded directly",
  "Pre-funded & managed",
] as const;

export type PaymentMethod =
  | "Bank transfer (ACH/Wire)"
  | "Stripe"
  | "Card";

export const PAYMENT_METHOD_OPTIONS: readonly PaymentMethod[] = [
  "Bank transfer (ACH/Wire)",
  "Stripe",
  "Card",
] as const;

/**
 * Welcome Pack field shape - 12 placeholder tokens from
 * Fourpie_Labs_Welcome_Pack_TEMPLATE.docx. Keys match the literal
 * {{TOKEN}} names. PROGRAM is constrained to ProgramTier; everything
 * else is free text the operator types in or auto-fills.
 */
export interface WelcomePackFieldValues {
  CLIENT_NAME: string;
  CLIENT_BUSINESS_NAME: string;
  PROGRAM: ProgramTier | "";
  START_DATE: string;
  SERVICE_AREA: string;
  MAIN_CONTACT: string;
  DELIVERABLE_1: string;
  DELIVERABLE_2: string;
  DELIVERABLE_3: string;
  DELIVERABLE_4: string;
  DELIVERABLE_5: string;
  PORTAL_LINK: string;
}

/**
 * Client Agreement field shape - 24 placeholder tokens from
 * Fourpie_Labs_Client_Agreement_TEMPLATE.docx. CLIENT_LEGAL_NAME is
 * SEPARATE from the welcome pack's CLIENT_NAME by design (the
 * agreement is legally binding and references the registered entity;
 * the welcome pack uses the friendlier display name).
 */
export interface AgreementFieldValues {
  CLIENT_LEGAL_NAME: string;
  CLIENT_BUSINESS_NAME: string;
  CLIENT_ADDRESS: string;
  PROGRAM: ProgramTier | "";
  MONTHLY_FEE: string;
  MINIMUM_TERM: string;
  START_DATE: string;
  BILLING_DAY: string;
  SERVICE_AREA: string;
  AD_SPEND: AdSpendStructure | "";
  SETUP_FEES: string;
  APPROVAL_DAYS: string;
  PAYMENT_METHOD: PaymentMethod | "";
  ACCOUNT_NAME: string;
  ACCOUNT_ROUTING: string;
  BANK_NAME: string;
  INVOICE_LINK: string;
  PAYMENT_REFERENCE: string;
  GOVERNING_LAW: string;
  AUTHORISED_SIGNATORY: string;
  CLIENT_SIGNATORY_TITLE: string;
  CLIENT_SIGN_DATE: string;
  AGENCY_SIGNATORY_TITLE: string;
  AGENCY_SIGN_DATE: string;
}

/**
 * Union over the two field-value shapes. The DB column
 * `field_values jsonb` accepts either; the doc_type discriminator
 * tells the application which shape to expect when reading a row
 * back.
 */
export type ClientDocumentFieldValues =
  | WelcomePackFieldValues
  | AgreementFieldValues;

/**
 * Row shape returned by the admin-data fetcher. Mirrors the columns
 * defined in supabase/migrations/0012_client_documents.sql.
 *
 * field_values is typed as `Record<string, string>` rather than the
 * discriminated union above because Supabase returns jsonb as a
 * plain object - the consumer (forms / render helper) is responsible
 * for branching on doc_type and treating the values accordingly.
 */
export interface ClientDocumentRow {
  id: string;
  doc_type: DocType;
  client_name: string;
  field_values: Record<string, string>;
  created_at: string;
  updated_at: string;
}

/**
 * Empty-value seed for each doc type. Used by the editor when the
 * operator clicks "New" so every controlled input starts as a
 * non-undefined string (React's controlled-input requirement).
 */
export function emptyWelcomePack(): WelcomePackFieldValues {
  return {
    CLIENT_NAME: "",
    CLIENT_BUSINESS_NAME: "",
    PROGRAM: "",
    START_DATE: "",
    SERVICE_AREA: "",
    MAIN_CONTACT: "",
    DELIVERABLE_1: "",
    DELIVERABLE_2: "",
    DELIVERABLE_3: "",
    DELIVERABLE_4: "",
    DELIVERABLE_5: "",
    PORTAL_LINK: "",
  };
}

export function emptyAgreement(): AgreementFieldValues {
  return {
    CLIENT_LEGAL_NAME: "",
    CLIENT_BUSINESS_NAME: "",
    CLIENT_ADDRESS: "",
    PROGRAM: "",
    MONTHLY_FEE: "",
    MINIMUM_TERM: "",
    START_DATE: "",
    BILLING_DAY: "",
    SERVICE_AREA: "",
    AD_SPEND: "",
    SETUP_FEES: "",
    APPROVAL_DAYS: "",
    PAYMENT_METHOD: "",
    ACCOUNT_NAME: "",
    ACCOUNT_ROUTING: "",
    BANK_NAME: "",
    INVOICE_LINK: "",
    PAYMENT_REFERENCE: "",
    GOVERNING_LAW: "",
    AUTHORISED_SIGNATORY: "",
    CLIENT_SIGNATORY_TITLE: "",
    CLIENT_SIGN_DATE: "",
    AGENCY_SIGNATORY_TITLE: "",
    AGENCY_SIGN_DATE: "",
  };
}
