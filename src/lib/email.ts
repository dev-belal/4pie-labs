import { Resend } from "resend";

/**
 * Transactional email module. Used by lead-capture server actions as an
 * additive side effect: every send is best-effort, wrapped in try/catch, and
 * NEVER throws or rejects. If the SDK errors, env is missing, or Resend
 * itself is down, the calling action still returns its existing success
 * state - the lead row in Supabase is the source of truth.
 *
 * The Resend client is lazy-initialized at first call so importing this
 * module is safe even when RESEND_API_KEY is unset (e.g. local dev without
 * email turned on, CI builds, etc.).
 */

type SendResult = { ok: true; id?: string } | { ok: false; reason: string };

let cachedClient: Resend | null = null;
function client(): Resend | null {
  if (cachedClient) return cachedClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cachedClient = new Resend(key);
  return cachedClient;
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM ??
    "4Pie Labs <noreply@mail.fourpielabs.com>"
  );
}

function replyToAddress(): string {
  return process.env.EMAIL_REPLY_TO ?? "team@fourpielabs.com";
}

function alertRecipient(): string {
  return process.env.LEAD_ALERT_TO ?? "team@fourpielabs.com";
}

// Escape user-provided values before embedding in HTML.
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =============================================================================
// Internal alert (team-facing) - fired on every new lead.
// =============================================================================

export interface LeadAlertInput {
  type: string; // "audit", "budget", "contact", etc. - used in the subject.
  name?: string | null;
  email?: string | null;
  source: string;
  payload: Record<string, unknown>;
}

export async function sendLeadAlert(
  input: LeadAlertInput,
): Promise<SendResult> {
  try {
    const c = client();
    if (!c) {
      console.error(
        "[email] RESEND_API_KEY not set, skipping lead alert",
      );
      return { ok: false, reason: "no_key" };
    }

    const subjectName = input.name ? `: ${input.name}` : "";
    const subject = `New ${input.type} lead${subjectName}`;

    // Render every payload field as a row so the team sees the full submission
    // without us having to keep the template in sync with each form schema.
    const payloadRows = Object.entries(input.payload)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#6b665e;font-weight:500;white-space:nowrap;">${esc(k)}</td><td style="padding:6px 0;vertical-align:top;color:#1a1a1a;">${esc(v)}</td></tr>`,
      )
      .join("");

    const html = `
<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#faf7f2;color:#1a1a1a;margin:0;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #ede3cb;border-radius:12px;padding:24px;">
      <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#d97706;font-weight:600;">New ${esc(input.type)} lead</p>
      <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:600;letter-spacing:-0.01em;">${esc(input.name ?? "Unnamed lead")}</h1>
      <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:8px;">
        <tr><td style="padding:6px 12px 6px 0;color:#6b665e;font-weight:500;">type</td><td style="padding:6px 0;color:#1a1a1a;">${esc(input.type)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b665e;font-weight:500;">name</td><td style="padding:6px 0;color:#1a1a1a;">${esc(input.name ?? "")}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b665e;font-weight:500;">email</td><td style="padding:6px 0;color:#1a1a1a;"><a href="mailto:${esc(input.email ?? "")}" style="color:#d97706;text-decoration:none;">${esc(input.email ?? "")}</a></td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b665e;font-weight:500;">source</td><td style="padding:6px 0;color:#1a1a1a;">${esc(input.source)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #ede3cb;margin:16px 0;" />
      <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b665e;font-weight:600;">Payload</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">${payloadRows}</table>
    </div>
    <p style="max-width:640px;margin:16px auto 0 auto;font-size:11px;color:#8a8a8a;text-align:center;">Sent by 4Pie Labs forms.</p>
  </body>
</html>`.trim();

    const { data, error } = await c.emails.send({
      from: fromAddress(),
      to: alertRecipient(),
      replyTo: replyToAddress(),
      subject,
      html,
    });

    if (error) {
      console.error("[email] lead alert send failed:", error);
      return { ok: false, reason: error.name ?? "send_error" };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[email] lead alert threw:", err);
    return { ok: false, reason: "exception" };
  }
}

