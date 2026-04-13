"use server";

import { headers } from "next/headers";
import { clientIp } from "@/lib/n8n";
import { rateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/schemas";
import { createBooking, fetchSlots } from "@/lib/cal";
import type { BookingState, SlotsByDay } from "@/lib/booking-types";

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
    return { ok: false, error: "Couldn't load availability — try again." };
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
    return { status: "success", booking };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Cal.com booking error:", msg);

    // Conflict / slot-taken — broad net because Cal.com wording varies.
    if (
      /no\s+longer\s+available|already\s+booked|conflict|slot.*(?:taken|busy|unavailable|gone)|time.*(?:taken|busy|unavailable)|not\s+available/i.test(
        msg,
      )
    ) {
      return {
        status: "error",
        code: "slot_taken",
        message:
          "That slot was just taken — I've refreshed the times, please pick another.",
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
        humanMsg ?? "Couldn't confirm the booking — please try again.",
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
