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
  contact: { label: "Contact", icon: Briefcase, color: "text-blue-400" },
  custom_request: { label: "Custom", icon: Sparkles, color: "text-primary" },
  roi: { label: "ROI", icon: Calculator, color: "text-emerald-400" },
  chat: { label: "Chat", icon: MessageCircle, color: "text-amber-400" },
};

const STATUS_META: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-blue-400/15", text: "text-blue-300" },
  in_progress: {
    label: "In progress",
    bg: "bg-amber-400/15",
    text: "text-amber-300",
  },
  won: { label: "Won", bg: "bg-emerald-400/15", text: "text-emerald-300" },
  lost: { label: "Lost", bg: "bg-red-400/15", text: "text-red-300" },
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
        <Kpi label="New" value={counts.newOnes} accent="text-blue-300" />
        <Kpi
          label="In progress"
          value={counts.inProgress}
          accent="text-amber-300"
        />
        <Kpi label="Won" value={counts.won} accent="text-emerald-300" />
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
          <div className="text-center py-16 text-white/40 text-sm">
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
    <div className="p-5 glass-morphism rounded-2xl border-white/5">
      <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">
        {label}
      </div>
      <div className={`text-3xl font-display font-bold ${accent ?? ""}`}>
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
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-2">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            value === opt.value
              ? "bg-white text-black"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
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
    <div className="glass-morphism rounded-2xl border-white/5 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-white/[0.02] focus-visible:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset transition-colors"
      >
        <div
          className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 ${meta.color}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-0.5">
            <span className="font-bold text-sm text-white truncate">
              {lead.name ?? lead.email ?? "(no name)"}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>
          <div className="text-xs text-white/40 truncate flex items-center gap-2">
            <span className="font-bold uppercase tracking-widest text-[9px] text-white/30">
              {meta.label}
            </span>
            {lead.email && <span>· {lead.email}</span>}
            {lead.source && (
              <span className="hidden md:inline">· {lead.source}</span>
            )}
          </div>
        </div>
        <div className="hidden md:block text-xs text-white/30 font-medium flex-shrink-0">
          {formatTimeAgo(lead.created_at)}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
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
            <div className="px-4 md:px-5 pb-5 pt-2 border-t border-white/5 space-y-5">
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
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
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
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mr-2">
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
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          isCurrent
                            ? `${sm.bg} ${sm.text} ring-1 ring-inset ring-white/10`
                            : "bg-white/5 text-white/60 hover:bg-white/10"
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
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
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
    <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-white truncate">{value}</div>
    </div>
  );
}

function PayloadView({ payload }: { payload: Record<string, unknown> }) {
  // Pretty-print common keys; collapse the IP into a small badge.
  const entries = Object.entries(payload).filter(([k]) => k !== "ip");
  const ip = typeof payload.ip === "string" ? payload.ip : null;

  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/5 divide-y divide-white/5 text-sm">
      {entries.length === 0 && (
        <div className="px-4 py-3 text-white/40">No additional fields.</div>
      )}
      {entries.map(([k, v]) => (
        <div key={k} className="px-4 py-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest md:col-span-1 self-start pt-0.5">
            {humanizeKey(k)}
          </div>
          <div className="md:col-span-3 text-white/80 break-words whitespace-pre-wrap">
            {formatValue(v)}
          </div>
        </div>
      ))}
      {ip && (
        <div className="px-4 py-2 text-[10px] font-mono text-white/30">
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
  if (v == null) return "—";
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
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Internal notes
        </div>
        {savedAt && (
          <span className="text-[10px] text-emerald-400 inline-flex items-center gap-1">
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
        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none"
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
        className="mt-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving…" : "Save notes"}
      </button>
    </div>
  );
}

// Suppress unused-import warning for the icon imported but only referenced above.
void UserCircle;
