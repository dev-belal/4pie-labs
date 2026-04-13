"use client";

import { useActionState, useState } from "react";
import { DayPicker } from "react-day-picker";
import { bookSlot } from "@/lib/booking-actions";
import { bookingInitial } from "@/lib/booking-types";

/**
 * Bisection probe — step 3.
 * react-day-picker confirmed fine. Now bring back useActionState with
 * the bookSlot server action to test whether the server-action
 * serialization layer is what crashes on Vercel SSR.
 */
export function BookingFlowProbe() {
  const [selected, setSelected] = useState<Date | undefined>();
  const [state] = useActionState(bookSlot, bookingInitial);

  return (
    <div className="max-w-xl mx-auto px-4">
      <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4 text-center">
        Booking probe · step 3
      </h1>
      <p className="text-white/60 text-center mb-2">
        react-day-picker + useActionState(bookSlot)
      </p>
      <p className="text-xs text-white/30 text-center mb-10">
        action state: {state.status}
      </p>

      <div className="glass-morphism rounded-[32px] border-white/10 p-6 md:p-10 flex justify-center">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={setSelected}
          classNames={{
            day: "rounded-xl w-10 h-10 text-sm transition-colors",
          }}
        />
      </div>

      {selected && (
        <p className="mt-6 text-center text-white/70">
          You picked{" "}
          <span className="text-primary font-bold">
            {selected.toDateString()}
          </span>
        </p>
      )}
    </div>
  );
}
