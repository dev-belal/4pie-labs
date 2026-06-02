"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, User, X } from "lucide-react";
import { fetchConversationTranscript } from "@/lib/admin-actions";
import type {
  ConversationMessage,
  ConversationSummary,
} from "@/lib/admin-data";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function ConversationsPanel({
  conversations,
}: {
  conversations: ConversationSummary[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<ConversationMessage[] | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useMemo(
    () => conversations.find((c) => c.id === openId) ?? null,
    [conversations, openId],
  );

  useEffect(() => {
    if (!openId) return;
    let cancelled = false;
    (async () => {
      // Inside the async IIFE (runs synchronously until the first await) so
      // these aren't synchronous setState calls in the effect body.
      setLoading(true);
      setThread(null);
      const result = await fetchConversationTranscript(openId);
      if (!cancelled) {
        setThread(result.ok ? result.messages : []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openId]);

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-16 text-center">
        <MessageCircle className="w-10 h-10 mx-auto text-[var(--muted)] mb-4" />
        <p className="text-[var(--muted)] text-sm">
          No chat sessions yet. Visitor conversations will appear here as they
          come in.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setOpenId(c.id)}
            className="w-full text-left p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-[var(--muted)] font-medium">
                    {c.lead_id ? "Lead captured" : "Anonymous"}
                  </span>
                  <span className="text-[var(--faint)]">·</span>
                  <span className="text-xs text-[var(--muted)]">
                    {c.message_count} msg
                  </span>
                </div>
                <p className="text-sm text-[var(--fg)] truncate">
                  {c.preview ?? "(no user messages yet)"}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1 font-mono truncate">
                  {c.session_id}
                </p>
              </div>
              <div className="text-xs text-[var(--muted)] shrink-0 tabular-nums">
                {timeAgo(c.last_message_at)}
              </div>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpenId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col"
            >
              <header className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <div className="min-w-0">
                  <h3 className="text-[var(--fg)] font-semibold">
                    Chat transcript
                  </h3>
                  <p className="text-xs text-[var(--muted)] font-mono truncate">
                    {open.session_id}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close transcript"
                  onClick={() => setOpenId(null)}
                  className="p-2 rounded-full text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && (
                  <p className="text-[var(--muted)] text-sm text-center py-8">
                    Loading…
                  </p>
                )}
                {!loading &&
                  thread?.map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${
                          m.role === "user"
                            ? "bg-[var(--accent-softer)] border-primary/30"
                            : "bg-[var(--surface-hover)] border-[var(--border)]"
                        }`}
                      >
                        {m.role === "user" ? (
                          <User className="w-4 h-4 text-primary" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-[var(--muted)]" />
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-[var(--accent-soft)] text-[var(--on-soft)] rounded-tr-none"
                            : "bg-[var(--surface-hover)] text-[var(--fg)] rounded-tl-none border border-[var(--border)]"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                {!loading && thread?.length === 0 && (
                  <p className="text-[var(--muted)] text-sm text-center py-8">
                    No messages in this session.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
