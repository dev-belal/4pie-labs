import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, Clock, Plus, User } from "lucide-react";
import { blogs as staticBlogs, type BlogFAQ } from "@/data/blogs";
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

  // Per-post social card. Falls back to the root layout's /og-image.png
  // automatically when post.image is the placeholder (same file). When
  // post.image is a real Pixabay/Unsplash URL it overrides cleanly.
  const ogImage = post.image;

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
      images: [
        { url: ogImage, width: 1200, height: 630, alt: post.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

/**
 * Inline-Markdown tokenizer. Splits a line on `**bold**` and `[text](url)`
 * runs and renders each token as the right React node:
 *   - `**...**`           -> <strong>
 *   - `[text](/internal)` -> Next.js <Link> (client navigation)
 *   - `[text](https://…)` -> <a target="_blank" rel="noopener noreferrer">
 *   - everything else      -> plain text
 *
 * The split regex captures both patterns as alternatives so the array
 * returned by .split() alternates between text and captured tokens.
 * Pattern is greedy on the bold side (`[^*]+`) and link side (`[^\]]+`
 * for the text, `[^)]+` for the href) which keeps it simple while
 * matching the prose in src/data/blogs.ts. Not a full Markdown parser.
 */
const INLINE_LINK_CLASS =
  "text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors";

function renderInline(text: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith("**") && part.endsWith("**")) {
      out.push(
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>,
      );
      continue;
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      // Internal site path -> Next/Link so navigation stays client-side and
      // benefits from prefetch. Anything else (https://, mailto:, tel:,
      // #anchor) renders as a plain <a> with safe rel attrs for external.
      if (href.startsWith("/")) {
        out.push(
          <Link key={i} href={href} className={INLINE_LINK_CLASS}>
            {label}
          </Link>,
        );
      } else if (href.startsWith("#")) {
        out.push(
          <a key={i} href={href} className={INLINE_LINK_CLASS}>
            {label}
          </a>,
        );
      } else {
        out.push(
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={INLINE_LINK_CLASS}
          >
            {label}
          </a>,
        );
      }
      continue;
    }

    out.push(<span key={i}>{part}</span>);
  }
  return out;
}

/**
 * Match a Markdown image line: `![alt text](path)`. Whole-line match only
 * so it never collides with inline links inside prose paragraphs.
 * Capture groups: 1 = alt, 2 = src.
 */
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

/**
 * A markdown table row starts and ends with a `|`. The separator row
 * (between the header and body) contains only `|`, `-`, `:`, and spaces.
 * We use these to detect the boundaries of a table block.
 */
function isTableRow(line: string): boolean {
  return line.startsWith("|") && line.length > 1;
}
function isTableSeparator(line: string): boolean {
  return /^\|[\s:|-]+\|$/.test(line) && line.includes("-");
}

/**
 * Split `| a | b | c |` into ["a", "b", "c"]. Trims each cell. Drops the
 * leading and trailing empty cells produced by the boundary pipes.
 */
function splitTableRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

/**
 * Tiny line-based Markdown renderer. Handles:
 *   - `# ` skipped (page already renders post.title as <h1>)
 *   - `## ` -> <h2>   (section heads)
 *   - `### ` -> <h3>  (subsection heads)
 *   - `- ` lines -> collected into a single <ul>
 *   - `![alt](path)` on its own line -> next/image in a 16/9 wrapper
 *   - Blank lines -> flush the current list / break paragraph
 *   - Everything else -> <p> with inline `**bold**` support
 * Not a full Markdown parser. It's tuned to the prose pattern the editorial
 * pipeline uses in src/data/blogs.ts.
 */
function renderContent(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const items = listBuffer;
    listBuffer = [];
    out.push(
      <ul
        key={`list-${out.length}`}
        className="my-4 ml-6 list-disc space-y-2 text-foreground/85"
      >
        {items.map((item, j) => (
          <li key={j}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/\s+$/, ""); // strip trailing whitespace

    // Detect a markdown table: header row + separator + 1+ body rows. We
    // consume the whole block at once and skip the consumed lines via the
    // outer loop variable. Sits BEFORE the heading / list / image branches
    // because nothing else starts with `|`.
    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1].trim())
    ) {
      flushList();
      const headers = splitTableRow(line);
      const bodyRows: string[][] = [];
      let j = i + 2; // skip header + separator
      while (j < lines.length && isTableRow(lines[j].trim())) {
        bodyRows.push(splitTableRow(lines[j].trim()));
        j++;
      }
      out.push(
        <div
          key={i}
          className="my-10 -mx-4 md:mx-0 overflow-x-auto rounded-2xl border border-card-border shadow-[var(--shadow-card)]"
        >
          <table className="w-full text-sm md:text-base border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-surface-2 border-b border-card-border">
                {headers.map((h, k) => (
                  <th
                    key={k}
                    className="px-4 py-3 text-left font-semibold text-foreground"
                  >
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-border last:border-b-0 align-top"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-3 text-foreground/85 leading-snug ${
                        cIdx === 0 ? "font-medium text-foreground" : ""
                      }`}
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      i = j - 1; // outer loop will i++ to land on the next non-table line
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      continue; // post title is rendered separately in the header
    }
    if (line.startsWith("## ")) {
      flushList();
      out.push(
        <h2
          key={i}
          className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground pt-8 mb-3"
        >
          {line.slice(3)}
        </h2>,
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      out.push(
        <h3
          key={i}
          className="text-xl md:text-2xl font-semibold tracking-tight text-foreground pt-5 mb-2"
        >
          {line.slice(4)}
        </h3>,
      );
      continue;
    }
    const imgMatch = line.match(IMAGE_LINE);
    if (imgMatch) {
      flushList();
      const [, alt, src] = imgMatch;
      out.push(
        <figure
          key={i}
          className="relative aspect-[16/9] rounded-2xl overflow-hidden my-10 border border-card-border shadow-[var(--shadow-card)]"
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 768px"
            className="object-cover"
          />
        </figure>,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      continue;
    }
    if (line.trim() === "") {
      flushList();
      continue;
    }
    flushList();
    out.push(<p key={i}>{renderInline(line)}</p>);
  }
  flushList();
  return out;
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
    // ISO 8601 for Schema.org Date type. Display string "May 28, 2026"
    // would not validate; datePublishedISO is the canonical form.
    datePublished: post.datePublishedISO ?? post.date,
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

  const faqSchema =
    post.faqs && post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((f: BlogFAQ) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <div className="overflow-x-hidden">
      <JsonLd data={article} />
      <JsonLd data={breadcrumb} />
      {faqSchema && <JsonLd data={faqSchema} />}
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
            <time
              dateTime={post.datePublishedISO ?? undefined}
              className="text-subtle-foreground"
            >
              {post.date}
            </time>
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

        {post.faqs && post.faqs.length > 0 && (
          <section
            aria-labelledby="post-faq-heading"
            className="mt-16 pt-10 border-t border-border"
          >
            <h2
              id="post-faq-heading"
              className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6"
            >
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {post.faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group bg-surface border border-card-border rounded-xl p-5 md:p-6 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                    <span className="text-base font-semibold text-foreground tracking-tight pr-4">
                      {faq.q}
                    </span>
                    <span className="shrink-0 w-7 h-7 rounded-full bg-surface-2 grid place-items-center text-muted-foreground group-open:bg-primary-muted group-open:text-primary transition-colors">
                      <Plus className="w-3.5 h-3.5 group-open:rotate-45 transition-transform" />
                    </span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed text-sm md:text-base">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

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
