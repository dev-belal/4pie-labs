"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, BarChart3, CheckCircle2, ChevronRight, Link2, Loader2 } from "lucide-react";
import { publishBlog } from "@/lib/admin-actions";
import { publishInitial } from "@/lib/form-types";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BlogPublisher() {
  const [state, formAction, pending] = useActionState(
    publishBlog,
    publishInitial,
  );
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [image, setImage] = useState("");
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "success") {
      setNotice({ type: "success", message: state.message ?? "Published" });
      setTitle("");
      setSlug("");
      setSlugManual(false);
      setImage("");
      const form = document.getElementById("blog-form") as HTMLFormElement | null;
      form?.reset();
    } else if (state.status === "error") {
      setNotice({ type: "error", message: state.message ?? "Failed" });
    }
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [state]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManual) setSlug(generateSlug(value));
  };

  const handleSlugChange = (value: string) => {
    setSlugManual(true);
    setSlug(generateSlug(value));
  };

  return (
    <>
      <form
        id="blog-form"
        action={formAction}
        className="space-y-8 glass-morphism p-10 rounded-[40px] border-white/5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="blog-title"
                className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
              >
                Article Title
              </label>
              <input
                id="blog-title"
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all font-display text-xl"
                placeholder="The Future of AI..."
              />
              {state.errors?.title && (
                <p className="text-xs text-red-400 ml-1">
                  {state.errors.title[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="blog-slug"
                className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1 flex items-center gap-2"
              >
                <Link2 className="w-3 h-3" />
                URL Slug
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 text-sm font-mono">
                  /blog/
                </span>
                <input
                  id="blog-slug"
                  name="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-[5.5rem] pr-6 text-white focus:outline-none focus:border-primary/50 transition-all font-mono text-sm"
                  placeholder="the-future-of-ai"
                />
              </div>
              {slug && (
                <p className="text-[10px] text-white/20 ml-1 font-mono">
                  fourpielabs.com/blog/{slug}
                </p>
              )}
              {state.errors?.slug && (
                <p className="text-xs text-red-400 ml-1">
                  {state.errors.slug[0]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="blog-category"
                  className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
                >
                  Category
                </label>
                <select
                  id="blog-category"
                  name="category"
                  defaultValue="GUIDE"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option>GUIDE</option>
                  <option>STRATEGY</option>
                  <option>INSIGHTS</option>
                  <option>NEWS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="blog-read-time"
                  className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
                >
                  Read Time
                </label>
                <input
                  id="blog-read-time"
                  name="readTime"
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="5 min read"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="blog-author"
                className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
              >
                Author
              </label>
              <input
                id="blog-author"
                name="author"
                type="text"
                defaultValue="Syed Belal"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all"
                placeholder="Author name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="blog-image"
              className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
            >
              Header Image URL
            </label>
            {image ? (
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white/60 hover:text-white transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="aspect-video rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 border-dashed">
                <BarChart3 className="w-8 h-8 text-white/20" />
                <input
                  id="blog-image"
                  name="image"
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-3/4 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white/60 text-xs focus:outline-none focus:border-primary/50 transition-all text-center"
                  placeholder="Paste image URL here..."
                />
              </div>
            )}
            {image && <input type="hidden" name="image" value={image} />}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="blog-excerpt"
            className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
          >
            Excerpt (Short Summary)
          </label>
          <textarea
            id="blog-excerpt"
            name="excerpt"
            rows={2}
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all resize-none"
            placeholder="Catchy hook for the listing card..."
          />
          {state.errors?.excerpt && (
            <p className="text-xs text-red-400 ml-1">
              {state.errors.excerpt[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="blog-content"
            className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1"
          >
            Full Content (Markdown Supported)
          </label>
          <textarea
            id="blog-content"
            name="content"
            rows={12}
            required
            className="w-full bg-white/10 border border-white/10 rounded-[32px] py-8 px-8 text-white focus:outline-none focus:border-primary/50 transition-all resize-none font-mono text-sm leading-relaxed"
            placeholder={`# Start writing your masterpiece...\n\nUse standard markdown for formatting.`}
          />
          {state.errors?.content && (
            <p className="text-xs text-red-400 ml-1">
              {state.errors.content[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/10 disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
            </>
          ) : (
            <>
              Publish Article to Live Site <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-12 right-12 z-50 px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 ${
              notice.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <div>
              <div className="font-bold">
                {notice.type === "success" ? "Success!" : "Error"}
              </div>
              <div className="text-white/80 text-[10px] uppercase font-bold tracking-widest">
                {notice.message}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
