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

export type BookingErrorCode = "slot_taken" | "too_late";

export type BookingState =
  | { status: "idle" }
  | { status: "success"; booking: BookingResult }
  | {
      status: "error";
      message: string;
      errors?: Record<string, string[]>;
      /** Machine-readable classifier so the UI can recover differently
       *  for e.g. slot-taken (refresh + back to time step) vs validation. */
      code?: BookingErrorCode;
    };

export const bookingInitial: BookingState = { status: "idle" };
