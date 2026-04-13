import { cache } from "react";
import {
  blogs as staticBlogs,
  getBlogBySlug as getStaticBySlug,
  type BlogPost,
} from "@/data/blogs";
import { createPublicClient } from "@/lib/supabase/public-client";

/**
 * Column alias: map the snake_case Postgres column `read_time` to the
 * camelCase field `readTime` expected by the BlogPost type.
 */
const BLOG_SELECT =
  "id, slug, title, category, author, date, readTime:read_time, image, excerpt, content, views, created_at";

export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
  try {
    // Public anonymous read — no cookies, lets Next.js statically ISR.
    const supabase = createPublicClient();
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
      const supabase = createPublicClient();
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
    // Public client: the RPC is `security definer` and the metrics insert
    // policy allows anon. Staying off the SSR client keeps /blog/[slug]
    // eligible for ISR instead of being forced fully dynamic.
    const supabase = createPublicClient();

    const rpc = await supabase.rpc("increment_blog_views", { p_slug: slug });
    if (rpc.error) {
      // Fallback: only admins can UPDATE blogs.views directly under our
      // RLS, so this path won't actually bump the counter for anon users.
      // Left in place as a no-op safety net if the RPC is ever dropped;
      // the metrics event below still records the view.
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
