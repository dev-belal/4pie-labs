"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import {
  auditLeadSchema,
  budgetLeadSchema,
  contactSchema,
  customRequestSchema,
  roiSchema,
} from "@/lib/schemas";
import { createPublicClient } from "@/lib/supabase/public-client";
import { sendLeadAlert, sendLeadConfirmation } from "@/lib/email";
import type { FormState } from "@/lib/form-types";

function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

async function guardAndIp(routeKey: string, limit = 5, windowMs = 60_000) {
  const h = await headers();
  const ip = clientIp(h);
  const rl = rateLimit(`${routeKey}:${ip}`, limit, windowMs);
  return { ip, allowed: rl.allowed };
}

interface InsertLeadInput {
  type: "contact" | "custom_request" | "roi";
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  source: string;
  payload: Record<string, unknown>;
}

// Temporary, REVERT once production submit failure is diagnosed.
// Surfaces which env var is missing (booleans only, never values) so the
// real cause shows up in Vercel runtime logs.
function envPresence() {
  return {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    resend: !!process.env.RESEND_API_KEY,
    n8n: !!process.env.N8N_AUDIT_WEBHOOK_URL,
  };
}

/**
 * Fire-and-forget POST to the n8n audit workflow. Scheduled via `after()`
 * from the audit action so Vercel keeps the serverless function alive
 * past the response and the request actually completes (instead of being
 * aborted the moment the function freezes).
 *
 * Best-effort: every failure mode (no env, non-2xx, network, timeout) is
 * logged and swallowed. Never throws.
 */
async function dispatchN8nAuditWebhook(input: {
  Website: string;
  email: string;
  name: string;
  businessName: string;
}): Promise<void> {
  const webhookUrl = process.env.N8N_AUDIT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[n8n] N8N_AUDIT_WEBHOOK_URL not set, skipping audit webhook");
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        Website: input.Website,
        email: input.email,
        name: input.name,
        businessName: input.businessName,
        source: "4Pie Labs /audit form",
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(
        `[n8n] audit webhook returned non-2xx: ${res.status} ${res.statusText}`,
      );
    }
  } catch (err) {
    console.error("[n8n] audit webhook dispatch failed:", err);
  } finally {
    clearTimeout(timeout);
  }
}

async function insertLead(input: InsertLeadInput): Promise<boolean> {
  try {
    const supabase = createPublicClient();
    // Do not chain .select() on public-form inserts. It triggers an implicit SELECT gated by admin-only RLS and will fail. Insert without RETURNING.
    const { error } = await supabase.from("leads").insert({
      type: input.type,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: input.source,
      payload: input.payload,
    });
    if (error) {
      console.error("[leads] insert failed", {
        type: input.type,
        source: input.source,
        error: `${error.code ?? ""} ${error.message ?? ""}`.trim(),
        env: envPresence(),
      });
      return false;
    }
    return true;
  } catch (err) {
    console.error("[leads] insert threw", {
      type: input.type,
      source: input.source,
      error:
        err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      env: envPresence(),
    });
    return false;
  }
}

