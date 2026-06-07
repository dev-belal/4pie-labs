import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogBrowser } from "@/components/BlogBrowser";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const BLOG_DESCRIPTION =
  "AEO, local SEO, and AI-first marketing playbooks for painting contractors, tour operators, and local service businesses.";

export const metadata: Metadata = {
  // Keyword-bearing title - "Blog" alone is generic; the buyer query is
  // about playbooks for local marketing + AEO.
  title: { absolute: "AEO + Local Marketing Playbooks | 4Pie Labs" },
  description: BLOG_DESCRIPTION,
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

  const blogUrl = `${SITE.url}/blog`;

  // blogPost[] holds @id pointers only - the full BlogPosting schema
  // lives on each post page. The @id format matches what
  // /blog/[slug]/page.tsx emits in mainEntityOfPage["@id"], so
  // crawlers can reconcile this Blog's post list to the individual
  // BlogPostings without us re-declaring them inline.
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${blogUrl}#blog`,
    url: blogUrl,
    name: "AEO + Local Marketing Playbooks",
    description: BLOG_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      "@id": `${SITE.url}#organization`,
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${SITE.url}/blog/${post.slug}`,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: blogUrl,
      },
    ],
  };

  return (
    <main className="relative px-4 pt-12 md:pt-20 pb-24 overflow-x-hidden">
      <JsonLd data={blogSchema} />
      <JsonLd data={breadcrumbSchema} />
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
