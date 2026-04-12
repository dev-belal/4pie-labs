"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Clock, Search, Sparkles, User } from "lucide-react";
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
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight text-white">
            Latest <span className="text-gradient">Insights</span> <br />
            &amp; AI Research.
          </h1>
          <p className="text-white/50 text-xl leading-relaxed">
            Deep dives into AI automation, digital marketing strategy, and the
            future of autonomous agencies.
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-12">
        {blogCategories.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-widest transition-all ${
              activeCategory === cat
                ? "bg-white text-black scale-105 shadow-xl"
                : "glass-morphism text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((blog, i) => (
              <motion.div
                key={blog.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/blog/${blog.slug}`}
                  className="group glass-morphism rounded-[40px] border-white/5 hover:border-white/20 transition-all overflow-hidden flex flex-col h-full shadow-2xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-primary shadow-lg">
                      {blog.category}
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col text-white">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {blog.readTime}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{blog.date}</span>
                    </div>

                    <h3 className="text-2xl font-display font-bold mb-4 leading-tight group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>

                    <p className="text-white/50 text-sm leading-relaxed mb-8 line-clamp-3">
                      {blog.excerpt}
                    </p>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-[11px] font-bold text-white/40">
                          {blog.author}
                        </span>
                      </div>
                      <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center text-white">
              <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-6" />
              <h3 className="text-2xl font-display font-bold text-white/20">
                No matching articles found.
              </h3>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear search filter
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
