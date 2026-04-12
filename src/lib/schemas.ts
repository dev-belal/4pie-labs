import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address").max(200),
  phone: z.string().min(6, "Enter a valid phone number").max(40),
  serviceType: z.enum(["AI Automation", "Design Creatives", "Digital Marketing"]),
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

export const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000),
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

export type ContactInput = z.infer<typeof contactSchema>;
export type CustomRequestInput = z.infer<typeof customRequestSchema>;
export type RoiInput = z.infer<typeof roiSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type BlogInsertInput = z.infer<typeof blogInsertSchema>;
export type TestimonialInsertInput = z.infer<typeof testimonialInsertSchema>;
