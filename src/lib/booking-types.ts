/**
 * Pure types shared between server actions and client components.
 * Never imports from `@/lib/cal` so client components stay fully isolated
 * from the server-only Cal.com client.
 */

export interface SlotsByDay {
  [yyyymmdd: string]: { start: string }[];
}

export interface BookingResult {
  id: number;
  uid: string;
  start: string;
  end: string;
  meetingUrl?: string;
  status: string;
}

export type BookingState =
  | { status: "idle" }
  | { status: "success"; booking: BookingResult }
  | { status: "error"; message: string; errors?: Record<string, string[]> };

export const bookingInitial: BookingState = { status: "idle" };
