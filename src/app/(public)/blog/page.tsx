import type { Metadata } from "next";
import { blogs as staticBlogs, type BlogPost } from "@/data/blogs";
import { createClient } from "@/lib/supabase/server";
import { BlogBrowser } from "@/components/BlogBrowser";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Deep dives into AI automation, digital marketing strategy, and the future of autonomous agencies.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — 4Pie Labs",
    description:
      "Deep dives into AI automation, digital marketing strategy, and the future of autonomous agencies.",
    url: "/blog",
    type: "website",
  },
};

export const revalidate = 3600;

async function getPosts(): Promise<BlogPost[]> {
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
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-4 overflow-x-hidden">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <BlogBrowser posts={posts} />
      </div>
    </div>
  );
}
