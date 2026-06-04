"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin-session";
import {
  blogInsertSchema,
  testimonialInsertSchema,
} from "@/lib/schemas";

import type { PublishState } from "@/lib/form-types";
import type { LeadStatus, ConversationMessage } from "@/lib/admin-data";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Revalidate every public surface that displays blog posts. Shared by
 * publishBlog, updateBlog, and deleteBlog so each mutation invalidates
 * the same set without drift.
 */
function revalidateBlogSurfaces(slug: string): void {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  // Homepage's "Articles & insights" strip pulls the latest 3 via
  // getLatestPosts(), so it needs to refresh on every blog mutation.
  revalidatePath("/");
  // Dynamic sitemap re-queries getAllPosts() each build; mark its
  // route so the next request regenerates it.
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
}

/**
 * Parse the BlogPublisher / BlogEditor form's FAQ payload. The form
 * JSON-encodes the array of { q, a } pairs into a single hidden field
 * called `faqsJson` so the FAQ rows can be added / removed without
 * juggling indexed FormData keys. Returns an empty array for any falsy
 * or malformed input - Zod re-validates the shape downstream.
 */
function parseFaqsJson(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function requireAdmin() {
  await requireAdminSession();
  return createServiceClient();
}

const ALLOWED_LEAD_STATUS: LeadStatus[] = [
  "new",
  "in_progress",
  "won",
  "lost",
];

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ALLOWED_LEAD_STATUS.includes(status)) {
    return { ok: false, error: "Invalid status" };
  }
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", leadId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function updateLeadNotes(
  leadId: string,
  notes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (notes.length > 4000) {
    return { ok: false, error: "Notes too long" };
  }
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("leads")
      .update({ notes })
      .eq("id", leadId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function deleteLead(
  leadId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function fetchConversationTranscript(
  conversationId: string,
): Promise<
  | { ok: true; messages: ConversationMessage[] }
  | { ok: false; error: string }
> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("messages")
      .select("id, conversation_id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, messages: (data ?? []) as ConversationMessage[] };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function publishBlog(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  let supabase;
  try {
    supabase = await requireAdmin();
  } catch {
    return { status: "error", message: "You must be signed in." };
  }

  const parsed = blogInsertSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    author: formData.get("author"),
    readTime: (formData.get("readTime") as string) || undefined,
    image: (formData.get("image") as string) || undefined,
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    faqs: parseFaqsJson(formData.get("faqsJson")),
    datePublishedISO:
      (formData.get("datePublishedISO") as string) || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // Display string follows the ISO date when provided so the post header
  // and the BlogPosting JSON-LD agree. Falls back to "today" when the
  // form omits the ISO field (back-compat with the legacy publisher).
  const iso = parsed.data.datePublishedISO;
  const dateStr = iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  const { error } = await supabase.from("blogs").insert({
    id: parsed.data.slug,
    slug: parsed.data.slug,
    title: parsed.data.title,
    category: parsed.data.category,
    author: parsed.data.author,
    date: dateStr,
    date_published_iso: iso ?? null,
    read_time: parsed.data.readTime,
    image:
      parsed.data.image ??
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    faqs: parsed.data.faqs ?? [],
    views: 0,
  });

  if (error) return { status: "error", message: error.message };

  revalidateBlogSurfaces(parsed.data.slug);
  return { status: "success", message: "Article published to live site." };
}

/**
 * Update an existing blog row by slug. All BlogPost-facing fields are
 * editable. Behind requireAdminSession() via the requireAdmin() helper.
 * Each successful update invalidates the public surfaces (/blog,
 * /blog/[slug], homepage strip, sitemap) so the change is visible on
 * the next ISR fetch.
 *
 * Mirrors publishBlog's input contract (FormData out of the BlogEditor)
 * so the same component drives both create and edit modes.
 */
export async function updateBlog(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  let supabase;
  try {
    supabase = await requireAdmin();
  } catch {
    return { status: "error", message: "You must be signed in." };
  }

  // Original slug — identifies the row to update. The form may also be
  // submitting a NEW slug in the `slug` field if the admin renamed it;
  // we update both id and slug to the new value when they differ.
  const originalSlug = (formData.get("originalSlug") as string) ?? "";
  if (!SLUG_REGEX.test(originalSlug)) {
    return { status: "error", message: "Invalid original slug" };
  }

  const parsed = blogInsertSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    author: formData.get("author"),
    readTime: (formData.get("readTime") as string) || undefined,
    image: (formData.get("image") as string) || undefined,
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    faqs: parseFaqsJson(formData.get("faqsJson")),
    datePublishedISO:
      (formData.get("datePublishedISO") as string) || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // If the admin filled in a new ISO date, recompute the visible
  // display string. Otherwise leave the existing `date` column untouched
  // by omitting it from the UPDATE.
  const iso = parsed.data.datePublishedISO;
  const updateFields: Record<string, unknown> = {
    id: parsed.data.slug,
    slug: parsed.data.slug,
    title: parsed.data.title,
    category: parsed.data.category,
    author: parsed.data.author,
    read_time: parsed.data.readTime,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    faqs: parsed.data.faqs ?? [],
  };
  if (parsed.data.image !== undefined) updateFields.image = parsed.data.image;
  if (iso) {
    updateFields.date_published_iso = iso;
    updateFields.date = new Date(`${iso}T00:00:00Z`).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      },
    );
  }

  const { error } = await supabase
    .from("blogs")
    .update(updateFields)
    .eq("id", originalSlug);
  if (error) return { status: "error", message: error.message };

  // Revalidate BOTH the old and the new slug if the admin renamed it -
  // the old URL needs to 404 (it's gone) and the new URL needs to be
  // generated. Both paths cycle through revalidatePath the same way.
  revalidateBlogSurfaces(originalSlug);
  if (originalSlug !== parsed.data.slug) {
    revalidateBlogSurfaces(parsed.data.slug);
  }
  return { status: "success", message: "Article updated." };
}

