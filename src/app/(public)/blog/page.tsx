import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogBrowser } from "@/components/BlogBrowser";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "AEO, local SEO, and AI-first marketing playbooks for painting contractors, tour operators, and local service businesses.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog - 4Pie Labs",
    description:
      "AEO, local SEO, and AI-first marketing playbooks for local service businesses.",
    url: "/blog",
    type: "website",
  },
};

export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="relative px-4 pt-12 md:pt-20 pb-24 overflow-x-hidden">
      <span
        aria-hidden
        className="absolute pointer-events-none -top-24 -left-32 w-[480px] h-[480px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.32), transparent 60%)",
        }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none top-[35%] -right-24 w-[400px] h-[400px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,155,124,0.28), transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto">
        <BlogBrowser posts={posts} />
      </div>
    </main>
  );
}
