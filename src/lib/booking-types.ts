import type { BookingResult } from "@/lib/cal";

export type BookingState =
  | { status: "idle" }
  | { status: "success"; booking: BookingResult }
  | { status: "error"; message: string; errors?: Record<string, string[]> };

export const bookingInitial: BookingState = { status: "idle" };
