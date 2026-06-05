"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { deleteBlog } from "@/lib/admin-actions";
import type { BlogPost } from "@/data/blogs";
import { BlogEditor } from "./BlogEditor";
import { ConfirmModal } from "./ConfirmModal";

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; post: BlogPost };

interface Props {
  blogs: BlogPost[];
  // Optional consumer of the AdminShell topbar's globalSearch. Filters
  // the list by title/slug/category. Undefined = no filter applied.
  globalSearch?: string;
}

export function BlogsListPanel({ blogs, globalSearch }: Props) {
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const [confirming, setConfirming] = useState<BlogPost | null>(null);

  const search = (globalSearch ?? "").trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!search) return blogs;
    return blogs.filter((b) => {
      const hay = `${b.title} ${b.slug} ${b.category}`.toLowerCase();
      return hay.includes(search);
    });
  }, [blogs, search]);

  const runDelete = (post: BlogPost) => {
    startTransition(async () => {
      const res = await deleteBlog(post.slug);
      setConfirming(null);
      if (res.ok) {
        setNotice({ type: "success", message: `"${post.title}" deleted.` });
      } else {
        setNotice({ type: "error", message: res.error });
      }
      window.setTimeout(() => setNotice(null), 4000);
    });
  };

  if (mode.kind === "create") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMode({ kind: "list" })}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to blogs
        </button>
        <BlogEditor
          mode="create"
          onCancel={() => setMode({ kind: "list" })}
          onDone={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  if (mode.kind === "edit") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMode({ kind: "list" })}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to blogs
        </button>
        <BlogEditor
          mode="edit"
          initial={mode.post}
          onCancel={() => setMode({ kind: "list" })}
          onDone={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm text-[var(--muted)]">
          <span className="font-semibold text-[var(--fg)]">
            {filtered.length}
          </span>{" "}
          of {blogs.length} articles
          {search && (
            <span className="ml-2 text-xs">
              matching <span className="font-mono">{`"${search}"`}</span>
            </span>
          )}
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setMode({ kind: "create" })}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New article
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-[var(--muted)]">
            {search
              ? "No articles match this search."
              : "No articles yet. Publish your first one."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Title</th>
                  <th className="text-left px-3 py-3">Category</th>
                  <th className="text-left px-3 py-3">Author</th>
                  <th className="text-left px-3 py-3">Date</th>
                  <th className="text-right px-3 py-3">Views</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-5 py-3 max-w-xs">
                      <div className="font-medium text-[var(--fg)] truncate">
                        {post.title}
                      </div>
                      <div className="text-xs text-[var(--muted)] font-mono truncate">
                        /blog/{post.slug}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-[var(--surface-hover)] text-[var(--muted)]">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {post.author}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)] tabular-nums whitespace-nowrap">
                      {post.date}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="inline-flex items-center gap-1 text-[var(--muted)]">
                        <Eye className="w-3 h-3" />
                        {/* views isn't on the BlogPost type but the DB
                            row carries it; cast for the optional access. */}
                        {(post as BlogPost & { views?: number }).views ?? 0}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMode({ kind: "edit", post })}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(post)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium text-white ${
            notice.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {notice.message}
        </div>
      )}

      <ConfirmModal
        open={confirming !== null}
        title="Delete this article?"
        message={
          confirming ? (
            <>
              <span className="font-semibold text-[var(--fg)]">
                {`"${confirming.title}"`}
              </span>{" "}
              will be removed from /blog, the homepage strip, and the sitemap.
            </>
          ) : (
            ""
          )
        }
        warning="This can't be undone."
        confirmLabel="Delete article"
        pendingLabel="Deleting…"
        variant="destructive"
        busy={isPending}
        onConfirm={() => confirming && runDelete(confirming)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
