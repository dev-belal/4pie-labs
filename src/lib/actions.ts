"use server";

import { headers } from "next/headers";
import { clientIp, postToN8N } from "@/lib/n8n";
import { rateLimit } from "@/lib/rate-limit";
import {
  contactSchema,
  customRequestSchema,
  roiSchema,
} from "@/lib/schemas";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

const INITIAL: FormState = { status: "idle" };
export const initialFormState = INITIAL;

async function guardAndIp(routeKey: string, limit = 5, windowMs = 60_000) {
  const h = await headers();
  const ip = clientIp(h);
  const rl = rateLimit(`${routeKey}:${ip}`, limit, windowMs);
  return { ip, allowed: rl.allowed };
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

  const result = await postToN8N(process.env.N8N_WEBHOOK_CONTACT_URL, {
    ...parsed.data,
    source: "Contact Modal",
    ip,
  });

  if (!result.ok) {
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

  const result = await postToN8N(process.env.N8N_WEBHOOK_CUSTOM_REQUEST_URL, {
    ...parsed.data,
    source: "Custom Request Modal",
    ip,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: "We couldn't submit right now — please try again shortly.",
    };
  }

  return { status: "success", message: "Request sent — our architects will reach out." };
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

  const result = await postToN8N(process.env.N8N_WEBHOOK_ROI_URL, {
    ...parsed.data,
    source: "ROI Calculator",
    ip,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: "We couldn't send your report — please try again shortly.",
    };
  }

  return { status: "success", message: "Report sent — check your inbox." };
}