/**
 * Delete a blog row by slug. Imperative call signature (returns
 * { ok: true } / { ok: false, error: string }) to match the existing
 * lead-deletion pattern used by LeadsPanel. Behind requireAdminSession.
 */
export async function deleteBlog(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!SLUG_REGEX.test(slug)) {
    return { ok: false, error: "Invalid slug" };
  }
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("blogs").delete().eq("id", slug);
    if (error) return { ok: false, error: error.message };
    revalidateBlogSurfaces(slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}


/**
 * Shared by every testimonial mutation. Homepage is the only public
 * surface; the admin tab needs to refresh too so any open list view
 * sees the change without a hard reload.
 */
function revalidateTestimonialSurfaces(): void {
  revalidatePath("/");
  revalidatePath("/admin");
}

/**
 * Parse + map a TestimonialEditor / TestimonialPublisher submission
 * into the DB row shape. Shared so publishTestimonial (INSERT) and
 * updateTestimonial (UPDATE) interpret the same FormData identically.
 *
 * Returns { ok: false, ... } on Zod validation failure so the caller
 * can short-circuit and surface field errors. Otherwise { ok: true,
 * row } with the snake_case columns the Supabase client expects.
 */
function parseTestimonialForm(
  formData: FormData,
):
  | { ok: false; result: PublishState }
  | {
      ok: true;
      row: {
        name: string;
        role: string;
        headline: string;
        quote: string;
        rating: number;
        avatar: string | null;
        is_published: boolean;
      };
    } {
  // The form sends a checkbox as "true" or "false" string in our
  // BlogEditor-style serializer. Coerce here before Zod sees it.
  const isPublishedRaw = formData.get("isPublished");
  const isPublished =
    isPublishedRaw === "false" || isPublishedRaw === "off" ? false : true;

  const rawAvatar = (formData.get("avatar") as string | null) ?? "";
  const avatar = rawAvatar.trim().length > 0 ? rawAvatar.trim() : undefined;

  const parsed = testimonialInsertSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    headline: formData.get("headline"),
    quote: formData.get("quote"),
    rating: Number(formData.get("rating")),
    avatar,
    isPublished,
  });

  if (!parsed.success) {
    return {
      ok: false,
      result: {
        status: "error",
        message: "Please check the fields and try again.",
        errors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  return {
    ok: true,
    row: {
      name: parsed.data.name,
      role: parsed.data.role,
      headline: parsed.data.headline,
      quote: parsed.data.quote,
      rating: parsed.data.rating,
      // Schema returns undefined when the form left avatar blank; the
      // DB column is nullable and the public carousel falls back to a
      // ui-avatars chip when the value is null.
      avatar: parsed.data.avatar ?? null,
      is_published: parsed.data.isPublished ?? true,
    },
  };
}

export async function publishTestimonial(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  let supabase;
  try {
    supabase = await requireAdmin();
  } catch {
    return { status: "error", message: "You must be signed in." };
  }

  const parsed = parseTestimonialForm(formData);
  if (!parsed.ok) return parsed.result;

  const { error } = await supabase.from("testimonials").insert(parsed.row);
  if (error) return { status: "error", message: error.message };

  revalidateTestimonialSurfaces();
  return { status: "success", message: "Testimonial published." };
}

/**
 * Edit an existing testimonial row. FormState shape matches
 * publishTestimonial so a single TestimonialEditor component drives
 * both create and edit modes (same pattern as BlogEditor + publishBlog
 * / updateBlog).
 */
export async function updateTestimonial(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  let supabase;
  try {
    supabase = await requireAdmin();
  } catch {
    return { status: "error", message: "You must be signed in." };
  }

  // Hidden id field added by the editor in edit mode. UUIDs are not
  // user-input so a strict Zod check is overkill, but a length sanity
  // check prevents bizarre eq() queries from succeeding.
  const id = (formData.get("id") as string | null) ?? "";
  if (id.length < 32) {
    return { status: "error", message: "Invalid testimonial id" };
  }

  const parsed = parseTestimonialForm(formData);
  if (!parsed.ok) return parsed.result;

  const { error } = await supabase
    .from("testimonials")
    .update(parsed.row)
    .eq("id", id);
  if (error) return { status: "error", message: error.message };

  revalidateTestimonialSurfaces();
  return { status: "success", message: "Testimonial updated." };
}

/**
 * Delete a testimonial by id. Imperative call shape (returns
 * { ok: true } / { ok: false, error }) so TestimonialsListPanel can
 * call it inline from a row button without a useActionState wrapper -
 * same pattern as deleteLead / deleteBlog.
 */
export async function deleteTestimonial(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof id !== "string" || id.length < 32) {
    return { ok: false, error: "Invalid testimonial id" };
  }
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidateTestimonialSurfaces();
    return { ok: true };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}

/**
 * Per-row publish-state toggle. Same imperative shape as
 * deleteTestimonial so the BlogsListPanel-style row button can call it
 * directly. The list view uses this to flip is_published without
 * having to open the full editor.
 */
export async function setTestimonialPublished(
  id: string,
  value: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof id !== "string" || id.length < 32) {
    return { ok: false, error: "Invalid testimonial id" };
  }
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("testimonials")
      .update({ is_published: value })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidateTestimonialSurfaces();
    return { ok: true };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}
