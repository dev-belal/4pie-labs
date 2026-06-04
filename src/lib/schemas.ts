import { z } from "zod";
import { BLOG_FORM_CATEGORIES } from "@/data/blogs";

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

// Lead captured by the homepage Marketing Budget Calculator. Stored in the
// leads table under type "roi" (closest existing enum value) with the
// calculator context in the payload. Only name + email are visible required
// fields on the inline form above the submit button; the rest are carried
// as hidden inputs from the calculator state. `businessName` used to be a
// required field on the old modal flow; the inline form does not collect
// it, so it stays optional here for forward compatibility.
export const budgetLeadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email address").max(200),
  businessName: z.string().max(200).optional(),
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

// One FAQ pair. Drives the FAQPage JSON-LD entries and the visible
// <details> accordion on /blog/[slug].
export const blogFAQSchema = z.object({
  q: z.string().trim().min(3, "Question is too short").max(300),
  a: z.string().trim().min(3, "Answer is too short").max(2000),
});

export const blogInsertSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  // Category is validated against the canonical post-pivot list in
  // src/data/blogs.ts. Adding a category there makes it accepted here
  // automatically. The legacy DB check constraint was dropped in
  // migration 0008, so this Zod check is the only server-side guard.
  category: z
    .string()
    .refine(
      (c) => BLOG_FORM_CATEGORIES.includes(c),
      `Pick a valid category (${BLOG_FORM_CATEGORIES.join(", ")})`,
    ),
  author: z.string().min(2).max(100),
  readTime: z.string().max(40).optional().default("5 min read"),
  // Image accepts EITHER a site-relative path (e.g. "/blog/foo/header.jpg",
  // which is how the 7 founder articles reference their locally-hosted
  // images) OR a fully-qualified https URL (Pixabay, Unsplash, etc.).
  // The previous .url() check would have rejected every relative path.
  image: z
    .string()
    .max(500)
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//.test(v),
      "Image must be a site-relative path (/...) or an absolute http(s) URL",
    )
    .optional(),
  excerpt: z.string().min(10, "Write a longer excerpt").max(500),
  content: z.string().min(50, "Write more content").max(50_000),
  // FAQ pairs - optional. Empty array (the default) means no FAQ block
  // on the rendered post, which matches the renderer's gate
  // `post.faqs && post.faqs.length > 0`. Cap at 12 to keep the visible
  // accordion scannable.
  faqs: z.array(blogFAQSchema).max(12).optional().default([]),
  // ISO 8601 publish date (YYYY-MM-DD). Optional - if omitted the
  // BlogPosting JSON-LD's datePublished falls back to the human-readable
  // `date` string which Google accepts loosely but doesn't fully validate.
  datePublishedISO: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
});

export const testimonialInsertSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().min(2).max(160),
  headline: z.string().min(5).max(200),
  quote: z.string().min(10).max(2000),
  rating: z.number().int().min(1).max(5),
  // Same affordance as the blog `image` field: accept a site-relative
  // path (e.g. "/testimonials/maria.jpeg" where you've shipped a real
  // file under public/) OR a fully-qualified https URL (ui-avatars,
  // Gravatar, Unsplash, etc.). Strict .url() would reject every
  // relative path. Empty string is filtered out by the form before
  // submission; we coerce to undefined in the action so the column
  // stays null and the public component renders the ui-avatars
  // initials chip.
  avatar: z
    .string()
    .max(500)
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//.test(v),
      "Avatar must be a site-relative path (/...) or an absolute http(s) URL",
    )
    .optional(),
  // Whether the testimonial surfaces on the public homepage. Defaults
  // to true so existing form submissions (which don't yet carry the
  // checkbox) keep their current behavior of going live immediately.
  isPublished: z.boolean().optional().default(true),
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

// Pipeline + stage editing on /admin. Admin-only, validated server-side.
// Names are trimmed and capped — UI can be terse and forgiving.
export const stageKindSchema = z.enum(["open", "won", "lost"]);

export const pipelineNameSchema = z
  .string()
  .trim()
  .min(1, "Name can't be blank")
  .max(80, "Name is too long");

export const stageNameSchema = z
  .string()
  .trim()
  .min(1, "Stage name can't be blank")
  .max(80, "Stage name is too long");

export const uuidSchema = z.string().uuid("Invalid id");

export const reorderStagesSchema = z.object({
  pipelineId: uuidSchema,
  orderedStageIds: z
    .array(uuidSchema)
    .min(2, "A pipeline needs at least 2 stages")
    .max(40, "Too many stages"),
});

// Opportunity source badges (matches the design's lead-source palette).
// Free-text in the DB; constrained here for UI consistency.
export const OPPORTUNITY_SOURCES = [
  "Audit",
  "Budget",
  "Contact",
  "Chat",
] as const;
export const opportunitySourceSchema = z.enum(OPPORTUNITY_SOURCES);

// Money cap of $10M (10_000_000_00 cents). Plenty for an agency retainer
// while still preventing accidental gigantic numbers from typos.
const VALUE_CENTS_MAX = 10_000_000_00;
const valueCentsSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(VALUE_CENTS_MAX);

export const createOpportunitySchema = z.object({
  pipelineId: uuidSchema,
  stageId: uuidSchema,
  contactName: z
    .string()
    .trim()
    .min(1, "Contact name can't be blank")
    .max(120),
  businessName: z.string().trim().max(160).optional(),
  source: opportunitySourceSchema.optional(),
  valueCents: valueCentsSchema,
});

export const moveOpportunitySchema = z.object({
  oppId: uuidSchema,
  stageId: uuidSchema,
  sortOrder: z.number().int().min(0).max(1_000_000),
});

export const updateOpportunityFieldsSchema = z
  .object({
    contactName: z.string().trim().min(1).max(120).optional(),
    businessName: z.string().trim().max(160).nullish(),
    source: opportunitySourceSchema.nullish(),
    valueCents: valueCentsSchema.optional(),
    notes: z.string().max(4000).nullish(),
  })
  .refine((d) => Object.keys(d).length > 0, "No fields to update");

export const updateOpportunitySchema = z.object({
  oppId: uuidSchema,
  fields: updateOpportunityFieldsSchema,
});

// Lead → opportunity promotion (Phase 4). leadId references the originating
// lead row; pipelineId + stageId identify the destination column; valueCents
// is the monthly retainer the admin sized in the modal.
export const promoteLeadSchema = z.object({
  leadId: uuidSchema,
  pipelineId: uuidSchema,
  stageId: uuidSchema,
  valueCents: valueCentsSchema,
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
export type BlogFAQInput = z.infer<typeof blogFAQSchema>;
export type TestimonialInsertInput = z.infer<typeof testimonialInsertSchema>;
export type TrackViewInput = z.infer<typeof trackViewSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type StageKind = z.infer<typeof stageKindSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
export type OpportunitySource = z.infer<typeof opportunitySourceSchema>;
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type MoveOpportunityInput = z.infer<typeof moveOpportunitySchema>;
export type UpdateOpportunityFields = z.infer<
  typeof updateOpportunityFieldsSchema
>;
export type PromoteLeadInput = z.infer<typeof promoteLeadSchema>;
