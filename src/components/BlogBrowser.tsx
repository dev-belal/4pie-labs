"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Search, Sparkles, User } from "lucide-react";
import { blogCategories, type BlogPost } from "@/data/blogs";

export function BlogBrowser({ posts }: { posts: BlogPost[] }) {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = posts.filter(
    (blog) =>
      (activeCategory === "ALL" || blog.category === activeCategory) &&
      (blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-14 gap-8">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
            Field notes
          </span>
          <h1 className="text-[clamp(40px,6vw,56px)] font-semibold tracking-tight leading-[1.05] text-foreground mb-5 [text-wrap:balance]">
            Insights for local{" "}
            <span className="font-semibold text-primary">growth.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Deep dives on AEO, local SEO, automation, and what actually moves
            the needle for service businesses.
          </p>
        </div>

        <div className="relative w-full md:w-80 group shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-12">
        {blogCategories.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
              activeCategory === cat
                ? "bg-primary text-on-primary shadow-[var(--shadow-cta)]"
                : "bg-surface border border-card-border text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((blog, i) => (
              <motion.div
                key={blog.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/blog/${blog.slug}`}
                  className="group block bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col h-full"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 inline-flex items-center px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur border border-card-border text-[10px] font-medium tracking-widest text-primary uppercase">
                      {blog.category}
                    </span>
                  </div>

                  <div className="p-6 md:p-7 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-[11px] font-medium text-subtle-foreground uppercase tracking-wider mb-3">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {blog.readTime}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>{blog.date}</span>
                    </div>

                    <h3 className="text-lg font-semibold tracking-tight leading-snug text-foreground group-hover:text-primary transition-colors mb-3">
                      {blog.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-5">
                      {blog.excerpt}
                    </p>

                    <div className="mt-auto pt-5 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary-muted grid place-items-center">
                          <User className="w-3 h-3 text-primary" />
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {blog.author}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                        Read
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)]">
              <span className="w-14 h-14 rounded-2xl bg-primary-muted grid place-items-center mx-auto mb-5">
                <Sparkles className="w-6 h-6 text-primary" />
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">
                No matching articles found.
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                Try a different category or clear the search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("ALL");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
