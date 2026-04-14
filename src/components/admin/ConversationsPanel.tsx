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
    setLoading(true);
    setThread(null);
    (async () => {
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
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
        <MessageCircle className="w-10 h-10 mx-auto text-white/20 mb-4" />
        <p className="text-white/40 text-sm">
          No chat sessions yet. Visitor conversations will appear here as they
          come in.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setOpenId(c.id)}
            className="w-full text-left p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {c.lead_id ? "Lead captured" : "Anonymous"}
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="text-[10px] text-white/40">
                    {c.message_count} msg
                  </span>
                </div>
                <p className="text-sm text-white/80 truncate">
                  {c.preview ?? "(no user messages yet)"}
                </p>
                <p className="text-[11px] text-white/30 mt-1 font-mono truncate">
                  {c.session_id}
                </p>
              </div>
              <div className="text-[11px] text-white/40 shrink-0">
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpenId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col"
            >
              <header className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="min-w-0">
                  <h3 className="text-white font-bold">Chat transcript</h3>
                  <p className="text-[11px] text-white/40 font-mono truncate">
                    {open.session_id}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close transcript"
                  onClick={() => setOpenId(null)}
                  className="p-2 rounded-full text-white/40 hover:bg-white/5 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loading && (
                  <p className="text-white/40 text-sm text-center py-8">
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
                            ? "bg-primary/10 border-primary/20"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        {m.role === "user" ? (
                          <User className="w-4 h-4 text-primary" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-white/60" />
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-primary/20 text-white rounded-tr-none"
                            : "bg-white/5 text-white/80 rounded-tl-none border border-white/5"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                {!loading && thread?.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-8">
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
