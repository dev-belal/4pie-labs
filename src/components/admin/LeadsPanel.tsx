"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Trash2,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import {
  deleteLead,
  updateLeadNotes,
  updateLeadStatus,
} from "@/lib/admin-actions";
import type { Lead, LeadStatus, LeadType } from "@/lib/admin-data";

const TYPE_META: Record<LeadType, { label: string; icon: LucideIcon; color: string }> = {
  contact: {
    label: "Contact",
    icon: Briefcase,
    color: "text-[var(--src-contact)]",
  },
  custom_request: {
    label: "Custom",
    icon: Sparkles,
    color: "text-primary",
  },
  roi: {
    label: "ROI",
    icon: Calculator,
    color: "text-[var(--src-budget)]",
  },
  chat: {
    label: "Chat",
    icon: MessageCircle,
    color: "text-[var(--src-chat)]",
  },
};

const STATUS_META: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new: {
    label: "New",
    bg: "bg-[var(--status-new-bg)]",
    text: "text-[var(--status-new)]",
  },
  in_progress: {
    label: "In progress",
    bg: "bg-[var(--status-progress-bg)]",
    text: "text-[var(--status-progress)]",
  },
  won: {
    label: "Won",
    bg: "bg-[var(--status-won-bg)]",
    text: "text-[var(--status-won)]",
  },
  lost: {
    label: "Lost",
    bg: "bg-[var(--status-lost-bg)]",
    text: "text-[var(--status-lost)]",
  },
};

const TYPE_FILTERS: { value: LeadType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "contact", label: "Contact" },
  { value: "custom_request", label: "Custom" },
  { value: "roi", label: "ROI" },
  { value: "chat", label: "Chat" },
];

