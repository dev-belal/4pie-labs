/**
 * Cal.com API v2 client. Server-only — must never be imported in client code.
 *
 * Auth: Bearer token via CAL_API_KEY env var.
 * Endpoints used:
 *   - GET  /v2/slots                (cal-api-version: 2024-09-04)
 *   - POST /v2/bookings             (cal-api-version: 2024-08-13)
 *
 * Docs: https://cal.com/docs/api-reference/v2/introduction
 */

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

export interface SlotsByDay {
  [yyyymmdd: string]: { start: string }[];
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

export interface BookingResult {
  id: number;
  uid: string;
  start: string;
  end: string;
  meetingUrl?: string;
  status: string;
}

/**
 * Create a booking on the configured event type.
 * Cal.com sends the calendar invite + confirmation email automatically.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingResult> {
  const body: Record<string, unknown> = {
    start: input.startISO,
    eventTypeId: eventTypeId(),
    attendee: {
      name: input.name,
      email: input.email,
      timeZone: input.timeZone,
      language: "en",
    },
  };

  // Optional fields — only sent when present so we don't override Cal defaults.
  if (input.notes) {
    body.bookingFieldsResponses = { notes: input.notes };
  }
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
