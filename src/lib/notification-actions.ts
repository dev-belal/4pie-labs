"use server";

/**
 * Admin notification server actions. All entry points are gated by
 * `requireAdminSession` and operate through the service-role client - the
 * notifications table has RLS enabled with no policies, so anon and
 * authenticated are denied; only the service role bypasses.
 *
 * Reads (getRecentNotifications, getUnreadCounts) live here too even though
 * server actions are typically reserved for mutations - this keeps the
 * "use server" surface area discoverable in one place and lets the bell
 * dropdown re-fetch the list after a markRead without round-tripping the
 * full admin page.
 *
 * Why we don't revalidate from inside these actions: the admin page is
 * `dynamic = "force-dynamic"` and AdminShell calls router.refresh() on
 * Realtime INSERT events. Marking read is reflected client-side
 * optimistically; the next router.refresh (Realtime tick or 15s poll)
 * pulls the new server state.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin-session";
import { uuidSchema } from "@/lib/schemas";
import type {
  Notification,
  NotificationKind,
  UnreadCounts,
} from "@/lib/admin-data";

const NOTIFICATION_COLUMNS =
  "id, kind, source_id, title, preview, created_at, read_at";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Returns the most recent notifications newest first, capped at `limit`.
 * Both read and unread are included so the bell dropdown can show
 * recent activity beyond just unread. Public render: bell list.
 */
export async function getRecentNotifications(
  limit = DEFAULT_LIMIT,
): Promise<Notification[]> {
  try {
    await requireAdminSession();
  } catch {
    return [];
  }
  const supabase = createServiceClient();
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)));
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error) return [];
  return (data ?? []) as Notification[];
}

/**
 * Unread totals split by kind plus a sum. Drives both the per-tab badges
 * (leads / conversations / calendar) and the bell-dot count. Two reads run
 * concurrently: the partial unread index makes both head-only counts cheap.
 */
export async function getUnreadCounts(): Promise<UnreadCounts> {
  try {
    await requireAdminSession();
  } catch {
    return { lead: 0, conversation: 0, appointment: 0, total: 0 };
  }
  const supabase = createServiceClient();
  // One scan, group by hand. Fewer round trips than three head queries and
  // the unread set is small enough that pulling kind columns is fine.
  const { data } = await supabase
    .from("notifications")
    .select("kind")
    .is("read_at", null);
  const rows = (data ?? []) as Array<{ kind: NotificationKind }>;
  const counts: UnreadCounts = {
    lead: 0,
    conversation: 0,
    appointment: 0,
    total: rows.length,
  };
  for (const row of rows) {
    if (row.kind === "lead") counts.lead += 1;
    else if (row.kind === "conversation") counts.conversation += 1;
    else if (row.kind === "appointment") counts.appointment += 1;
  }
  return counts;
}

/**
 * Stamp `read_at` on one notification. Idempotent: WHERE read_at IS NULL
 * guard means re-calling on an already-read row is a no-op (no row update,
 * no timestamp churn).
 */
export async function markRead(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: "Invalid notification id" };
  }
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .is("read_at", null);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Stamp `read_at` on every currently-unread notification. The partial
 * unread index keeps the predicate cheap; one UPDATE statement.
 */
export async function markAllRead(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Best-effort cleanup: deletes notifications that are read AND older than
 * 90 days. Cheap insurance against unbounded growth on a 2-user CRM where
 * we never plan to surface anything older than the recent-20 list anyway.
 *
 * Called opportunistically (bell open + admin page mount). Failure is
 * swallowed and reported through the return shape - cleanup never blocks
 * the caller's primary action.
 */
const NINETY_DAYS_MS = 90 * 86_400_000;

export async function deleteOldReadNotifications(): Promise<
  { ok: true; deleted: number } | { ok: false; error: string }
> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - NINETY_DAYS_MS).toISOString();
  const { error, count } = await supabase
    .from("notifications")
    .delete({ count: "exact" })
    .lt("read_at", cutoff)
    .not("read_at", "is", null);
  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: count ?? 0 };
}