// =============================================================================
// Customer confirmation - sent to the visitor who submitted the form.
// =============================================================================

export type LeadConfirmationType = "audit" | "budget";

export interface LeadConfirmationInput {
  type: LeadConfirmationType;
  name?: string | null;
  email: string;
}

interface ConfirmationTemplate {
  subject: string;
  // Render the HTML body, optionally personalized with a first name.
  html: (firstName: string | null) => string;
}

const TEMPLATES: Record<LeadConfirmationType, ConfirmationTemplate> = {
  audit: {
    subject: "Your free AI audit request, 4Pie Labs",
    html: (firstName) =>
      confirmationShell({
        eyebrow: "Free AI audit",
        greeting: firstName ? `Hi ${esc(firstName)},` : "Hi there,",
        body: [
          "Thanks for requesting your free 12-point AI marketing audit.",
          "Your report is being generated right now and will arrive shortly in a separate email.",
          "Once you have had a chance to review it, our team will follow up with next steps. Replies to this email reach the team directly, so feel free to send over anything else you would like us to look at.",
        ],
        signoff: "Thanks,<br />The 4Pie Labs team",
      }),
  },
  budget: {
    subject: "Your marketing budget breakdown, 4Pie Labs",
    html: (firstName) =>
      confirmationShell({
        eyebrow: "Marketing Budget Calculator",
        greeting: firstName ? `Hi ${esc(firstName)},` : "Hi there,",
        body: [
          "Thanks for using our marketing budget calculator.",
          "We have your details and the team will follow up within 24 hours with the full breakdown and next steps tuned to your industry.",
          "Replies to this email reach our team directly, so feel free to send over questions in the meantime.",
        ],
        signoff: "Thanks,<br />The 4Pie Labs team",
      }),
  },
};

function confirmationShell({
  eyebrow,
  greeting,
  body,
  signoff,
}: {
  eyebrow: string;
  greeting: string;
  body: string[];
  signoff: string;
}): string {
  const paragraphs = body
    .map(
      (p) =>
        `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#1a1a1a;">${p}</p>`,
    )
    .join("");

  return `
<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#faf7f2;color:#1a1a1a;margin:0;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ede3cb;border-radius:12px;padding:28px;">
      <p style="margin:0 0 16px 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#d97706;font-weight:600;">${esc(eyebrow)}</p>
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:500;color:#1a1a1a;">${greeting}</p>
      ${paragraphs}
      <p style="margin:20px 0 0 0;font-size:15px;line-height:1.6;color:#1a1a1a;">${signoff}</p>
    </div>
    <p style="max-width:560px;margin:16px auto 0 auto;font-size:11px;color:#8a8a8a;text-align:center;">
      4Pie Labs, AI-first marketing for local service businesses.
    </p>
  </body>
</html>`.trim();
}

export async function sendLeadConfirmation(
  input: LeadConfirmationInput,
): Promise<SendResult> {
  try {
    const c = client();
    if (!c) {
      console.error(
        `[email] RESEND_API_KEY not set, skipping ${input.type} confirmation`,
      );
      return { ok: false, reason: "no_key" };
    }

    const template = TEMPLATES[input.type];
    const firstName = input.name?.trim().split(/\s+/)[0] ?? null;

    const { data, error } = await c.emails.send({
      from: fromAddress(),
      to: input.email,
      replyTo: replyToAddress(),
      subject: template.subject,
      html: template.html(firstName),
    });

    if (error) {
      console.error(
        `[email] ${input.type} confirmation send failed:`,
        error,
      );
      return { ok: false, reason: error.name ?? "send_error" };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    console.error(`[email] ${input.type} confirmation threw:`, err);
    return { ok: false, reason: "exception" };
  }
}
