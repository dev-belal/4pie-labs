"use server";

import { headers } from "next/headers";
import { clientIp } from "@/lib/n8n";
import { rateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/schemas";
import {
  createBooking,
  fetchSlots,
  type BookingResult,
  type SlotsByDay,
} from "@/lib/cal";

import type { BookingState } from "@/lib/booking-types";
export type { BookingState };

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
    if (/no longer available|conflict|busy|full/i.test(msg)) {
      return {
        status: "error",
        message: "That slot was just taken — please pick another.",
      };
    }
    return {
      status: "error",
      message: "Couldn't confirm the booking — please try again.",
    };
  }
}
