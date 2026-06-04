"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NotificationKind } from "@/lib/admin-data";

/**
 * Postgres-changes payload SHAPE we expect on the realtime channel.
 *
 * Whether these fields actually arrive depends on RLS:
 *   - notifications table has RLS enabled and ZERO policies (admin-only,
 *     service-role bypass). The anon Realtime channel cannot SELECT, so
 *     Supabase Realtime filters the row out of the broadcast: `new` lands
 *     as an empty object or null.
 *   - If a future policy allows the anon channel to read notifications,
 *     `new` would carry the full row and the toast path uses it directly.
 *
 * Either way the caller defends against both shapes: if `id`/`title` are
 * present, use them; otherwise call back to the server via a service-role
 * action to fetch the row.
 */
export interface NotificationPayload {
  id?: string;
  kind?: NotificationKind;
  source_id?: string;
  title?: string;
  preview?: string | null;
  created_at?: string;
  read_at?: string | null;
}

/**
 * Subscribes the calling client to INSERT events on `public.notifications`.
 * Invokes `onNew` on every event; the payload may or may not carry the row
 * content (see the type comment above for the RLS interaction).
 *
 * Channel name is fixed so multiple AdminShell mounts (two admins online)
 * share the same channel id without colliding. Supabase Realtime supports
 * multiple subscribers on the same channel - each gets the event.
 *
 * Cleanup removes the channel from the supabase client on unmount.
 */
export function useNotificationStream(
  onNew: (payload: NotificationPayload | null) => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const channel = supabase
      .channel("admin-notifications")
      .on(
        // The Supabase v2 SDK types the event union loosely; this string
        // matches the runtime contract.
        "postgres_changes" as unknown as never,
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: { new?: NotificationPayload }) => {
          const fresh = payload?.new ?? null;
          // Treat an empty object the same as null (RLS-stripped payload).
          if (fresh && Object.keys(fresh).length === 0) {
            onNew(null);
          } else {
            onNew(fresh);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onNew, enabled]);
}
