import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { blogs as staticBlogs, type BlogPost } from "@/data/blogs";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

async function getLatestPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (data && data.length > 0) return data as BlogPost[];
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
      className="py-24 px-4 border-t border-white/5 bg-[#080808] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-white">
          <div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Articles &amp; Insights.
            </h2>
            <p className="text-white/40 text-lg">
              Stay ahead of the curve with our latest AI research.
            </p>
          </div>
          <Link
            href="/blog"
            className="flex items-center gap-2 text-sm font-bold bg-white text-black px-6 py-3 rounded-full hover:scale-105 transition-transform"
          >
            VIEW ALL ARTICLES
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-5">
          {featuredPosts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className={cn(
                "group cursor-pointer block",
                i === 2 && "hidden md:block",
              )}
            >
              <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-6 border border-white/5">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-white/80">
                  {post.category}
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/30 text-xs font-bold mb-3 uppercase tracking-widest">
                {post.date}
              </div>
              <h3 className="text-xl font-display font-bold leading-tight group-hover:text-primary transition-colors text-white">
                {post.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
