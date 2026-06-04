"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  RefreshCw,
  Video,
  X,
} from "lucide-react";
import {
  setAppointmentCategory,
  syncAppointmentsFromCal,
  updateAppointmentNotes,
} from "@/lib/appointment-actions";
import type { Appointment } from "@/lib/admin-data";

/* ============================================================
 * Helpers
 * ============================================================ */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORIES = [
  "Discovery",
  "Strategy",
  "Onboarding",
  "At risk",
] as const;
type Category = (typeof CATEGORIES)[number];

// Map a category label → token-driven palette. Falls back to a neutral
// scheme for null / unknown categories so an unclassified meeting still
// renders legibly.
const CATEGORY_COLORS: Record<
  Category,
  { fg: string; bg: string; chip: string; bar: string }
> = {
  Discovery: {
    fg: "text-[var(--status-new)]",
    bg: "bg-[var(--status-new-bg)]",
    chip: "bg-[var(--status-new-bg)] text-[var(--status-new)]",
    bar: "bg-[var(--status-new)]",
  },
  Strategy: {
    fg: "text-[var(--status-progress)]",
    bg: "bg-[var(--status-progress-bg)]",
    chip:
      "bg-[var(--status-progress-bg)] text-[var(--status-progress)]",
    bar: "bg-[var(--status-progress)]",
  },
  Onboarding: {
    fg: "text-[var(--status-won)]",
    bg: "bg-[var(--status-won-bg)]",
    chip: "bg-[var(--status-won-bg)] text-[var(--status-won)]",
    bar: "bg-[var(--status-won)]",
  },
  "At risk": {
    fg: "text-[var(--status-lost)]",
    bg: "bg-[var(--status-lost-bg)]",
    chip: "bg-[var(--status-lost-bg)] text-[var(--status-lost)]",
    bar: "bg-[var(--status-lost)]",
  },
};
const CATEGORY_FALLBACK = {
  fg: "text-[var(--muted)]",
  bg: "bg-[var(--surface-hover)]",
  chip: "bg-[var(--surface-hover)] text-[var(--muted)]",
  bar: "bg-[var(--border-strong)]",
};
function categoryPalette(category: string | null | undefined) {
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    return CATEGORY_COLORS[category as Category];
  }
  return CATEGORY_FALLBACK;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