const STATUS_FILTERS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function formatTimeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LeadsPanel({ leads }: { leads: Lead[] }) {
  const [typeFilter, setTypeFilter] = useState<LeadType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return leads.filter(
      (l) =>
        (typeFilter === "all" || l.type === typeFilter) &&
        (statusFilter === "all" || l.status === statusFilter),
    );
  }, [leads, typeFilter, statusFilter]);

  const counts = useMemo(() => {
    const all = leads.length;
    const newOnes = leads.filter((l) => l.status === "new").length;
    const inProgress = leads.filter((l) => l.status === "in_progress").length;
    const won = leads.filter((l) => l.status === "won").length;
    return { all, newOnes, inProgress, won };
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total leads" value={counts.all} />
        <Kpi
          label="New"
          value={counts.newOnes}
          accent="text-[var(--status-new)]"
        />
        <Kpi
          label="In progress"
          value={counts.inProgress}
          accent="text-[var(--status-progress)]"
        />
        <Kpi
          label="Won"
          value={counts.won}
          accent="text-[var(--status-won)]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <FilterRow
          label="Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_FILTERS}
        />
        <FilterRow
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTERS}
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted)] text-sm">
            No leads match these filters yet.
          </div>
        ) : (
          filtered.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              expanded={expanded === lead.id}
              onToggle={() =>
                setExpanded(expanded === lead.id ? null : lead.id)
              }
              isPending={isPending}
              onAction={(fn) => startTransition(fn)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
      <div className="text-xs font-medium text-[var(--muted)] mb-2">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold tracking-tight ${accent ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-[var(--muted)] mr-1">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-primary text-on-primary"
              : "bg-[var(--surface-hover)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function LeadRow({
  lead,
  expanded,
  onToggle,
  isPending,
  onAction,
}: {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
  isPending: boolean;
  onAction: (fn: () => void) => void;
}) {
  const meta = TYPE_META[lead.type];
  const Icon = meta.icon;
  const status = STATUS_META[lead.status];

  const handleStatus = (next: LeadStatus) => {
    onAction(async () => {
      await updateLeadStatus(lead.id, next);
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this lead permanently?")) return;
    onAction(async () => {
      await deleteLead(lead.id);
    });
  };

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset transition-colors"
      >
        <div
          className={`w-10 h-10 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 ${meta.color}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-0.5">
            <span className="font-semibold text-sm text-[var(--fg)] truncate">
              {lead.name ?? lead.email ?? "(no name)"}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>
          <div className="text-xs text-[var(--muted)] truncate flex items-center gap-2">
            <span className="font-medium text-[var(--faint)]">{meta.label}</span>
            {lead.email && <span>· {lead.email}</span>}
            {lead.source && (
              <span className="hidden md:inline">· {lead.source}</span>
            )}
          </div>
        </div>
        <div className="hidden md:block text-xs text-[var(--muted)] font-medium flex-shrink-0 tabular-nums">
          {formatTimeAgo(lead.created_at)}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-5 pb-5 pt-3 border-t border-[var(--border)] space-y-5">
              {/* Contact rows */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lead.email && (
                  <ContactRow
                    icon={<Mail className="w-3.5 h-3.5" />}
                    label="Email"
                    value={
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-primary hover:underline"
                      >
                        {lead.email}
                      </a>
                    }
                  />
                )}
                {lead.phone && (
                  <ContactRow
                    icon={<Phone className="w-3.5 h-3.5" />}
                    label="Phone"
                    value={
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-primary hover:underline"
                      >
                        {lead.phone}
                      </a>
                    }
                  />
                )}
                <ContactRow
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Submitted"
                  value={formatDate(lead.created_at)}
                />
              </div>

              {/* Payload (form-specific fields) */}
              {Object.keys(lead.payload).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-[var(--muted)] mb-2">
                    Submission
                  </div>
                  <PayloadView payload={lead.payload} />
                </div>
              )}

              {/* Notes editor */}
              <NotesEditor
                leadId={lead.id}
                initial={lead.notes ?? ""}
                disabled={isPending}
              />

              {/* Status + delete actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border)]">
                <span className="text-xs font-medium text-[var(--muted)] mr-1">
                  Set status
                </span>
                {(["new", "in_progress", "won", "lost"] as LeadStatus[]).map(
                  (s) => {
                    const sm = STATUS_META[s];
                    const isCurrent = lead.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={isCurrent || isPending}
                        onClick={() => handleStatus(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isCurrent
                            ? `${sm.bg} ${sm.text} ring-1 ring-inset ring-[var(--ring)]`
                            : "bg-[var(--surface-hover)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isCurrent && <Check className="inline w-3 h-3 mr-1" />}
                        {sm.label}
                      </button>
                    );
                  },
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface-hover)] rounded-lg px-4 py-3 border border-[var(--border)]">
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-[var(--fg)] truncate">
        {value}
      </div>
    </div>
  );
}

function PayloadView({ payload }: { payload: Record<string, unknown> }) {
  // Pretty-print common keys; collapse the IP into a small badge.
  const entries = Object.entries(payload).filter(([k]) => k !== "ip");
  const ip = typeof payload.ip === "string" ? payload.ip : null;

  return (
    <div className="bg-[var(--surface-hover)] rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] text-sm">
      {entries.length === 0 && (
        <div className="px-4 py-3 text-[var(--muted)]">
          No additional fields.
        </div>
      )}
      {entries.map(([k, v]) => (
        <div
          key={k}
          className="px-4 py-3 grid grid-cols-1 md:grid-cols-4 gap-2"
        >
          <div className="text-xs font-medium text-[var(--muted)] md:col-span-1 self-start pt-0.5">
            {humanizeKey(k)}
          </div>
          <div className="md:col-span-3 text-[var(--fg)] break-words whitespace-pre-wrap">
            {formatValue(v)}
          </div>
        </div>
      ))}
      {ip && (
        <div className="px-4 py-2 text-xs font-mono text-[var(--muted)]">
          IP {ip}
        </div>
      )}
    </div>
  );
}

function humanizeKey(k: string) {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatValue(v: unknown): string {
  if (v == null) return "-";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 2);
}

function NotesEditor({
  leadId,
  initial,
  disabled,
}: {
  leadId: string;
  initial: string;
  disabled: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = value !== initial;

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await updateLeadNotes(leadId, value);
    setSaving(false);
    if ("ok" in res && res.ok) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } else if ("error" in res) {
      setError(res.error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-[var(--muted)]">
          Internal notes
        </div>
        {savedAt && (
          <span className="text-xs text-[var(--status-won)] inline-flex items-center gap-1">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled || saving}
        placeholder="Follow-up reminders, deal context, etc."
        className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:border-primary/50 transition-all resize-none"
      />
      {error && (
        <p className="text-xs text-red-400 mt-1 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={!dirty || saving}
        className="mt-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-hover)] hover:bg-[var(--surface-2)] text-[var(--fg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving…" : "Save notes"}
      </button>
    </div>
  );
}

// Suppress unused-import warning for the icon imported but only referenced above.
void UserCircle;
