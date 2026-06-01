"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { DayPicker } from "react-day-picker";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  User,
  Video,
} from "lucide-react";
import { bookSlot, getMonthSlots } from "@/lib/booking-actions";
import { bookingInitial, type SlotsByDay } from "@/lib/booking-types";

type Step = "date" | "time" | "details" | "success";

function ymdKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

function formatLongDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatLongDateTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(iso));
}

/** How often we silently re-fetch availability while the booking UI is
 *  open, to keep the calendar / time grid fresh as new bookings land. */
const BACKGROUND_REFRESH_MS = 45_000;

/** Briefly block the "submit" button on the details step right after
 *  landing there, to absorb double-clicks coming from the time grid. */
const SUBMIT_UNLOCK_DELAY_MS = 450;

export function BookingFlow() {
  const [step, setStep] = useState<Step>("date");
  const [timeZone, setTimeZone] = useState("UTC");
  const [month, setMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [slotsByDay, setSlotsByDay] = useState<SlotsByDay>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>();
  const [submitUnlocked, setSubmitUnlocked] = useState(false);
  const [, startTransition] = useTransition();

  const [state, formAction, pending] = useActionState(bookSlot, bookingInitial);

  /** Latest month/tz captured in a ref so the interval/focus handlers
   *  always refetch the *current* visible month without re-binding the
   *  listener on every state change. */
  const currentRef = useRef({ year: 0, monthNum: 0, timeZone: "UTC" });
  // Sync at commit time, not during render: the interval / focus / visibility
  // handlers read this ref asynchronously and need the latest *committed*
  // month/tz. Writing a ref during render is unsafe under concurrent rendering
  // (this component uses startTransition), so the update lives in an effect.
  useEffect(() => {
    currentRef.current = {
      year: month.getFullYear(),
      monthNum: month.getMonth() + 1,
      timeZone,
    };
  }, [month, timeZone]);

  const refreshSlots = useCallback(
    async (opts: { quiet?: boolean } = {}) => {
      const { year, monthNum, timeZone: tz } = currentRef.current;
      if (!tz || tz === "UTC") return;
      if (!opts.quiet) {
        setLoading(true);
        setLoadError(null);
      }
      const res = await getMonthSlots(year, monthNum, tz);
      if (res.ok) {
        setSlotsByDay(res.slots);
        if (!opts.quiet) setLoadError(null);
      } else if (!opts.quiet) {
        setLoadError(res.error);
      }
      if (!opts.quiet) setLoading(false);
    },
    [],
  );

  // Resolve visitor timezone after mount (Intl is browser-only).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-mount read of the browser-only IANA timezone; SSR default stays "UTC" until hydration.
    setTimeZone(detectTimeZone());
  }, []);

  // Fetch slots whenever the visible month or timezone changes (loud fetch).
  useEffect(() => {
    if (!timeZone || timeZone === "UTC") return;
    let cancelled = false;
    startTransition(async () => {
      setLoading(true);
      setLoadError(null);
      const res = await getMonthSlots(
        month.getFullYear(),
        month.getMonth() + 1,
        timeZone,
      );
      if (cancelled) return;
      if (res.ok) setSlotsByDay(res.slots);
      else setLoadError(res.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [month, timeZone]);

  // Background auto-refresh + refresh on tab focus, only while the visitor
  // is still picking (date/time steps). Prevents stale slots from leading
  // to a "just taken" error at submit time.
  useEffect(() => {
    if (step !== "date" && step !== "time") return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshSlots({ quiet: true });
      }
    }, BACKGROUND_REFRESH_MS);

    const onFocus = () => void refreshSlots({ quiet: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshSlots({ quiet: true });
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [step, refreshSlots]);

  // Move to success step on a successful booking; on a slot-taken
  // conflict, refresh + kick back to the time step + clear the selection.
  /* eslint-disable react-hooks/set-state-in-effect --
     Navigates booking steps in response to the server-action result (`state`);
     fires only on a completed booking attempt, not on every render. */
  useEffect(() => {
    if (state.status === "success") {
      setStep("success");
      return;
    }
    if (state.status === "error" && state.code === "slot_taken") {
      setSelectedSlot(undefined);
      setStep(selectedDay ? "time" : "date");
      void refreshSlots();
    }
  }, [state, selectedDay, refreshSlots]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Brief submit lockout when entering the details step to prevent a
  // stray Enter / double-click from firing before the user sees the form.
  useEffect(() => {
    if (step !== "details") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the submit lockout when leaving the details step; deliberate UI sync to `step`, paired with the timed unlock below.
      setSubmitUnlocked(false);
      return;
    }
    const t = window.setTimeout(
      () => setSubmitUnlocked(true),
      SUBMIT_UNLOCK_DELAY_MS,
    );
    return () => window.clearTimeout(t);
  }, [step]);

  // If a background refresh wipes out the currently-picked slot (someone
  // else booked it while the visitor was on the details page), bounce
  // them back to the time grid instead of letting them submit a dead slot.
  /* eslint-disable react-hooks/set-state-in-effect --
     Bounces the visitor back to the time grid if their picked slot disappears
     on a background refresh; responds to external slot data, not every render. */
  useEffect(() => {
    if (step !== "details" || !selectedSlot || !selectedDay) return;
    const stillAvailable = (slotsByDay[ymdKey(selectedDay)] ?? []).some(
      (s) => s.start === selectedSlot,
    );
    if (!stillAvailable) {
      setSelectedSlot(undefined);
      setStep("time");
    }
  }, [slotsByDay, selectedSlot, selectedDay, step]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const availableDays = useMemo(() => {
    return Object.keys(slotsByDay)
      .filter((k) => (slotsByDay[k]?.length ?? 0) > 0)
      .map((k) => {
        const [y, m, d] = k.split("-").map(Number);
        return new Date(y, m - 1, d);
      });
  }, [slotsByDay]);

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return slotsByDay[ymdKey(selectedDay)] ?? [];
  }, [selectedDay, slotsByDay]);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-primary tracking-widest uppercase mb-6">
          <CalendarIcon className="w-3 h-3 text-primary" />
          30 Minute Discovery Call
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 [text-wrap:balance]">
          Book a strategy session.
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Pick a date and time that works for you. We&apos;ll send the calendar
          invite + Google Meet link automatically.
        </p>
      </header>

      <Stepper step={step} />

      {step === "date" && (
        <div className="bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] p-6 md:p-10">
          {/* Mobile-only timezone hint - desktop puts it at the bottom of
              the left column instead. */}
          <div className="md:hidden flex items-center gap-2 text-xs text-subtle-foreground mb-6">
            <Clock className="w-3.5 h-3.5" />
            All times shown in {timeZone}
          </div>

          <div className="md:grid md:grid-cols-[1fr_auto] md:gap-12 md:items-stretch">
            {/* Desktop info column - brand mark, dialogue, bullets, timezone */}
            <div className="hidden md:flex md:flex-col">
              {/* Typographic brand mark - avoids the data-logo filter that
                  rendered the PNG ghosted on dark bg. Always crisp because
                  it's tokens + Inter, not a raster image. */}
              <div className="inline-flex items-center gap-2.5 mb-7 w-fit">
                <span className="w-9 h-9 rounded-xl bg-primary-muted grid place-items-center shrink-0">
                  <span className="text-primary font-bold text-sm leading-none tracking-tight">
                    4P
                  </span>
                </span>
                <span className="text-base font-semibold tracking-tight text-foreground">
                  4Pie Labs
                </span>
              </div>

              <h2 className="text-xl font-semibold tracking-tight text-foreground mb-2">
                What we&apos;ll cover
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-5">
                30 minutes, no pitch deck. We walk through your market, the
                gaps your competitors are filling, and the AEO + ads plan
                that gets you the next customer.
              </p>

              <ul className="space-y-2.5 max-w-sm">
                {[
                  "Your top buyer queries vs. the Maps pack",
                  "AEO citations across ChatGPT, Perplexity, Gemini",
                  "Ad coverage + conversion path",
                  "A concrete next-step plan, free",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="text-foreground/90 leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8 flex items-center gap-2 text-xs text-subtle-foreground">
                <Clock className="w-3.5 h-3.5" />
                All times shown in {timeZone}
              </div>
            </div>

            {/* Calendar - desktop: pinned right, full-size. Mobile: centered. */}
            <div className="md:justify-self-end">
              {loadError ? (
                <div className="text-error text-sm py-12 text-center">
                  {loadError}
                </div>
              ) : (
                <div className="flex justify-center md:justify-end">
                  <DayPicker
                    mode="single"
                    month={month}
                    onMonthChange={setMonth}
                    selected={selectedDay}
                    onSelect={(day) => {
                      if (!day) return;
                      const key = ymdKey(day);
                      if ((slotsByDay[key]?.length ?? 0) === 0) return;
                      setSelectedDay(day);
                      setSelectedSlot(undefined);
                      setStep("time");
                    }}
                    modifiers={
                      availableDays.length > 0
                        ? { available: availableDays }
                        : undefined
                    }
                    modifiersClassNames={{
                      available: "font-bold text-primary",
                      selected: "bg-primary text-on-primary",
                    }}
                    disabled={{ before: new Date() }}
                    classNames={{
                      day: "rounded-xl w-10 h-10 text-sm transition-colors",
                    }}
                  />
                </div>
              )}
              {loading && (
                <div className="flex items-center justify-center gap-2 text-subtle-foreground text-xs mt-4">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading availability…
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "time" && selectedDay && (
        <div className="bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] p-6 md:p-10">
          <button
            type="button"
            onClick={() => setStep("date")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to calendar
          </button>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">
            {formatLongDate(selectedDay)}
          </h2>
          <p className="text-xs text-subtle-foreground mb-8">
            All times shown in {timeZone}
          </p>

          {state.status === "error" && state.code === "slot_taken" && (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 px-4 py-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm"
            >
              {state.message}
            </div>
          )}

          {slotsForSelectedDay.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No availability on this day. Pick another.
              </p>
              <button
                type="button"
                onClick={() => setStep("date")}
                className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                Back to calendar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {slotsForSelectedDay.map((slot) => {
                const isSelected = slot.start === selectedSlot;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot.start);
                      setStep("details");
                    }}
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all border ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary shadow-[var(--shadow-cta)]"
                        : "bg-surface-2 border-card-border text-foreground hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    {formatTime(slot.start, timeZone)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "details" && selectedSlot && (
        <form
          action={formAction}
          className="bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] p-6 md:p-10 space-y-6"
        >
          <button
            type="button"
            onClick={() => setStep("time")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change time
          </button>

          <div className="rounded-xl bg-primary-muted border border-primary/30 px-5 py-4 flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">
                {formatLongDateTime(selectedSlot, timeZone)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                30 minutes · Google Meet · We&apos;ll email the invite
              </div>
            </div>
          </div>

          {/* Hidden fields submitted to the action */}
          <input type="hidden" name="startISO" value={selectedSlot} />
          <input type="hidden" name="timeZone" value={timeZone} />

          <div className="space-y-2">
            <label
              htmlFor="bk-name"
              className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-primary" />
              Full Name
            </label>
            <input
              id="bk-name"
              name="name"
              type="text"
              required
              placeholder="John Doe"
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {state.status === "error" && state.errors?.name && (
              <p className="text-xs text-error ml-1">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="bk-email"
                className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5 text-primary" />
                Email
              </label>
              <input
                id="bk-email"
                name="email"
                type="email"
                required
                placeholder="john@example.com"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {state.status === "error" && state.errors?.email && (
                <p className="text-xs text-error ml-1">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="bk-phone"
                className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-primary" />
                Phone <span className="text-subtle-foreground">(optional)</span>
              </label>
              <input
                id="bk-phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="bk-notes"
              className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              What do you want to discuss?{" "}
              <span className="text-subtle-foreground">(optional)</span>
            </label>
            <textarea
              id="bk-notes"
              name="notes"
              rows={3}
              placeholder="Tell us a bit about your project so we come prepared…"
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {state.status === "error" && state.message && (
            <p
              aria-live="polite"
              className="text-sm text-error text-center"
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !submitUnlocked}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-2xl text-base font-semibold hover:scale-[1.01] active:scale-95 transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming…
              </>
            ) : (
              <>
                Confirm Booking
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {step === "success" && state.status === "success" && (
        <div className="bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] p-10 md:p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-success/15 grid place-items-center">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 text-foreground">
            You&apos;re booked.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            We&apos;ve sent a calendar invite + Google Meet link to your email.
            See you on{" "}
            <span className="text-foreground font-semibold">
              {formatLongDateTime(state.booking.start, timeZone)}
            </span>
            .
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-subtle-foreground">
            <Video className="w-3.5 h-3.5" />
            Meeting link arrives via email
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "date", label: "Date" },
    { id: "time", label: "Time" },
    { id: "details", label: "Details" },
  ];
  const activeIdx =
    step === "success" ? 3 : steps.findIndex((s) => s.id === step);

  return (
    <ol className="flex items-center justify-center gap-3 mb-8 text-[10px] font-bold uppercase tracking-widest">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <li key={s.id} className="flex items-center gap-3">
            <span
              className={`flex items-center gap-2 ${
                active
                  ? "text-primary"
                  : done
                    ? "text-muted-foreground"
                    : "text-subtle-foreground"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] ${
                  active
                    ? "border-primary bg-primary-muted"
                    : done
                      ? "border-success/40 bg-success/15 text-success"
                      : "border-card-border"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="w-6 h-px bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