function fmtTime24(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface Toast {
  kind: "success" | "error";
  message: string;
}

/* ============================================================
 * CalendarPanel
 * ============================================================ */

export function CalendarPanel({
  appointments: initialAppointments,
  monthStartISO,
  focus,
}: {
  appointments: Appointment[];
  monthStartISO: string;
  // Cross-tab focus from the bell. When an appointment notification is
  // clicked, AdminShell switches here AND sends { id, token }; we move
  // the cursor to the appointment's month and select it in the side
  // panel. Token bumps every click so re-firing on the same id re-selects.
  focus?: { id: string; token: number } | null;
}) {
  const initialMonth = new Date(monthStartISO);
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState<Date>(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [, startTransition] = useTransition();
  const today = new Date();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Apply focus from the bell. Look up the appointment in the current local
  // state, move the calendar cursor to that month, and select it. If the
  // appointment isn't in the loaded window (>90d out), the click is a
  // no-op — extremely rare given the notification fires at booking time.
  //
  // React 19 "previous render" pattern: only react when the token changes,
  // otherwise an edit to notes/category (which mutates `appointments`)
  // would re-fire and clobber the side panel state the user is editing.
  const [lastFocusToken, setLastFocusToken] = useState<number | null>(null);
  if (focus && focus.token !== lastFocusToken) {
    setLastFocusToken(focus.token);
    const target = appointments.find((a) => a.id === focus.id);
    if (target) {
      const at = new Date(target.starts_at);
      setCursor(new Date(at.getFullYear(), at.getMonth(), 1));
      setSelected(target);
    }
  }

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const handleSync = () => {
    setSyncing(true);
    startTransition(async () => {
      const res = await syncAppointmentsFromCal();
      setSyncing(false);
      if (!res.ok) {
        setToast({ kind: "error", message: res.error });
        return;
      }
      setToast({
        kind: "success",
        message: `Synced from Cal.com — ${res.added} added, ${res.updated} updated.`,
      });
      // Hard reload picks up the new rows; PipelinesPanel-style polling in
      // AdminShell will refresh the parent data within 15s anyway, but a
      // local toast hint keeps expectations honest.
    });
  };

  const handleNotes = (id: string, notes: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, notes } : a)),
    );
    if (selected?.id === id) setSelected({ ...selected, notes });
    startTransition(async () => {
      const res = await updateAppointmentNotes(id, notes);
      if (!res.ok) {
        setToast({ kind: "error", message: res.error });
      }
    });
  };

  const handleCategory = (id: string, category: string | null) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, category } : a)),
    );
    if (selected?.id === id) setSelected({ ...selected, category });
    startTransition(async () => {
      const res = await setAppointmentCategory(id, category);
      if (!res.ok) {
        setToast({ kind: "error", message: res.error });
      }
    });
  };

  const inWindow = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    return appointments.filter((a) => {
      const t = new Date(a.starts_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }, [appointments, cursor]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
          title="Previous month"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-semibold w-44 text-center">
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
          title="Next month"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
          }
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
        >
          Today
        </button>

        <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] ml-2">
          <ViewTab
            active={view === "month"}
            onClick={() => setView("month")}
            label="Month"
          />
          <ViewTab
            active={view === "week"}
            onClick={() => setView("week")}
            label="Week"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Legend />
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
      </div>

      {/* Grid + detail rail */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: selected ? "1fr 340px" : "1fr",
        }}
      >
        <div className="min-w-0">
          {view === "month" ? (
            <MonthGrid
              cursor={cursor}
              today={today}
              appointments={inWindow}
              selected={selected}
              onSelect={setSelected}
            />
          ) : (
            <WeekGrid
              cursor={cursor}
              today={today}
              appointments={appointments}
              selected={selected}
              onSelect={setSelected}
            />
          )}
        </div>
        {selected && (
          <DetailRail
            appt={selected}
            onClose={() => setSelected(null)}
            onSetCategory={(c) => handleCategory(selected.id, c)}
            onSaveNotes={(n) => handleNotes(selected.id, n)}
          />
        )}
      </div>

      {appointments.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-sm text-[var(--muted)]">
          No appointments yet.{" "}
          <button
            type="button"
            onClick={handleSync}
            className="text-primary underline-offset-2 hover:underline"
          >
            Sync from Cal.com
          </button>{" "}
          to backfill upcoming bookings.
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium text-white ${
            toast.kind === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.kind === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Views
 * ============================================================ */

function MonthGrid({
  cursor,
  today,
  appointments,
  selected,
  onSelect,
}: {
  cursor: Date;
  today: Date;
  appointments: Appointment[];
  selected: Appointment | null;
  onSelect: (a: Appointment) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = first.getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay = new Map<number, Appointment[]>();
  for (const a of appointments) {
    const d = new Date(a.starts_at);
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;
    const key = d.getDate();
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[var(--border)]">
        {DOW.map((d) => (
          <div
            key={d}
            className="text-xs font-medium text-[var(--muted)] text-center py-2"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const isToday =
            d != null &&
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === d;
          const dayAppts = d != null ? byDay.get(d) ?? [] : [];
          return (
            <div
              key={i}
              className={`min-h-[110px] border-t border-r border-[var(--border)] last:border-r-0 p-1.5 ${
                d == null
                  ? "bg-[var(--surface-hover)]/40"
                  : isToday
                    ? "bg-[var(--accent-softer)]"
                    : ""
              }`}
            >
              {d != null && (
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      isToday ? "text-primary" : "text-[var(--fg)]"
                    }`}
                  >
                    {d}
                  </span>
                  {isToday && (
                    <span className="text-[10px] uppercase font-semibold text-primary">
                      Today
                    </span>
                  )}
                </div>
              )}
              <div className="space-y-1">
                {dayAppts.slice(0, 3).map((a) => {
                  const p = categoryPalette(a.category);
                  const isSel = selected?.id === a.id;
                  const first =
                    (a.attendee_name?.split(" ")[0] ??
                      a.title ??
                      "Call") + "";
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onSelect(a)}
                      className={`w-full text-left rounded-md px-1.5 py-1 text-[10.5px] leading-tight flex items-center gap-1.5 transition-colors ${p.bg} ${p.fg} ${
                        isSel ? "ring-1 ring-primary/50" : ""
                      }`}
                      title={`${a.attendee_name ?? "Call"} · ${fmtTime(a.starts_at)}`}
                    >
                      <span className="tabular-nums font-mono opacity-80 shrink-0">
                        {fmtTime24(a.starts_at)}
                      </span>
                      <span className="truncate font-medium">{first}</span>
                    </button>
                  );
                })}
                {dayAppts.length > 3 && (
                  <div className="text-[10px] text-[var(--muted)] pl-1">
                    +{dayAppts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  cursor,
  today,
  appointments,
  selected,
  onSelect,
}: {
  cursor: Date;
  today: Date;
  appointments: Appointment[];
  selected: Appointment | null;
  onSelect: (a: Appointment) => void;
}) {
  // Week containing the cursor's day; if cursor is the 1st of the month
  // use the row that contains today (or the 1st) — use cursor as-is.
  const base = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() - base.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // 8am - 6pm slots (10 rows of 56px).
  const SLOT_H = 56;
  const startHour = 8;
  const endHour = 18;
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);

  const minutes = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[var(--border)]">
        <div />
        {days.map((d, i) => {
          const isToday = sameDay(d, today);
          return (
            <div
              key={i}
              className={`text-center py-2 ${isToday ? "bg-[var(--accent-softer)]" : ""}`}
            >
              <div className="text-xs font-medium text-[var(--muted)]">
                {DOW[i]}
              </div>
              <div
                className={`text-base font-semibold ${
                  isToday ? "text-primary" : "text-[var(--fg)]"
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="grid grid-cols-[64px_repeat(7,1fr)] relative"
        style={{ height: `${hours.length * SLOT_H}px` }}
      >
        {/* Hour gutter */}
        <div>
          {hours.map((h) => (
            <div
              key={h}
              className="border-t border-[var(--border)] text-[10px] text-[var(--muted)] font-mono px-2 pt-0.5"
              style={{ height: SLOT_H }}
            >
              {h > 12 ? h - 12 : h}
              {h >= 12 ? "pm" : "am"}
            </div>
          ))}
        </div>
        {/* Day columns */}
        {days.map((d, i) => {
          const dayAppts = appointments.filter((a) => {
            const s = new Date(a.starts_at);
            return sameDay(s, d);
          });
          return (
            <div
              key={i}
              className="relative border-l border-[var(--border)]"
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-t border-[var(--border)]"
                  style={{ height: SLOT_H }}
                />
              ))}
              {dayAppts.map((a) => {
                const startMin = minutes(a.starts_at);
                const endMin = minutes(a.ends_at);
                const top =
                  ((startMin - startHour * 60) / 60) * SLOT_H + 2;
                const height = Math.max(
                  18,
                  ((endMin - startMin) / 60) * SLOT_H - 4,
                );
                const p = categoryPalette(a.category);
                const isSel = selected?.id === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelect(a)}
                    className={`absolute left-1 right-1 rounded-md p-1.5 text-[11px] leading-tight text-left ${p.bg} ${p.fg} ${
                      isSel
                        ? "ring-1 ring-primary/60"
                        : "hover:ring-1 hover:ring-primary/30"
                    }`}
                    style={{ top, height }}
                  >
                    <div className="font-mono text-[10px] opacity-80">
                      {fmtTime24(a.starts_at)}
                    </div>
                    <div className="font-semibold truncate">
                      {a.attendee_name?.split(" ")[0] ?? "Call"}
                    </div>
                    {height > 36 && (
                      <div className="truncate opacity-90">
                        {a.category ?? "Uncategorised"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * Detail rail
 * ============================================================ */

function DetailRail({
  appt,
  onClose,
  onSetCategory,
  onSaveNotes,
}: {
  appt: Appointment;
  onClose: () => void;
  onSetCategory: (c: string | null) => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(appt.notes ?? "");
  useEffect(() => {
    setNotes(appt.notes ?? "");
  }, [appt.id, appt.notes]);
  const dirty = notes !== (appt.notes ?? "");
  const p = categoryPalette(appt.category);

  return (
    <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 self-start sticky top-0 max-h-[calc(100vh-180px)] overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${p.chip}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${p.bar}`} />
          {appt.category ?? "Uncategorised"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
          aria-label="Close detail"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-base font-semibold mt-3 truncate">
        {appt.attendee_name ?? "Unnamed attendee"}
      </h3>
      {appt.attendee_email && (
        <a
          href={`mailto:${appt.attendee_email}`}
          className="text-xs text-primary hover:underline block truncate"
        >
          {appt.attendee_email}
        </a>
      )}

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-[var(--fg)]">
          <Clock className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
          {new Date(appt.starts_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          – {fmtTime(appt.ends_at)}
        </div>
        {appt.channel && (
          <div className="flex items-center gap-2 text-[var(--fg)]">
            <Video className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
            {appt.channel}
          </div>
        )}
        {appt.status !== "confirmed" && (
          <div className="text-xs font-medium text-[var(--status-lost)] uppercase">
            {appt.status}
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="text-xs font-medium text-[var(--muted)] mb-2">
          Category
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const active = appt.category === c;
            const cp = CATEGORY_COLORS[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => onSetCategory(active ? null : c)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? `${cp.chip} ring-1 ring-inset ring-[var(--ring)]`
                    : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--muted)]">
            Prep notes
          </span>
          {dirty && (
            <button
              type="button"
              onClick={() => onSaveNotes(notes)}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Save
            </button>
          )}
        </div>
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
          placeholder="Talking points, links, deal context…"
          className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50 resize-none"
        />
      </div>

      {appt.cal_uid && (
        <div className="mt-5 text-[10px] text-[var(--muted)] font-mono truncate">
          Cal.com · {appt.cal_uid}
        </div>
      )}
    </aside>
  );
}

/* ============================================================
 * Atoms
 * ============================================================ */

function ViewTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
        active
          ? "bg-[var(--surface)] text-[var(--fg)] shadow-sm"
          : "text-[var(--muted)] hover:text-[var(--fg)]"
      }`}
    >
      {label}
    </button>
  );
}

function Legend() {
  return (
    <div className="hidden md:flex items-center gap-3 text-xs text-[var(--muted)]">
      {CATEGORIES.map((c) => (
        <span key={c} className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[c].bar}`}
          />
          {c}
        </span>
      ))}
    </div>
  );
}
