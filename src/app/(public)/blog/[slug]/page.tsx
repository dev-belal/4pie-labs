import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, Clock, User } from "lucide-react";
import { blogs as staticBlogs } from "@/data/blogs";
import { getPostBySlug } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import {
  FacebookIcon,
  ReadingProgress,
  ShareActions,
  TrackView,
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
          className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground pt-6 mb-3"
        >
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3
          key={key}
          className="text-xl md:text-2xl font-semibold tracking-tight text-foreground pt-4 mb-2"
        >
          {line.replace("### ", "")}
        </h3>
      );
    }
    if (line.startsWith("**")) {
      return (
        <p key={key} className="font-semibold text-foreground">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={key} className="ml-6 list-disc text-muted-foreground">
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

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [post.image],
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
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
    <div className="overflow-x-hidden">
      <JsonLd data={article} />
      <JsonLd data={breadcrumb} />
      <TrackView slug={slug} />
      <ReadingProgress />

      <article className="max-w-3xl mx-auto px-4 pt-10 md:pt-14 pb-24">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-10 transition-colors group w-fit"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to insights
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-3 text-[11px] font-medium text-primary uppercase tracking-widest mb-5">
            <span>{post.category}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-subtle-foreground">{post.date}</span>
          </div>

          <h1 className="text-[clamp(32px,5vw,52px)] font-semibold tracking-tight leading-[1.1] text-foreground mb-8 [text-wrap:balance]">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-6 py-5 border-y border-border">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-primary-muted grid place-items-center">
                <User className="w-4 h-4 text-primary" />
              </span>
              <div>
                <div className="text-[10px] font-medium text-subtle-foreground uppercase tracking-widest">
                  Written by
                </div>
                <div className="text-sm text-foreground font-semibold">
                  {post.author}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-surface-2 grid place-items-center border border-card-border">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </span>
              <div>
                <div className="text-[10px] font-medium text-subtle-foreground uppercase tracking-widest">
                  Reading time
                </div>
                <div className="text-sm text-foreground font-semibold">
                  {post.readTime}
                </div>
              </div>
            </div>

            <ShareActions />
          </div>
        </header>

        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-14 border border-card-border shadow-[var(--shadow-card)]">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 768px"
            priority
            className="object-cover"
          />
        </div>

        <div className="text-foreground/85 leading-[1.75] space-y-5 text-base md:text-lg">
          {renderContent(post.content)}
        </div>

        <div className="mt-20 pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="text-[10px] font-medium text-subtle-foreground uppercase tracking-widest mb-2">
              Share this insight
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-surface border border-card-border hover:border-border px-4 py-2 rounded-lg text-xs font-semibold text-foreground transition-colors"
              >
                <FacebookIcon className="w-3.5 h-3.5" />
                Facebook
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-surface border border-card-border hover:border-border px-4 py-2 rounded-lg text-xs font-semibold text-foreground transition-colors"
              >
                <TwitterIcon className="w-3.5 h-3.5" />
                Twitter
              </button>
            </div>
          </div>

          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
          >
            Back to all articles
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </article>
    </div>
  );
}
