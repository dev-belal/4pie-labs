"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { DayPicker } from "react-day-picker";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  User,
  Video,
} from "lucide-react";
import {
  bookingInitial,
  bookSlot,
  getMonthSlots,
} from "@/lib/booking-actions";
import type { SlotsByDay } from "@/lib/cal";
import "react-day-picker/style.css";

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
  const [, startTransition] = useTransition();

  const [state, formAction, pending] = useActionState(bookSlot, bookingInitial);

  // Resolve visitor timezone after mount (Intl is browser-only).
  useEffect(() => {
    setTimeZone(detectTimeZone());
  }, []);

  // Fetch slots whenever the visible month or timezone changes.
  useEffect(() => {
    if (!timeZone || timeZone === "UTC") return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    startTransition(async () => {
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

  // Move to success step + reset selection on a successful booking.
  useEffect(() => {
    if (state.status === "success") setStep("success");
  }, [state.status]);

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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-morphism border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase text-white/70 mb-6">
          <CalendarIcon className="w-3 h-3 text-primary" />
          30 Minute Discovery Call
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4 [text-wrap:balance]">
          Book a strategy session.
        </h1>
        <p className="text-white/50 max-w-xl mx-auto">
          Pick a date and time that works for you. We&apos;ll send the calendar
          invite + Google Meet link automatically.
        </p>
      </header>

      <Stepper step={step} />

      {step === "date" && (
        <div className="glass-morphism rounded-[32px] border-white/10 p-6 md:p-10">
          <div className="flex items-center gap-2 text-xs text-white/40 mb-6">
            <Clock className="w-3.5 h-3.5" />
            All times shown in {timeZone}
          </div>
          {loadError ? (
            <div className="text-red-400 text-sm py-12 text-center">
              {loadError}
            </div>
          ) : (
            <div className="flex justify-center">
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
                modifiers={{ available: availableDays }}
                modifiersClassNames={{
                  available:
                    "!font-bold !text-primary aria-[selected=false]:bg-primary/5 hover:!bg-primary/15",
                  selected: "!bg-primary !text-white",
                  today: "!underline",
                }}
                disabled={[
                  { before: new Date() },
                  (day) => (slotsByDay[ymdKey(day)]?.length ?? 0) === 0,
                ]}
                classNames={{
                  caption_label: "font-display font-semibold text-lg",
                  nav_button:
                    "p-2 rounded-full hover:bg-white/5 transition-colors",
                  head_cell:
                    "text-[10px] font-bold uppercase tracking-widest text-white/30",
                  day: "rounded-xl w-10 h-10 text-sm transition-colors text-white/30 cursor-not-allowed",
                  day_disabled: "opacity-30",
                }}
              />
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs mt-4">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading availability…
            </div>
          )}
        </div>
      )}

      {step === "time" && selectedDay && (
        <div className="glass-morphism rounded-[32px] border-white/10 p-6 md:p-10">
          <button
            type="button"
            onClick={() => setStep("date")}
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to calendar
          </button>
          <h2 className="text-2xl font-display font-semibold mb-1">
            {formatLongDate(selectedDay)}
          </h2>
          <p className="text-xs text-white/40 mb-8">
            All times shown in {timeZone}
          </p>

          {slotsForSelectedDay.length === 0 ? (
            <p className="text-white/50 text-center py-12">
              No availability on this day. Pick another.
            </p>
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
                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all border ${
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : "bg-white/5 border-white/10 text-white/80 hover:border-primary/50 hover:bg-primary/5"
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
          className="glass-morphism rounded-[32px] border-white/10 p-6 md:p-10 space-y-6"
        >
          <button
            type="button"
            onClick={() => setStep("time")}
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change time
          </button>

          <div className="rounded-2xl bg-primary/10 border border-primary/20 px-5 py-4 flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <div className="font-bold text-white">
                {formatLongDateTime(selectedSlot, timeZone)}
              </div>
              <div className="text-xs text-white/50 mt-0.5">
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
              className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2"
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
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
            />
            {state.status === "error" && state.errors?.name && (
              <p className="text-xs text-red-400 ml-1">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="bk-email"
                className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2"
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
              />
              {state.status === "error" && state.errors?.email && (
                <p className="text-xs text-red-400 ml-1">{state.errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="bk-phone"
                className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-primary" />
                Phone <span className="text-white/30">(optional)</span>
              </label>
              <input
                id="bk-phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="bk-notes"
              className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              What do you want to discuss?{" "}
              <span className="text-white/30">(optional)</span>
            </label>
            <textarea
              id="bk-notes"
              name="notes"
              rows={3}
              placeholder="Tell us a bit about your project so we come prepared…"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all resize-none"
            />
          </div>

          {state.status === "error" && state.message && (
            <p
              aria-live="polite"
              className="text-sm text-red-400 text-center"
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-3 bg-white text-black px-7 py-3.5 rounded-2xl text-base font-bold hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
        <div className="glass-morphism rounded-[32px] border-white/10 p-10 md:p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-semibold mb-3">
            You&apos;re booked.
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            We&apos;ve sent a calendar invite + Google Meet link to your email.
            See you on{" "}
            <span className="text-white font-bold">
              {formatLongDateTime(state.booking.start, timeZone)}
            </span>
            .
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-white/40">
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
                    ? "text-white/60"
                    : "text-white/20"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] ${
                  active
                    ? "border-primary bg-primary/20"
                    : done
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                      : "border-white/10"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="w-6 h-px bg-white/10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
