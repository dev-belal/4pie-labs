import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, User } from "lucide-react";
import { blogs as staticBlogs } from "@/data/blogs";
import { getPostBySlug, trackBlogView } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import {
  FacebookIcon,
  MarqueeFooter,
  ReadingProgress,
  ShareActions,
  TwitterIcon,
} from "@/components/BlogPostClient";

export const revalidate = 3600;

export async function generateStaticParams() {
  return staticBlogs.map((post) => ({ slug: post.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `/blog/${slug}`,
      authors: [post.author],
      // opengraph-image.tsx handles the image automatically
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    const key = `${i}-${line.slice(0, 20)}`;
    if (line.startsWith("# ")) return null;
    if (line.startsWith("## ")) {
      return (
        <h2
          key={key}
          className="text-3xl font-display font-bold text-white pt-8"
        >
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3
          key={key}
          className="text-2xl font-display font-bold text-white pt-4"
        >
          {line.replace("### ", "")}
        </h3>
      );
    }
    if (line.startsWith("**")) {
      return (
        <p key={key} className="font-bold text-white">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={key} className="ml-6 list-disc">
          {line.replace("- ", "")}
        </li>
      );
    }
    if (line.trim() === "") return <br key={key} />;
    return <p key={key}>{line}</p>;
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Fire-and-forget view tracking (server-side, atomic when RPC is present)
  await trackBlogView(slug, post.title);

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [post.image],
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE.url}/blog/${slug}`,
    },
    articleSection: post.category,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE.url}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE.url}/blog/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pt-20">
      <JsonLd data={article} />
      <JsonLd data={breadcrumb} />
      <ReadingProgress />

      <div className="max-w-4xl mx-auto px-4 py-20 relative">
        <Link
          href="/blog"
          className="flex items-center gap-2 text-white/50 hover:text-primary mb-12 transition-colors group w-fit"
        >
          <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          Back to Insights
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-4 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6">
            <span>{post.category}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{post.date}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-10 leading-[1.1]">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-8 py-8 border-y border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  Written By
                </div>
                <div className="text-white font-bold">{post.author}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Clock className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  Reading Time
                </div>
                <div className="text-white font-bold">{post.readTime}</div>
              </div>
            </div>

            <ShareActions />
          </div>
        </header>

        <div className="relative aspect-[21/9] rounded-[48px] overflow-hidden mb-20 shadow-2xl">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[48px]" />
        </div>

        <article className="prose prose-invert prose-lg max-w-none">
          <div className="text-white/70 leading-[1.8] space-y-8 font-light text-lg">
            {renderContent(post.content)}
          </div>
        </article>

        <div className="mt-32 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">
              Share this insight
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex items-center gap-2 glass-morphism px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#1877F2]/20 transition-all text-white"
              >
                <FacebookIcon className="w-3.5 h-3.5" />
                Facebook
              </button>
              <button
                type="button"
                className="flex items-center gap-2 glass-morphism px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#1DA1F2]/20 transition-all text-white"
              >
                <TwitterIcon className="w-3.5 h-3.5" />
                Twitter
              </button>
            </div>
          </div>

          <Link
            href="/blog"
            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-all text-sm"
          >
            Back to all articles
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <MarqueeFooter />
    </div>
  );
}
