"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { blogInsertSchema, testimonialInsertSchema } from "@/lib/schemas";

import type { PublishState } from "@/lib/form-types";
export type { PublishState };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return supabase;
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
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "short",
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
    read_time: parsed.data.readTime,
    image:
      parsed.data.image ??
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    views: 0,
  });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/blog");
  revalidatePath(`/blog/${parsed.data.slug}`);
  revalidatePath("/admin");
  return { status: "success", message: "Article published to live site." };
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

  const parsed = testimonialInsertSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    headline: formData.get("headline"),
    quote: formData.get("quote"),
    rating: Number(formData.get("rating")),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.from("testimonials").insert({
    ...parsed.data,
    is_published: true,
  });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { status: "success", message: "Testimonial published." };
}
