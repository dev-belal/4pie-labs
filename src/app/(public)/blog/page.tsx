import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
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

export default async function BlogPage() {
  const posts = await getAllPosts();

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
