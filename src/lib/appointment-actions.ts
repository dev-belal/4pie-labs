"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin-session";
import { listBookings, type CalBookingListItem } from "@/lib/cal";
import { uuidSchema } from "@/lib/schemas";
import type { AppointmentStatus } from "@/lib/admin-data";

/**
 * Server actions for the admin calendar (Phase 5).
 *
 * - syncAppointmentsFromCal: reconcile our local mirror with Cal.com for a
 *   ~90-day window. Adds new bookings; updates status on existing rows when
 *   Cal flips them to cancelled / rejected.
 * - updateAppointmentNotes, setAppointmentCategory: admin-private edits that
 *   never leave our DB.
 *
 * All actions are gated by readAdminSession() and use the service-role
 * client. None are reachable from the public site.
 */

type Err = { ok: false; error: string };
type Plain = { ok: true } | Err;
type WithPayload<T> = ({ ok: true } & T) | Err;

async function adminClient() {
  await requireAdminSession();
  return createServiceClient();
}

function authError(): Err {
  return { ok: false, error: "You must be signed in." };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function channelFor(item: CalBookingListItem): string {
  const url = item.meetingUrl ?? "";
  if (/meet\.google\.com/i.test(url)) return "Google Meet";
  if (/zoom\.us/i.test(url)) return "Zoom";
  if (/teams\.microsoft/i.test(url)) return "MS Teams";
  const loc = item.location ?? "";
  if (/google[_\s-]?meet/i.test(loc)) return "Google Meet";
  if (/zoom/i.test(loc)) return "Zoom";
  if (/teams/i.test(loc)) return "MS Teams";
  if (/phone/i.test(loc)) return "Phone";
  return url ? "Video call" : loc || "Video call";
}

/**
 * Cal.com booking statuses: "accepted" | "pending" | "cancelled" |
 * "rejected". Map both terminal failure cases onto our 'cancelled' bucket;
 * accepted/pending land as 'confirmed'.
 */
function appointmentStatusFor(calStatus: string): AppointmentStatus {
  const s = calStatus.toLowerCase();
  if (s === "cancelled" || s === "rejected") return "cancelled";
  return "confirmed";
}

/* ------------------------------------------------------------------ */
/*  Sync from Cal.com                                                 */
/* ------------------------------------------------------------------ */

/**
 * Pull a ~90-day window from Cal.com (45 days back to 45 days forward) and
 * reconcile against our local appointments table. Deduped on cal_booking_id
 * (preferred) and falls back to cal_uid when the numeric id is unavailable.
 *
 * Returns counts so the admin can see at a glance what changed.
 */
export async function syncAppointmentsFromCal(): Promise<
  WithPayload<{ added: number; updated: number; total: number }>
> {
  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  // Pull a 90-day window centered on today. Wide enough to backfill a fresh
  // install AND catch reschedules of recently-past bookings.
  const now = new Date();
  const afterStart = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
    .toISOString();
  const beforeStart = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)
    .toISOString();

  let bookings: CalBookingListItem[];
  try {
    bookings = await listBookings({
      afterStart,
      beforeStart,
      status: ["upcoming", "past", "cancelled"],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cal.com fetch failed";
    return { ok: false, error: msg };
  }

  if (bookings.length === 0) {
    return { ok: true, added: 0, updated: 0, total: 0 };
  }

  // Build lookup of EXISTING local rows by both cal id and uid.
  const numericIds = bookings.map((b) => b.id).filter((n) => n > 0);
  const uids = bookings.map((b) => b.uid).filter((u) => u.length > 0);

  const existingById = new Map<number, { id: string; status: AppointmentStatus }>();
  const existingByUid = new Map<string, { id: string; status: AppointmentStatus }>();

  if (numericIds.length > 0) {
    const { data } = await supabase
      .from("appointments")
      .select("id, cal_booking_id, status")
      .in("cal_booking_id", numericIds);
    for (const row of (data ?? []) as Array<{
      id: string;
      cal_booking_id: number;
      status: AppointmentStatus;
    }>) {
      existingById.set(row.cal_booking_id, { id: row.id, status: row.status });
    }
  }
  if (uids.length > 0) {
    const { data } = await supabase
      .from("appointments")
      .select("id, cal_uid, status")
      .in("cal_uid", uids);
    for (const row of (data ?? []) as Array<{
      id: string;
      cal_uid: string;
      status: AppointmentStatus;
    }>) {
      existingByUid.set(row.cal_uid, { id: row.id, status: row.status });
    }
  }

  let added = 0;
  let updated = 0;

  for (const b of bookings) {
    const localStatus = appointmentStatusFor(b.status);
    const existing =
      (b.id > 0 && existingById.get(b.id)) ||
      (b.uid && existingByUid.get(b.uid)) ||
      null;

    if (existing) {
      // Reconcile authoritative fields from Cal — start/end can change when
      // a booking is rescheduled. Local-only fields (notes, category) stay.
      if (
        existing.status !== localStatus ||
        true /* always refresh start/end + channel */
      ) {
        const { error } = await supabase
          .from("appointments")
          .update({
            starts_at: b.start,
            ends_at: b.end,
            attendee_name: b.attendeeName,
            attendee_email: b.attendeeEmail,
            attendee_tz: b.attendeeTimeZone,
            channel: channelFor(b),
            status: localStatus,
            title: b.title || null,
          })
          .eq("id", existing.id);
        if (!error) updated++;
      }
      continue;
    }

    const { error } = await supabase.from("appointments").insert({
      cal_booking_id: b.id > 0 ? b.id : null,
      cal_uid: b.uid || null,
      title: b.title || null,
      attendee_name: b.attendeeName,
      attendee_email: b.attendeeEmail,
      attendee_tz: b.attendeeTimeZone,
      channel: channelFor(b),
      starts_at: b.start,
      ends_at: b.end,
      status: localStatus,
    });
    if (!error) added++;
    // A concurrent duplicate (23505) is fine — the row exists, move on.
    if (error && error.code !== "23505") {
      console.error("[sync] insert failed:", error);
    }
  }

  revalidatePath("/admin");
  return { ok: true, added, updated, total: bookings.length };
}

/* ------------------------------------------------------------------ */
/*  Local edits                                                       */
/* ------------------------------------------------------------------ */

export async function updateAppointmentNotes(
  id: string,
  notes: string,
): Promise<Plain> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid appointment id" };
  if (notes.length > 4000) {
    return { ok: false, error: "Notes too long" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { error } = await supabase
    .from("appointments")
    .update({ notes: notes || null })
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function setAppointmentCategory(
  id: string,
  category: string | null,
): Promise<Plain> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid appointment id" };
  if (category != null && category.length > 60) {
    return { ok: false, error: "Category label too long" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { error } = await supabase
    .from("appointments")
    .update({ category: category || null })
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
