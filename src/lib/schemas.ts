import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address").max(200),
  phone: z.string().min(6, "Enter a valid phone number").max(40),
  serviceType: z.enum([
    "AI-First SEO + AEO",
    "Performance Ads",
    "Custom AI Systems",
  ]),
  description: z.string().min(10, "Tell us a bit more (10+ characters)").max(2000),
});

export const customRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  phone: z.string().min(6).max(40),
  requestType: z.enum([
    "Custom AI Operating System",
    "Specialized Automation",
    "Unique Design System",
    "Other / Full Custom",
  ]),
  details: z.string().min(10).max(4000),
});

export const roiSchema = z.object({
  email: z.string().email("Enter a valid email address").max(200),
  hoursPerWeek: z.number().int().min(1).max(80),
  employees: z.number().int().min(1).max(500),
  costPerHour: z.number().int().min(1).max(1000),
  monthlyManualCost: z.number().nonnegative(),
  automationSavings: z.number().nonnegative(),
});

// Lead captured by the homepage Marketing Budget Calculator modal. Stored in
// the leads table under type "roi" (closest existing enum value) with the
// calculator context in the payload.
export const budgetLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address").max(200),
  businessName: z.string().min(1, "Enter your business name").max(200),
  monthlyRevenue: z.coerce.number().int().min(0).max(100_000_000),
  industry: z.string().max(100).optional(),
  growthGoal: z.string().max(100).optional(),
  recommendedBudget: z.coerce.number().nonnegative().optional(),
  currentSpend: z.coerce.number().nonnegative().optional(),
});

export const chatSchema = z.object({
  sessionId: z.string().uuid("Invalid session id"),
  message: z.string().min(1, "Message cannot be empty").max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(40)
    .default([]),
});

export const blogInsertSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  category: z.enum(["GUIDE", "STRATEGY", "INSIGHTS", "NEWS"]),
  author: z.string().min(2).max(100),
  readTime: z.string().max(40).optional().default("5 min read"),
  image: z.string().url().max(500).optional(),
  excerpt: z.string().min(10, "Write a longer excerpt").max(500),
  content: z.string().min(50, "Write more content").max(50_000),
});

export const testimonialInsertSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().min(2).max(160),
  headline: z.string().min(5).max(200),
  quote: z.string().min(10).max(2000),
  rating: z.number().int().min(1).max(5),
});

export const trackViewSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
});

// Free AI marketing audit form on /audit. Stored in the leads table under
// type "contact" (closest existing enum value) with source "Free AI audit".
// businessUrl is required and lenient: n8n normalizes the URL itself, so we
// don't force https:// or z.string().url() here. We only reject the obvious
// junk (empty, contains whitespace after trim, no dot).
export const auditLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address").max(200),
  businessName: z.string().min(1, "Enter your business name").max(200),
  businessUrl: z
    .string()
    .trim()
    .min(1, "Enter your website (e.g. example.com or https://example.com)")
    .max(300, "Enter your website (e.g. example.com or https://example.com)")
    .refine(
      (v) => !/\s/.test(v) && v.includes("."),
      "Enter your website (e.g. example.com or https://example.com)",
    ),
  industry: z
    .enum(["Painting contractor", "Tour operator", "Other local service"])
    .optional(),
  monthlyBudget: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
});

export const bookingSchema = z.object({
  // Cal.com slot starts include tz offsets (e.g. "...-04:00"), not just "Z",
  // so allow offsets. `local` would also match naive strings; we want a
  // real absolute moment, so only { offset: true }.
  startISO: z
    .string()
    .datetime({ offset: true, message: "Pick a valid time slot" }),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address").max(200),
  phone: z.string().max(40).optional(),
  notes: z.string().max(1000).optional(),
  timeZone: z.string().min(1).max(100),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type CustomRequestInput = z.infer<typeof customRequestSchema>;
export type RoiInput = z.infer<typeof roiSchema>;
export type BudgetLeadInput = z.infer<typeof budgetLeadSchema>;
export type AuditLeadInput = z.infer<typeof auditLeadSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type BlogInsertInput = z.infer<typeof blogInsertSchema>;
export type TestimonialInsertInput = z.infer<typeof testimonialInsertSchema>;
export type TrackViewInput = z.infer<typeof trackViewSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
