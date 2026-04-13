"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";

/**
 * Bisection probe. Everything that WAS in BookingFlow minus:
 *   - useActionState / server actions (suspect #1)
 *   - useEffect + fetch (the getMonthSlots call)
 *   - framer-motion / lucide / date-fns
 *
 * Just react-day-picker + two useStates. If this renders on Vercel,
 * the crash is in the server-action wiring. If it still 500s,
 * react-day-picker itself is the culprit on Vercel.
 */
export function BookingFlowProbe() {
  const [selected, setSelected] = useState<Date | undefined>();

  return (
    <div className="max-w-xl mx-auto px-4">
      <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4 text-center">
        Booking probe
      </h1>
      <p className="text-white/60 text-center mb-10">
        react-day-picker isolated — no server actions, no fetch.
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
