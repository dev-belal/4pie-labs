"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  Inbox,
  MessageCircle,
} from "lucide-react";
import {
  deleteOldReadNotifications,
  markAllRead,
  markRead,
} from "@/lib/notification-actions";
import type { Notification, NotificationKind } from "@/lib/admin-data";

/**
 * The bell in the admin topbar. Holds:
 *   - the unread total badge (number ≤9, "9+", or hidden when 0)
 *   - the popover list (icon + title + relative time + unread dot)
 *   - per-row click → mark read + cross-tab navigation via `onOpen`
 *   - "Mark all read" footer button
 *
 * State strategy:
 *   - `notifications` comes from server props (re-fetched on every
 *     router.refresh from Realtime ticks + the 15s poll).
 *   - Mark-read mutations apply OPTIMISTICALLY to `localState` so the
 *     dot/count clear instantly; the server action runs in a transition
 *     and the next refresh reconciles. Rollback on error.
 *   - First open of the popover fires `deleteOldReadNotifications` as
 *     opportunistic cleanup. Failure is silent.
 */

interface LocalState {
  // Map of id -> override read_at. When the user clicks an unread item we
  // splice a synthetic timestamp here so the row renders as read without
  // waiting for the round-trip. The server action commits the real value
  // shortly after; the next router.refresh replaces this map with the
  // canonical server state.
  reads: Map<string, string>;
  // True after a markAllRead until the next props refresh. Lets us hide
  // the dot + zero-out the count optimistically.
  allRead: boolean;
}

export function NotificationsBell({
  notifications,
  unreadTotal,
  onOpenNotification,
}: {
  notifications: Notification[];
  unreadTotal: number;
  onOpenNotification: (kind: NotificationKind, sourceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<LocalState>({
    reads: new Map(),
    allRead: false,
  });
  // Track the notifications reference so we can reset our optimistic
  // overrides whenever the server hands us a fresh payload — the new
  // props ARE the canonical view, so any pending stamps either landed
  // server-side already or need to be re-derived from scratch.
  // React 19 "storing information from previous renders" pattern; cheaper
  // than an effect + avoids the cascading-render lint warning.
  const [lastNotificationsRef, setLastNotificationsRef] =
    useState(notifications);
  if (lastNotificationsRef !== notifications) {
    setLastNotificationsRef(notifications);
    setLocal({ reads: new Map(), allRead: false });
  }
  const [, startTransition] = useTransition();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const cleanupRanRef = useRef(false);

  // Click-outside to close. Cheaper than a global overlay layer.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Effective read state after applying optimistic overrides.
  const isRead = (n: Notification): boolean => {
    if (local.allRead) return true;
    if (n.read_at) return true;
    return local.reads.has(n.id);
  };

  const effectiveUnreadCount = local.allRead
    ? 0
    : Math.max(
        0,
        unreadTotal -
          notifications.filter(
            (n) => !n.read_at && local.reads.has(n.id),
          ).length,
      );

  const dotLabel =
    effectiveUnreadCount === 0
      ? null
      : effectiveUnreadCount > 9
        ? "9+"
        : String(effectiveUnreadCount);

  const openBell = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !cleanupRanRef.current) {
        cleanupRanRef.current = true;
        // Fire-and-forget; success/failure shape ignored. The 90-day
        // cutoff means this rarely deletes anything but keeps the table
        // from growing forever.
        startTransition(async () => {
          await deleteOldReadNotifications();
        });
      }
      return next;
    });
  };

  const handleClickNotification = (n: Notification) => {
    setOpen(false);
    // Optimistic: stamp read locally so the row clears before the round-trip.
    if (!isRead(n)) {
      setLocal((prev) => {
        const reads = new Map(prev.reads);
        reads.set(n.id, new Date().toISOString());
        return { ...prev, reads };
      });
      startTransition(async () => {
        const res = await markRead(n.id);
        if (!res.ok) {
          // Rollback the optimistic stamp; the next router.refresh will
          // re-resolve from server state anyway.
          setLocal((prev) => {
            const reads = new Map(prev.reads);
            reads.delete(n.id);
            return { ...prev, reads };
          });
        }
        router.refresh();
      });
    }
    onOpenNotification(n.kind, n.source_id);
  };

  const handleMarkAll = () => {
    setLocal((prev) => ({ ...prev, allRead: true }));
    startTransition(async () => {
      const res = await markAllRead();
      if (!res.ok) {
        setLocal((prev) => ({ ...prev, allRead: false }));
      }
      router.refresh();
    });
  };

  const visibleUnread = notifications.filter((n) => !isRead(n)).length;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={openBell}
        aria-label="Notifications"
        aria-expanded={open}
        title={
          effectiveUnreadCount === 0
            ? "Notifications"
            : `${effectiveUnreadCount} unread`
        }
        className="relative p-2 rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        <Bell className="w-4 h-4" />
        {dotLabel !== null && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 inline-flex items-center justify-center text-[10px] font-semibold rounded-full bg-primary text-on-primary ring-2 ring-[var(--surface)]">
            {dotLabel}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            role="dialog"
            aria-label="Recent notifications"
            className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[28rem] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold leading-tight">
                  Notifications
                </div>
                <div className="text-[11px] text-[var(--muted)] leading-tight">
                  {visibleUnread === 0
                    ? "All caught up"
                    : `${visibleUnread} unread`}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                  Nothing yet. Leads, chats, and bookings show up here.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleClickNotification(n)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[var(--surface-hover)] ${
                          isRead(n) ? "opacity-70" : ""
                        }`}
                      >
                        <KindIcon kind={n.kind} read={isRead(n)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <div className="text-sm font-medium leading-snug truncate flex-1">
                              {n.title}
                            </div>
                            {!isRead(n) && (
                              <span
                                aria-label="Unread"
                                className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary"
                              />
                            )}
                          </div>
                          {n.preview && (
                            <div className="text-[12px] text-[var(--muted)] mt-0.5 line-clamp-2">
                              {n.preview}
                            </div>
                          )}
                          <div className="text-[11px] text-[var(--muted)] mt-1">
                            {timeAgo(n.created_at)}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-[var(--border)] px-3 py-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={visibleUnread === 0}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KindIcon({
  kind,
  read,
}: {
  kind: NotificationKind;
  read: boolean;
}) {
  const Icon =
    kind === "lead"
      ? Inbox
      : kind === "conversation"
        ? MessageCircle
        : kind === "appointment"
          ? CalendarDays
          : Check;
  return (
    <div
      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        read
          ? "bg-[var(--surface-hover)] text-[var(--muted)]"
          : "bg-[var(--accent-soft)] text-[var(--on-soft)]"
      }`}
    >
      <Icon className="w-4 h-4" />
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
