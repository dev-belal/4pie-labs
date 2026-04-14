"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import {
  contactSchema,
  customRequestSchema,
  roiSchema,
} from "@/lib/schemas";
import { createPublicClient } from "@/lib/supabase/public-client";
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

async function insertLead(input: InsertLeadInput): Promise<boolean> {
  try {
    const supabase = createPublicClient();
    const { error } = await supabase.from("leads").insert({
      type: input.type,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: input.source,
      payload: input.payload,
    });
    if (error) {
      console.error("[leads] insert failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[leads] insert threw:", err);
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
      message: "We couldn't submit right now — please try again shortly.",
    };
  }

  return { status: "success", message: "Request sent — we'll be in touch." };
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
      message: "We couldn't submit right now — please try again shortly.",
    };
  }

  return {
    status: "success",
    message: "Request sent — our architects will reach out.",
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
      message: "We couldn't save your report — please try again shortly.",
    };
  }

  return {
    status: "success",
    message: "Got it! We'll send your detailed report shortly.",
  };
}