export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { allowed, ip } = await guardAndIp("contact");
  if (!allowed) {
    return {
      status: "error",
      message: "Too many requests. Please wait a minute and try again.",
    };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    serviceType: formData.get("serviceType"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const ok = await insertLead({
    type: "contact",
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    source: "Contact Modal",
    payload: {
      serviceType: parsed.data.serviceType,
      description: parsed.data.description,
      ip,
    },
  });

  if (!ok) {
    return {
      status: "error",
      message: "We couldn't submit right now - please try again shortly.",
    };
  }

  return { status: "success", message: "Request sent - we'll be in touch." };
}

export async function submitCustomRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { allowed, ip } = await guardAndIp("custom-request");
  if (!allowed) {
    return {
      status: "error",
      message: "Too many requests. Please wait a minute and try again.",
    };
  }

  const parsed = customRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    requestType: formData.get("requestType"),
    details: formData.get("details"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const ok = await insertLead({
    type: "custom_request",
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    source: "Custom Request Modal",
    payload: {
      requestType: parsed.data.requestType,
      details: parsed.data.details,
      ip,
    },
  });

  if (!ok) {
    return {
      status: "error",
      message: "We couldn't submit right now - please try again shortly.",
    };
  }

  return {
    status: "success",
    message: "Request sent - our architects will reach out.",
  };
}

export async function submitROI(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { allowed, ip } = await guardAndIp("roi");
  if (!allowed) {
    return {
      status: "error",
      message: "Too many requests. Please wait a minute and try again.",
    };
  }

  const parsed = roiSchema.safeParse({
    email: formData.get("email"),
    hoursPerWeek: Number(formData.get("hoursPerWeek")),
    employees: Number(formData.get("employees")),
    costPerHour: Number(formData.get("costPerHour")),
    monthlyManualCost: Number(formData.get("monthlyManualCost")),
    automationSavings: Number(formData.get("automationSavings")),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const ok = await insertLead({
    type: "roi",
    email: parsed.data.email,
    source: "ROI Calculator",
    payload: {
      hoursPerWeek: parsed.data.hoursPerWeek,
      employees: parsed.data.employees,
      costPerHour: parsed.data.costPerHour,
      monthlyManualCost: parsed.data.monthlyManualCost,
      automationSavings: parsed.data.automationSavings,
      ip,
    },
  });

  if (!ok) {
    return {
      status: "error",
      message: "We couldn't save your report - please try again shortly.",
    };
  }

  return {
    status: "success",
    message: "Got it! We'll send your detailed report shortly.",
  };
}

export async function submitBudgetLead(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { allowed, ip } = await guardAndIp("budget-calc");
  if (!allowed) {
    return {
      status: "error",
      message: "Too many requests. Please wait a minute and try again.",
    };
  }

  const parsed = budgetLeadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    businessName: formData.get("businessName"),
    monthlyRevenue: formData.get("monthlyRevenue"),
    industry: formData.get("industry"),
    growthGoal: formData.get("growthGoal"),
    recommendedBudget: formData.get("recommendedBudget"),
    currentSpend: formData.get("currentSpend"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const budgetPayload = {
    businessName: parsed.data.businessName,
    monthlyRevenue: parsed.data.monthlyRevenue,
    industry: parsed.data.industry,
    growthGoal: parsed.data.growthGoal,
    recommendedBudget: parsed.data.recommendedBudget,
    currentSpend: parsed.data.currentSpend,
    ip,
  };

  const ok = await insertLead({
    type: "roi",
    name: parsed.data.name,
    email: parsed.data.email,
    source: "Marketing Budget Calculator",
    payload: budgetPayload,
  });

  if (!ok) {
    return {
      status: "error",
      message: "We couldn't submit right now - please try again shortly.",
    };
  }

  // Schedule the Resend emails to run AFTER the response is sent. Same
  // rationale as submitAuditLead: `after()` keeps the serverless context
  // alive long enough for the sends to complete on Vercel. Each helper
  // catches internally and logs; Promise.allSettled isolates rejections.
  after(async () => {
    await Promise.allSettled([
      sendLeadAlert({
        type: "budget",
        name: parsed.data.name,
        email: parsed.data.email,
        source: "Marketing Budget Calculator",
        payload: budgetPayload,
      }),
      sendLeadConfirmation({
        type: "budget",
        name: parsed.data.name,
        email: parsed.data.email,
      }),
    ]);
  });

  return {
    status: "success",
    message: "Thanks - we'll email you the breakdown within 24 hours.",
  };
}

export async function submitAuditLead(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { allowed, ip } = await guardAndIp("audit");
  if (!allowed) {
    return {
      status: "error",
      message: "Too many requests. Please wait a minute and try again.",
    };
  }

  const parsed = auditLeadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    businessName: formData.get("businessName"),
    businessUrl: formData.get("businessUrl") || undefined,
    industry: formData.get("industry") || undefined,
    monthlyBudget: formData.get("monthlyBudget") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const auditPayload = {
    businessName: parsed.data.businessName,
    businessUrl: parsed.data.businessUrl,
    industry: parsed.data.industry,
    monthlyBudget: parsed.data.monthlyBudget,
    notes: parsed.data.notes,
    ip,
  };

  const ok = await insertLead({
    type: "contact",
    name: parsed.data.name,
    email: parsed.data.email,
    source: "Free AI audit",
    payload: auditPayload,
  });

  if (!ok) {
    // Temporary, REVERT once root cause is diagnosed. insertLead already
    // logged the underlying error or exception with env-presence detail;
    // this action-level line is the entry point in the Vercel logs that
    // makes the failure easy to grep for.
    console.error("[audit] submit failed", {
      error: "insertLead returned false (see preceding [leads] log line)",
      env: envPresence(),
    });
    return {
      status: "error",
      message: "We couldn't submit right now - please try again shortly.",
    };
  }

  // Schedule the n8n webhook + both Resend emails to run AFTER the response
  // is sent. `after()` keeps the serverless invocation alive past the
  // response in the same context, so on Vercel these background tasks
  // actually complete instead of being aborted the moment the function
  // would otherwise freeze (the previous `void (async () => {...})()` /
  // `void Promise.allSettled([...])` pattern was getting orphaned on prod
  // and producing AbortError + "request could not be resolved" logs).
  //
  // Promise.allSettled isolates rejections so one failure can't reject the
  // others; each helper additionally catches internally and logs, so this
  // is belt-and-suspenders. insertLead has already returned true above and
  // is awaited synchronously - the lead row save still gates the FormState
  // and is unaffected by anything below.
  after(async () => {
    await Promise.allSettled([
      dispatchN8nAuditWebhook({
        Website: parsed.data.businessUrl,
        email: parsed.data.email,
        name: parsed.data.name,
        businessName: parsed.data.businessName,
      }),
      sendLeadAlert({
        type: "audit",
        name: parsed.data.name,
        email: parsed.data.email,
        source: "Free AI audit",
        payload: auditPayload,
      }),
      sendLeadConfirmation({
        type: "audit",
        name: parsed.data.name,
        email: parsed.data.email,
      }),
    ]);
  });

  return {
    status: "success",
    message:
      "Audit booked. Your report is on its way and will arrive by email shortly.",
  };
}
