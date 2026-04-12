import { cache } from "react";
import {
  blogs as staticBlogs,
  getBlogBySlug as getStaticBySlug,
  type BlogPost,
} from "@/data/blogs";
import { createClient } from "@/lib/supabase/server";

export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) return data as BlogPost[];
  } catch {
    // fall through
  }
  return staticBlogs;
});

export const getPostBySlug = cache(
  async (slug: string): Promise<BlogPost | undefined> => {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (data) return data as BlogPost;
    } catch {
      // fall through
    }
    return getStaticBySlug(slug);
  },
);

export async function trackBlogView(slug: string, title: string) {
  try {
    const supabase = await createClient();
    // Atomic increment via RPC if available; otherwise best-effort read-then-write
    const rpc = await supabase.rpc("increment_blog_views", { p_slug: slug });
    if (rpc.error) {
      const { data: current } = await supabase
        .from("blogs")
        .select("views")
        .eq("slug", slug)
        .maybeSingle();
      const next = ((current?.views as number | undefined) ?? 0) + 1;
      await supabase.from("blogs").update({ views: next }).eq("slug", slug);
    }

    await supabase.from("metrics").insert({
      event_type: "page_view",
      page_path: `/blog/${slug}`,
      metadata: { title },
    });
  } catch {
    // non-fatal
  }
}
