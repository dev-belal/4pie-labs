import { cache } from "react";
import {
  blogs as staticBlogs,
  getBlogBySlug as getStaticBySlug,
  type BlogPost,
} from "@/data/blogs";
import { createClient } from "@/lib/supabase/server";

/**
 * Column alias: map the snake_case Postgres column `read_time` to the
 * camelCase field `readTime` expected by the BlogPost type.
 */
const BLOG_SELECT =
  "id, slug, title, category, author, date, readTime:read_time, image, excerpt, content, views, created_at";

export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blogs")
      .select(BLOG_SELECT)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) return data as unknown as BlogPost[];
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
        .select(BLOG_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (data) return data as unknown as BlogPost;
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
