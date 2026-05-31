import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { blogs as staticBlogs, type BlogPost } from "@/data/blogs";
import { createPublicClient } from "@/lib/supabase/public-client";
import { cn } from "@/lib/utils";

async function getLatestPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("blogs")
      .select(
        "id, slug, title, category, author, date, readTime:read_time, image, excerpt, content, views, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(3);

    if (data && data.length > 0) return data as unknown as BlogPost[];
  } catch {
    // fall through to static
  }
  return staticBlogs.slice(0, 3);
}

export async function BlogSection() {
  const featuredPosts = await getLatestPosts();

  return (
    <section
      id="blog"
      className="relative py-24 md:py-28 px-4 border-t border-border overflow-hidden"
    >
      <span
        aria-hidden
        className="absolute pointer-events-none -top-10 left-0 w-[500px] h-[500px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,155,124,0.20), transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1240px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 md:mb-16 gap-6">
          <div>
            <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-3">
              Field notes
            </span>
            <h2 className="text-[clamp(32px,4vw,44px)] font-semibold tracking-tight text-foreground mb-4 [text-wrap:balance]">
              Articles &amp;{" "}
              <span className="font-semibold text-primary">insights.</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl">
              Deep dives on AI-first marketing, local SEO, and answer-engine
              optimization for service businesses.
            </p>
          </div>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 bg-surface hover:bg-surface-2 border border-border text-foreground px-6 py-3 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            View all articles
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {featuredPosts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className={cn(
                "group block bg-surface border border-card-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all",
                i === 2 && "hidden md:block",
              )}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 inline-flex items-center px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur border border-card-border text-[10px] font-medium tracking-widest text-primary uppercase">
                  {post.category}
                </span>
              </div>
              <div className="p-6 flex flex-col">
                <div className="flex items-center gap-3 text-[11px] font-medium text-subtle-foreground uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{post.date}</span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight leading-snug text-foreground group-hover:text-primary transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
