"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/schemas";
import { createBooking, fetchSlots } from "@/lib/cal";
import { createServiceClient } from "@/lib/supabase/service";
import type { BookingState, SlotsByDay } from "@/lib/booking-types";
import type { BookingResult } from "@/lib/booking-types";
import type { BookingInput } from "@/lib/schemas";

/**
 * Map Cal.com's `location` string ("integrations:google_meet", a URL, "Phone"
 * etc.) to a human-friendly channel for the admin calendar. Best-effort —
 * unknown values pass through verbatim.
 */
function channelFromLocation(
  meetingUrl: string | undefined,
  location: string | undefined | null,
): string {
  if (meetingUrl && /meet\.google\.com/i.test(meetingUrl)) return "Google Meet";
  if (meetingUrl && /zoom\.us/i.test(meetingUrl)) return "Zoom";
  if (meetingUrl && /teams\.microsoft/i.test(meetingUrl)) return "MS Teams";
  if (location && /google[_\s-]?meet/i.test(location)) return "Google Meet";
  if (location && /zoom/i.test(location)) return "Zoom";
  if (location && /teams/i.test(location)) return "MS Teams";
  if (location && /phone/i.test(location)) return "Phone";
  return meetingUrl ? "Video call" : location ?? "Video call";
}

/**
 * Persist a freshly-created Cal.com booking to our local appointments table.
 * MUST NEVER throw or block the public /book flow — every failure path is
 * swallowed with a console.error. Wrapped by `after()` upstream so the
 * visitor's success response is already on the wire by the time this runs.
 */
async function mirrorBookingToAppointments(
  input: BookingInput,
  booking: BookingResult,
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const channel = channelFromLocation(booking.meetingUrl, null);
    const { error } = await supabase.from("appointments").insert({
      cal_booking_id: booking.id,
      cal_uid: booking.uid,
      title: `Call with ${input.name}`,
      attendee_name: input.name,
      attendee_email: input.email,
      attendee_tz: input.timeZone,
      channel,
      starts_at: booking.start,
      ends_at: booking.end,
      status: "confirmed",
    });
    if (error) {
      // Unique-constraint violations on (cal_booking_id) are expected if the
      // sync job races us — that's a no-op, not a bug.
      if (error.code === "23505") return;
      console.error("[appointments mirror] insert failed:", error);
    }
  } catch (err) {
    console.error("[appointments mirror] threw:", err);
  }
}

/**
 * Fetch available slots for a calendar month, scoped to the visitor's
 * timezone. Cached briefly server-side via in-memory rate limit (20/min/IP)
 * to absorb the calendar's day-hover thrash without hammering Cal.com.
 */
export async function getMonthSlots(
  year: number,
  month: number, // 1-12
  timeZone: string,
): Promise<{ ok: true; slots: SlotsByDay } | { ok: false; error: string }> {
  const h = await headers();
  const ip = clientIp(h);
  const rl = rateLimit(`cal-slots:${ip}`, 30, 60_000);
  if (!rl.allowed) return { ok: false, error: "Rate limited" };

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { ok: false, error: "Invalid year" };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, error: "Invalid month" };
  }

  // Use UTC bounds so we cover the whole month regardless of local TZ.
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  try {
    const slots = await fetchSlots(start.toISOString(), end.toISOString(), timeZone);
    return { ok: true, slots };
  } catch (err) {
    console.error("Cal.com slots error:", err);
    return { ok: false, error: "Couldn't load availability - try again." };
  }
}

export async function bookSlot(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const h = await headers();
  const ip = clientIp(h);
  const rl = rateLimit(`cal-book:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Too many booking attempts. Wait a minute and try again.",
    };
  }

  const parsed = bookingSchema.safeParse({
    startISO: formData.get("startISO"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: (formData.get("phone") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
    timeZone: formData.get("timeZone"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const booking = await createBooking(parsed.data);
    // Mirror the booking to our local admin calendar AFTER the response goes
    // out. after() schedules the work for the post-response phase, and the
    // helper swallows every error — public /book flow is fire-and-forget
    // protected, same pattern as the n8n + Resend post-submit work.
    after(async () => {
      await mirrorBookingToAppointments(parsed.data, booking);
    });
    return { status: "success", booking };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Cal.com booking error:", msg);

    // Conflict / slot-taken - broad net because Cal.com wording varies.
    if (
      /no\s+longer\s+available|already\s+booked|conflict|slot.*(?:taken|busy|unavailable|gone)|time.*(?:taken|busy|unavailable)|not\s+available/i.test(
        msg,
      )
    ) {
      return {
        status: "error",
        code: "slot_taken",
        message:
          "That slot was just taken - I've refreshed the times, please pick another.",
      };
    }

    // Cal.com minimum-notice / buffer rules rejecting.
    if (/too\s+late|minimum\s+notice|buffer|cutoff|past|advance/i.test(msg)) {
      return {
        status: "error",
        code: "too_late",
        message:
          "This time doesn't meet the booking window. Please pick a later slot.",
      };
    }

    // Try to pull a human-readable message out of Cal's response body,
    // which looks like `Cal.com booking 400: {"status":"error","message":"…"}`.
    const humanMsg = extractCalMessage(msg);
    return {
      status: "error",
      message:
        humanMsg ?? "Couldn't confirm the booking - please try again.",
    };
  }
}

function extractCalMessage(msg: string): string | null {
  const match = msg.match(/\{[^]*\}/); // greedy body after "Cal.com booking …:"
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message.length < 200) {
      return parsed.message;
    }
  } catch {
    /* ignore */
  }
  return null;
}
