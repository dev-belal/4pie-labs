"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Link2,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { publishBlog, updateBlog } from "@/lib/admin-actions";
import { publishInitial } from "@/lib/form-types";
import { SITE } from "@/lib/site";
import {
  BLOG_FORM_CATEGORIES,
  type BlogFAQ,
  type BlogPost,
} from "@/data/blogs";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  // Required in edit mode; ignored in create mode.
  initial?: BlogPost;
  // Optional callback fired after a successful publish/update so the
  // BlogsListPanel container can return to list view.
  onDone?: () => void;
  // Cancel button is only meaningful when the editor is nested in a
  // BlogsListPanel "screen" - omit to hide it.
  onCancel?: () => void;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BlogEditor({ mode, initial, onDone, onCancel }: Props) {
  // Bind to the right server action for the mode. Both share PublishState
  // so useActionState's prev/formData signature is identical.
  const action = mode === "edit" ? updateBlog : publishBlog;
  const [state, formAction, pending] = useActionState(action, publishInitial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  // Track whether the admin has edited the slug by hand. In create mode,
  // the slug auto-derives from the title until the admin touches it. In
  // edit mode, the slug starts pre-populated and is considered manual.
  const [slugManual, setSlugManual] = useState(mode === "edit");
  const [image, setImage] = useState(initial?.image ?? "");
  const [faqs, setFaqs] = useState<BlogFAQ[]>(initial?.faqs ?? []);
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  /* eslint-disable react-hooks/set-state-in-effect --
     One-shot reaction to a finished useActionState submit (same pattern
     the old BlogPublisher used). The `state` ref changes only on submit
     completion, not on every render. */
  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "success") {
      setNotice({ type: "success", message: state.message ?? "Saved" });
      if (mode === "create") {
        // Reset the form so the admin can publish another post without
        // a route change. Edit mode does NOT reset - the row's values
        // are still the source of truth.
        setTitle("");
        setSlug("");
        setSlugManual(false);
        setImage("");
        setFaqs([]);
        const form = document.getElementById(
          "blog-editor-form",
        ) as HTMLFormElement | null;
        form?.reset();
      }
      if (onDone) {
        // Defer so the success toast paints first.
        const t = window.setTimeout(onDone, 1200);
        return () => window.clearTimeout(t);
      }
    } else if (state.status === "error") {
      setNotice({ type: "error", message: state.message ?? "Failed" });
    }
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [state, mode, onDone]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManual) setSlug(generateSlug(value));
  };
  const handleSlugChange = (value: string) => {
    setSlugManual(true);
    setSlug(generateSlug(value));
  };

  const addFaq = () => {
    if (faqs.length >= 12) return;
    setFaqs([...faqs, { q: "", a: "" }]);
  };
  const updateFaq = (idx: number, field: "q" | "a", value: string) => {
    setFaqs(faqs.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  };
  const removeFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  return (
    <>
      <form
        id="blog-editor-form"
        action={formAction}
        className="space-y-6 bg-[var(--surface)] border border-[var(--border)] p-6 md:p-8 rounded-2xl"
      >
        {/* Edit mode carries the row's identifier as a hidden field so
            updateBlog knows which row to write back to even after the
            admin renames the slug. */}
        {mode === "edit" && initial && (
          <input
            type="hidden"
            name="originalSlug"
            value={initial.slug}
          />
        )}
        {/* FAQ state is serialized to one hidden field so the server
            action parses the array with a single JSON.parse rather than
            walking indexed FormData keys. */}
        <input
          type="hidden"
          name="faqsJson"
          value={JSON.stringify(faqs)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="blog-title"
                className="text-xs font-medium text-[var(--muted)] ml-1"
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
                className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all text-lg font-semibold"
                placeholder="The Future of Local Search..."
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
                className="text-xs font-medium text-[var(--muted)] ml-1 flex items-center gap-2"
              >
                <Link2 className="w-3 h-3" />
                URL Slug
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm font-mono">
                  /blog/
                </span>
                <input
                  id="blog-slug"
                  name="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 pl-16 pr-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all font-mono text-sm"
                  placeholder="the-future-of-local-search"
                />
              </div>
              {slug && (
                <p className="text-xs text-[var(--muted)] ml-1 font-mono">
                  {SITE.url.replace(/^https?:\/\//, "")}/blog/{slug}
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
                  className="text-xs font-medium text-[var(--muted)] ml-1"
                >
                  Category
                </label>
                <select
                  id="blog-category"
                  name="category"
                  defaultValue={initial?.category ?? BLOG_FORM_CATEGORIES[0]}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  {BLOG_FORM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {state.errors?.category && (
                  <p className="text-xs text-red-400 ml-1">
                    {state.errors.category[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="blog-read-time"
                  className="text-xs font-medium text-[var(--muted)] ml-1"
                >
                  Read Time
                </label>
                <input
                  id="blog-read-time"
                  name="readTime"
                  type="text"
                  defaultValue={initial?.readTime ?? ""}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="5 min read"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="blog-author"
                  className="text-xs font-medium text-[var(--muted)] ml-1"
                >
                  Author
                </label>
                <input
                  id="blog-author"
                  name="author"
                  type="text"
                  defaultValue={initial?.author ?? "Syed Belal"}
                  required
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Author name"
                />
                {state.errors?.author && (
                  <p className="text-xs text-red-400 ml-1">
                    {state.errors.author[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="blog-date"
                  className="text-xs font-medium text-[var(--muted)] ml-1"
                >
                  Publish Date (ISO)
                </label>
                <input
                  id="blog-date"
                  name="datePublishedISO"
                  type="date"
                  defaultValue={initial?.datePublishedISO ?? ""}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all font-mono text-sm"
                />
                {state.errors?.datePublishedISO && (
                  <p className="text-xs text-red-400 ml-1">
                    {state.errors.datePublishedISO[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="blog-image"
              className="text-xs font-medium text-[var(--muted)] ml-1"
            >
              Header Image URL or Path
            </label>
            {image ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[var(--bg)]/70 flex items-center justify-center text-[var(--fg)]/80 hover:text-[var(--fg)] transition-colors text-sm font-semibold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex flex-col items-center justify-center gap-3 border-dashed">
                <BarChart3 className="w-7 h-7 text-[var(--muted)]" />
                <input
                  id="blog-image"
                  name="image"
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-3/4 bg-[var(--surface)] border border-[var(--border)] rounded-md py-1.5 px-3 text-[var(--fg)] text-xs focus:outline-none focus:border-primary/50 transition-all text-center placeholder:text-[var(--muted)]"
                  placeholder="/blog/foo/header.jpg or https://..."
                />
              </div>
            )}
            {image && <input type="hidden" name="image" value={image} />}
            {state.errors?.image && (
              <p className="text-xs text-red-400 ml-1">
                {state.errors.image[0]}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="blog-excerpt"
            className="text-xs font-medium text-[var(--muted)] ml-1"
          >
            Excerpt (Short Summary)
          </label>
          <textarea
            id="blog-excerpt"
            name="excerpt"
            defaultValue={initial?.excerpt ?? ""}
            rows={2}
            required
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-3 px-4 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all resize-none"
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
            className="text-xs font-medium text-[var(--muted)] ml-1"
          >
            Full Content (Markdown Supported)
          </label>
          <textarea
            id="blog-content"
            name="content"
            defaultValue={initial?.content ?? ""}
            rows={14}
            required
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl py-4 px-5 text-[var(--fg)] focus:outline-none focus:border-primary/50 transition-all resize-none font-mono text-sm leading-relaxed"
            placeholder={`## Section heading\n\nParagraph text. **Bold** + [internal link](/services/aeo) + ![alt](/path.jpg) all supported.`}
          />
          {state.errors?.content && (
            <p className="text-xs text-red-400 ml-1">
              {state.errors.content[0]}
            </p>
          )}
        </div>

        {/* FAQ repeating editor. Drives the FAQPage JSON-LD + visible
            accordion on the rendered post. Empty list -> no FAQ block.
            Max 12 to match Zod cap. */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--muted)] ml-1 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5" />
              FAQs ({faqs.length})
            </label>
            <button
              type="button"
              onClick={addFaq}
              disabled={faqs.length >= 12}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-soft)] text-[var(--on-soft)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              Add FAQ
            </button>
          </div>
          {faqs.length === 0 ? (
            <p className="text-xs text-[var(--muted)] italic px-3">
              No FAQs yet. Adding 3-5 question/answer pairs drives the
              post's FAQPage JSON-LD and the visible accordion at the
              foot of the article (matters for AEO citation).
            </p>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[var(--muted)]">
                      FAQ #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="text-xs text-red-400/70 hover:text-red-400 inline-flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.q}
                    onChange={(e) => updateFaq(idx, "q", e.target.value)}
                    placeholder="Question (the literal phrasing a buyer would search)"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md py-2 px-3 text-sm focus:outline-none focus:border-primary/50"
                  />
                  <textarea
                    value={faq.a}
                    onChange={(e) => updateFaq(idx, "a", e.target.value)}
                    placeholder="Answer (direct, citable - keep under ~200 words)"
                    rows={3}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md py-2 px-3 text-sm focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
              ))}
            </div>
          )}
          {state.errors?.faqs && (
            <p className="text-xs text-red-400 ml-1">
              {state.errors.faqs[0]}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="px-4 py-3 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "edit" ? "Saving..." : "Publishing..."}
              </>
            ) : (
              <>
                {mode === "edit" ? "Save changes" : "Publish article"}{" "}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-white ${
              notice.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <div>
              <div className="font-semibold text-sm">
                {notice.type === "success" ? "Success" : "Error"}
              </div>
              <div className="opacity-90 text-xs">{notice.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
