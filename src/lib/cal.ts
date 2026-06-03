/**
 * Cal.com API v2 client. Server-only - must never be imported in client code.
 *
 * Auth: Bearer token via CAL_API_KEY env var.
 * Endpoints used:
 *   - GET  /v2/slots                (cal-api-version: 2024-09-04)
 *   - POST /v2/bookings             (cal-api-version: 2024-08-13)
 *   - GET  /v2/bookings             (cal-api-version: 2024-08-13)
 *
 * The same Bearer token serves all three endpoints - no extra Cal.com
 * permission scope is needed for listing bookings beyond the standard API
 * key already provisioned for create/slots.
 *
 * Docs: https://cal.com/docs/api-reference/v2/introduction
 */

import type { BookingResult, SlotsByDay } from "@/lib/booking-types";

export type { BookingResult, SlotsByDay };

const CAL_BASE = "https://api.cal.com/v2";

function requireKey(): string {
  const key = process.env.CAL_API_KEY;
  if (!key) throw new Error("CAL_API_KEY env var is not set");
  return key;
}

function eventTypeId(): number {
  const id = Number(process.env.CAL_EVENT_TYPE_ID);
  if (!id) throw new Error("CAL_EVENT_TYPE_ID env var is not set");
  return id;
}

/**
 * Fetch every available slot in a date range, grouped by ISO date.
 * Cal.com returns slot start times in the timezone we request.
 */
export async function fetchSlots(
  startISO: string,
  endISO: string,
  timeZone: string,
): Promise<SlotsByDay> {
  const url = new URL(`${CAL_BASE}/slots`);
  url.searchParams.set("eventTypeId", String(eventTypeId()));
  url.searchParams.set("start", startISO);
  url.searchParams.set("end", endISO);
  url.searchParams.set("timeZone", timeZone);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${requireKey()}`,
      "cal-api-version": "2024-09-04",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Cal.com slots ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: SlotsByDay };
  return json.data ?? {};
}

export interface CreateBookingInput {
  startISO: string;
  name: string;
  email: string;
  timeZone: string;
  notes?: string;
  phone?: string;
}

/**
 * Create a booking on the configured event type.
 * Cal.com sends the calendar invite + confirmation email automatically.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingResult> {
  // Cal.com event types can have extra required booking fields beyond
  // name/email (our event type requires `title`). Always populate it so
  // the API doesn't reject the booking with
  //   "responses - {title}error_required_field".
  const bookingFieldsResponses: Record<string, string> = {
    title: `Discovery call with ${input.name}`,
  };
  if (input.notes) bookingFieldsResponses.notes = input.notes;

  const body: Record<string, unknown> = {
    start: input.startISO,
    eventTypeId: eventTypeId(),
    attendee: {
      name: input.name,
      email: input.email,
      timeZone: input.timeZone,
      language: "en",
    },
    bookingFieldsResponses,
  };

  if (input.phone) {
    body.metadata = { phone: input.phone };
  }

  const res = await fetch(`${CAL_BASE}/bookings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireKey()}`,
      "cal-api-version": "2024-08-13",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Cal.com booking ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data: BookingResult };
  return json.data;
}

/* ============================================================================
 * listBookings — populate the admin calendar mirror.
 *
 * Cal.com v2 paginates with take/skip (max take=100). We accept a date window
 * and a small set of useful filters, walk pages until we get a short page,
 * and normalize each result so the rest of the codebase doesn't depend on
 * the Cal payload shape.
 * ========================================================================== */

export interface ListBookingsOpts {
  /** Lower bound on booking start time, ISO. */
  afterStart?: string;
  /** Upper bound on booking start time, ISO. */
  beforeStart?: string;
  /** Cal.com booking statuses to include. Defaults to upcoming + past. */
  status?: Array<"upcoming" | "past" | "cancelled" | "unconfirmed">;
  /** Scope to a single attendee email (we usually don't filter here). */
  attendeeEmail?: string;
  /**
   * Safety cap on total pages walked. With take=100, default cap=10 = 1000
   * results. For a 90-day agency window this is wildly more than enough.
   */
  maxPages?: number;
}

export interface CalBookingListItem {
  id: number;
  uid: string;
  title: string;
  start: string;
  end: string;
  status: string; // Cal's status: "accepted" | "cancelled" | "rejected" | "pending"
  attendeeName: string | null;
  attendeeEmail: string | null;
  attendeeTimeZone: string | null;
  meetingUrl: string | null;
  location: string | null;
}

/**
 * Pull the first attendee with both name + email. Cal.com's payload nests
 * attendees in an array; for our 1-1 event types there is always exactly
 * one, but we defend against the empty case so the sync never throws.
 */
function pickAttendee(
  raw: { attendees?: unknown } | undefined,
): { name: string | null; email: string | null; timeZone: string | null } {
  const list = (raw?.attendees ?? []) as Array<{
    name?: unknown;
    email?: unknown;
    timeZone?: unknown;
  }>;
  for (const a of list) {
    if (typeof a?.email === "string") {
      return {
        name: typeof a.name === "string" ? a.name : null,
        email: a.email,
        timeZone: typeof a.timeZone === "string" ? a.timeZone : null,
      };
    }
  }
  return { name: null, email: null, timeZone: null };
}

function normalizeBooking(raw: Record<string, unknown>): CalBookingListItem | null {
  const id = typeof raw.id === "number" ? raw.id : null;
  const uid = typeof raw.uid === "string" ? raw.uid : null;
  const start = typeof raw.start === "string" ? raw.start : null;
  const end = typeof raw.end === "string" ? raw.end : null;
  if (!start || !end || (id == null && !uid)) {
    return null;
  }
  const at = pickAttendee(raw as { attendees?: unknown });
  const meetingUrl = typeof raw.meetingUrl === "string" ? raw.meetingUrl : null;
  const location = typeof raw.location === "string" ? raw.location : null;
  const title = typeof raw.title === "string" ? raw.title : "";
  const status = typeof raw.status === "string" ? raw.status : "accepted";
  return {
    id: id ?? -1,
    uid: uid ?? "",
    title,
    start,
    end,
    status,
    attendeeName: at.name,
    attendeeEmail: at.email,
    attendeeTimeZone: at.timeZone,
    meetingUrl,
    location,
  };
}

export async function listBookings(
  opts: ListBookingsOpts = {},
): Promise<CalBookingListItem[]> {
  const key = requireKey();
  const take = 100; // Cal.com hard cap
  const maxPages = opts.maxPages ?? 10;
  const results: CalBookingListItem[] = [];

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`${CAL_BASE}/bookings`);
    url.searchParams.set("take", String(take));
    url.searchParams.set("skip", String(page * take));
    if (opts.afterStart) url.searchParams.set("afterStart", opts.afterStart);
    if (opts.beforeStart) url.searchParams.set("beforeStart", opts.beforeStart);
    if (opts.attendeeEmail)
      url.searchParams.set("attendeeEmail", opts.attendeeEmail);
    if (opts.status && opts.status.length > 0) {
      // Cal.com expects repeated `status` params for a multi-value filter.
      for (const s of opts.status) url.searchParams.append("status", s);
    } else {
      url.searchParams.append("status", "upcoming");
      url.searchParams.append("status", "past");
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${key}`,
        "cal-api-version": "2024-08-13",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Cal.com listBookings ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as { data?: unknown };
    const list = Array.isArray(json.data) ? json.data : [];
    for (const row of list) {
      const norm = normalizeBooking(row as Record<string, unknown>);
      if (norm) results.push(norm);
    }
    // Short page means we've drained the cursor.
    if (list.length < take) break;
  }

  return results;
}
