"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Briefcase,
  Calculator,
  Check,
  GripVertical,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  createOpportunity,
  deleteOpportunity,
  moveOpportunity,
  updateOpportunity,
} from "@/lib/opportunity-actions";
import { OPPORTUNITY_SOURCES } from "@/lib/schemas";
import type {
  Opportunity,
  PipelineWithStages,
  PipelineStage,
} from "@/lib/admin-data";

/* ============================================================
 * Helpers
 * ============================================================ */

const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatMoney(cents: number) {
  return MONEY.format(Math.round(cents / 100));
}

function formatAge(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

// Map a source string → CSS-var pair + icon. Falls back to a neutral palette
// for unknown sources so future / promoted sources still render legibly.
const SOURCE_META: Record<
  string,
  { fg: string; bg: string; bar: string; icon: LucideIcon }
> = {
  Audit: {
    fg: "text-[var(--src-audit)]",
    bg: "bg-[var(--src-audit-bg)]",
    bar: "bg-[var(--src-audit)]",
    icon: Sparkles,
  },
  Budget: {
    fg: "text-[var(--src-budget)]",
    bg: "bg-[var(--src-budget-bg)]",
    bar: "bg-[var(--src-budget)]",
    icon: Calculator,
  },
  Contact: {
    fg: "text-[var(--src-contact)]",
    bg: "bg-[var(--src-contact-bg)]",
    bar: "bg-[var(--src-contact)]",
    icon: Briefcase,
  },
  Chat: {
    fg: "text-[var(--src-chat)]",
    bg: "bg-[var(--src-chat-bg)]",
    bar: "bg-[var(--src-chat)]",
    icon: MessageCircle,
  },
};
const SOURCE_FALLBACK = {
  fg: "text-[var(--muted)]",
  bg: "bg-[var(--surface-hover)]",
  bar: "bg-[var(--border-strong)]",
  icon: Briefcase,
};
function sourceMeta(s: string | null | undefined) {
  return (s && SOURCE_META[s]) || SOURCE_FALLBACK;
}

interface Toast {
  kind: "success" | "error";
  message: string;
}

/* ============================================================
 * OpportunitiesBoard — top-level
 * ============================================================ */

export function OpportunitiesBoard({
  pipeline,
  opportunities,
  setOpportunities,
}: {
  pipeline: PipelineWithStages;
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
}) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState<{ stageId: string | null } | null>(
    null,
  );
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStageId, setOverStageId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Only this pipeline's opps.
  const mine = useMemo(
    () => opportunities.filter((o) => o.pipeline_id === pipeline.id),
    [opportunities, pipeline.id],
  );

  // Group by stage, ordered.
  const byStage = useMemo(() => {
    const m = new Map<string, Opportunity[]>();
    for (const s of pipeline.stages) m.set(s.id, []);
    for (const o of mine) {
      const list = m.get(o.stage_id);
      if (list) list.push(o);
    }
    for (const list of m.values()) list.sort((a, b) => a.sort_order - b.sort_order);
    return m;
  }, [mine, pipeline.stages]);

  const totalCount = mine.filter((o) => o.status === "open").length;
  const totalValueCents = mine
    .filter((o) => o.status === "open")
    .reduce((s, o) => s + (o.value_cents ?? 0), 0);

  const flashOk = (m: string) => setToast({ kind: "success", message: m });
  const flashError = (m: string) => setToast({ kind: "error", message: m });

  /* ---------- DnD ---------- */

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setOverStageId(null);
  };
  const handleDragOverColumn =
    (stageId: string) => (e: React.DragEvent) => {
      if (!draggingId) return;
      e.preventDefault();
      setOverStageId(stageId);
    };
  const handleDragLeaveColumn =
    (stageId: string) => () => {
      if (overStageId === stageId) setOverStageId(null);
    };

  // Drop onto a column body → append at end of that stage.
  const handleDropColumn =
    (stageId: string) => (e: React.DragEvent) => {
      e.preventDefault();
      const oppId = draggingId;
      setDraggingId(null);
      setOverStageId(null);
      if (!oppId) return;
      const opp = mine.find((o) => o.id === oppId);
      if (!opp) return;
      const destList = byStage.get(stageId) ?? [];
      const targetSortOrder =
        opp.stage_id === stageId ? destList.length - 1 : destList.length;
      doMove(opp, stageId, Math.max(0, targetSortOrder));
    };

  // Drop onto a specific card → insert above it.
  const handleDropOnCard =
    (targetCard: Opportunity) => (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const oppId = draggingId;
      setDraggingId(null);
      setOverStageId(null);
      if (!oppId || oppId === targetCard.id) return;
      const opp = mine.find((o) => o.id === oppId);
      if (!opp) return;
      doMove(opp, targetCard.stage_id, targetCard.sort_order);
    };

  // Apply the move optimistically, then call the server. Roll back on failure.
  const doMove = (
    opp: Opportunity,
    destStageId: string,
    targetSortOrder: number,
  ) => {
    if (opp.stage_id === destStageId && opp.sort_order === targetSortOrder) {
      return;
    }
    const snapshot = opportunities;
    const destStage = pipeline.stages.find((s) => s.id === destStageId);
    if (!destStage) return;
    const newStatus =
      destStage.kind === "won"
        ? "won"
        : destStage.kind === "lost"
          ? "lost"
          : "open";
    const now = new Date().toISOString();

    // Build optimistic next state: drop the moving card, re-insert at index,
    // re-pack sort_orders for source AND destination columns.
    const next = opportunities.map((x) => x);
    const movingIdx = next.findIndex((o) => o.id === opp.id);
    if (movingIdx === -1) return;
    next.splice(movingIdx, 1);

    const srcOpps = next
      .filter((o) => o.stage_id === opp.stage_id && o.pipeline_id === opp.pipeline_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const destOpps = next
      .filter((o) => o.stage_id === destStageId && o.pipeline_id === opp.pipeline_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const insertAt = Math.max(0, Math.min(targetSortOrder, destOpps.length));
    const movedOpp: Opportunity = {
      ...opp,
      stage_id: destStageId,
      status: newStatus,
      won_at: newStatus === "won" ? now : null,
      lost_at: newStatus === "lost" ? now : null,
      sort_order: insertAt,
    };
    destOpps.splice(insertAt, 0, movedOpp);

    const repacked: Opportunity[] = [];
    for (let i = 0; i < srcOpps.length; i++) {
      repacked.push({ ...srcOpps[i], sort_order: i });
    }
    for (let i = 0; i < destOpps.length; i++) {
      repacked.push({ ...destOpps[i], sort_order: i });
    }
    const idsInChange = new Set(repacked.map((r) => r.id));
    const unchanged = next.filter((o) => !idsInChange.has(o.id));
    const newState = [...unchanged, ...repacked];

    setOpportunities(newState);

    startTransition(async () => {
      const res = await moveOpportunity({
        oppId: opp.id,
        stageId: destStageId,
        sortOrder: insertAt,
      });
      if (!res.ok) {
        setOpportunities(snapshot);
        flashError(res.error);
      }
    });
  };

  /* ---------- Create ---------- */

  const handleCreate = (input: {
    stageId: string;
    contactName: string;
    businessName: string;
    source: string | null;
    valueCents: number;
  }) => {
    startTransition(async () => {
      const res = await createOpportunity({
        pipelineId: pipeline.id,
        stageId: input.stageId,
        contactName: input.contactName,
        businessName: input.businessName || undefined,
        source:
          input.source === "Audit" ||
          input.source === "Budget" ||
          input.source === "Contact" ||
          input.source === "Chat"
            ? input.source
            : undefined,
        valueCents: input.valueCents,
      });
      if (!res.ok) return flashError(res.error);

      const stage = pipeline.stages.find((s) => s.id === input.stageId);
      if (!stage) return;
      const stageOpps = byStage.get(input.stageId) ?? [];
      const nextOrder = stageOpps.length;
      const now = new Date().toISOString();
      const status: Opportunity["status"] =
        stage.kind === "won" ? "won" : stage.kind === "lost" ? "lost" : "open";
      const newOpp: Opportunity = {
        id: res.id,
        pipeline_id: pipeline.id,
        stage_id: input.stageId,
        lead_id: null,
        contact_name: input.contactName,
        business_name: input.businessName || null,
        source: input.source,
        value_cents: input.valueCents,
        status,
        notes: null,
        sort_order: nextOrder,
        expected_close_at: null,
        won_at: status === "won" ? now : null,
        lost_at: status === "lost" ? now : null,
        lost_reason: null,
        created_at: now,
        updated_at: now,
      };
      setOpportunities((prev) => [...prev, newOpp]);
      setCreating(null);
      flashOk(`Opportunity added to ${stage.name}.`);
    });
  };

  /* ---------- Update / Delete ---------- */

  const handleUpdate = (
    oppId: string,
    fields: {
      contactName?: string;
      businessName?: string | null;
      source?: string | null;
      valueCents?: number;
      notes?: string | null;
    },
  ) => {
    const snapshot = opportunities;
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === oppId
          ? {
              ...o,
              ...(fields.contactName !== undefined && {
                contact_name: fields.contactName,
              }),
              ...(fields.businessName !== undefined && {
                business_name: fields.businessName,
              }),
              ...(fields.source !== undefined && { source: fields.source }),
              ...(fields.valueCents !== undefined && {
                value_cents: fields.valueCents,
              }),
              ...(fields.notes !== undefined && { notes: fields.notes }),
            }
          : o,
      ),
    );
    startTransition(async () => {
      const allowedSource =
        fields.source === null ||
        fields.source === undefined ||
        fields.source === "Audit" ||
        fields.source === "Budget" ||
        fields.source === "Contact" ||
        fields.source === "Chat"
          ? (fields.source as "Audit" | "Budget" | "Contact" | "Chat" | null | undefined)
          : undefined;
      const res = await updateOpportunity(oppId, {
        contactName: fields.contactName,
        businessName: fields.businessName,
        source: allowedSource,
        valueCents: fields.valueCents,
        notes: fields.notes,
      });
      if (!res.ok) {
        setOpportunities(snapshot);
        flashError(res.error);
      }
    });
  };

  const handleDelete = (oppId: string) => {
    if (!window.confirm("Delete this opportunity? This cannot be undone.")) return;
    const snapshot = opportunities;
    setOpportunities((prev) => prev.filter((o) => o.id !== oppId));
    setEditing(null);
    startTransition(async () => {
      const res = await deleteOpportunity(oppId);
      if (!res.ok) {
        setOpportunities(snapshot);
        flashError(res.error);
      }
    });
  };

  /* ---------- Render ---------- */

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-3 text-sm">
        <div className="text-[var(--muted)]">
          <span className="font-semibold text-[var(--fg)]">
            {totalCount}
          </span>{" "}
          open ·{" "}
          <span className="font-semibold text-primary">
            {formatMoney(totalValueCents)}
          </span>{" "}
          total value
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreating({ stageId: null })}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Opportunity
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Drag any card between columns to move it forward or back through the
        pipeline. Drop into Won or Lost to close the deal.
      </p>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map((stage) => {
          const opps = byStage.get(stage.id) ?? [];
          const colTotal = opps.reduce(
            (s, o) => s + (o.value_cents ?? 0),
            0,
          );
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOverColumn(stage.id)}
              onDragLeave={handleDragLeaveColumn(stage.id)}
              onDrop={handleDropColumn(stage.id)}
              className={`shrink-0 w-[280px] rounded-xl border bg-[var(--surface)] flex flex-col max-h-[calc(100vh-260px)] transition-colors ${
                overStageId === stage.id
                  ? "border-primary/50 bg-[var(--accent-softer)]"
                  : "border-[var(--border)]"
              }`}
            >
              <ColumnHead
                stage={stage}
                count={opps.length}
                totalCents={colTotal}
                onAdd={() => setCreating({ stageId: stage.id })}
              />
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {opps.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[var(--muted)]">
                    {overStageId === stage.id
                      ? "Drop here"
                      : "No opportunities"}
                  </div>
                ) : (
                  opps.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opp={opp}
                      dragging={draggingId === opp.id}
                      onDragStart={handleDragStart(opp.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDropOnCard(opp)}
                      onClick={() => setEditing(opp)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {creating && (
        <NewOpportunityModal
          pipeline={pipeline}
          initialStageId={creating.stageId}
          onClose={() => setCreating(null)}
          onCreate={handleCreate}
        />
      )}
      {editing && (
        <OpportunityDetailModal
          opp={editing}
          pipeline={pipeline}
          onClose={() => setEditing(null)}
          onSave={(fields) => {
            handleUpdate(editing.id, fields);
            setEditing(null);
          }}
          onDelete={() => handleDelete(editing.id)}
        />
      )}

      {/* Toast */}
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
 * Column head + opportunity card
 * ============================================================ */

const KIND_DOT: Record<PipelineStage["kind"], string> = {
  open: "bg-[var(--muted)]",
  won: "bg-[var(--status-won)]",
  lost: "bg-[var(--status-lost)]",
};

function ColumnHead({
  stage,
  count,
  totalCents,
  onAdd,
}: {
  stage: PipelineStage;
  count: number;
  totalCents: number;
  onAdd: () => void;
}) {
  return (
    <div className="p-3 border-b border-[var(--border)]">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${KIND_DOT[stage.kind]}`}
        />
        <span className="text-sm font-semibold truncate flex-1">
          {stage.name}
        </span>
        <span className="text-xs font-semibold text-[var(--muted)] tabular-nums">
          {count}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="p-1 rounded text-[var(--muted)] hover:text-primary hover:bg-[var(--accent-softer)]"
          title="Add opportunity to this stage"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="text-xs text-[var(--muted)] tabular-nums">
        {formatMoney(totalCents)}{" "}
        <span className="opacity-70">pipeline value</span>
      </div>
    </div>
  );
}

function OpportunityCard({
  opp,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onClick,
}: {
  opp: Opportunity;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  const meta = sourceMeta(opp.source);
  const SourceIcon = meta.icon;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      className={`relative group rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--border-strong)] cursor-pointer transition-colors overflow-hidden ${
        dragging ? "opacity-40" : ""
      }`}
      title="Drag to move · click to edit"
    >
      <span
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-1 ${meta.bar}`}
      />
      <div className="pl-3 pr-2 py-2.5 space-y-1.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">
              {opp.contact_name ?? "—"}
            </div>
            {opp.business_name && (
              <div className="text-xs text-[var(--muted)] truncate">
                {opp.business_name}
              </div>
            )}
          </div>
          <GripVertical className="w-3.5 h-3.5 text-[var(--muted)] opacity-0 group-hover:opacity-100 shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${meta.bg} ${meta.fg}`}
          >
            <SourceIcon className="w-3 h-3" />
            {opp.source ?? "Other"}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatMoney(opp.value_cents)}
          </span>
        </div>
        <div className="text-[10px] text-[var(--muted)] tabular-nums">
          {formatAge(opp.created_at)}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * New Opportunity modal
 * ============================================================ */

function NewOpportunityModal({
  pipeline,
  initialStageId,
  onClose,
  onCreate,
}: {
  pipeline: PipelineWithStages;
  initialStageId: string | null;
  onClose: () => void;
  onCreate: (input: {
    stageId: string;
    contactName: string;
    businessName: string;
    source: string | null;
    valueCents: number;
  }) => void;
}) {
  const openStages = pipeline.stages.filter((s) => s.kind === "open");
  const fallbackStageId =
    initialStageId ?? openStages[0]?.id ?? pipeline.stages[0]?.id ?? "";
  const [stageId, setStageId] = useState(fallbackStageId);
  const [contactName, setContactName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [source, setSource] = useState<string>("Contact");
  const [valueDollars, setValueDollars] = useState("3000");
  const firstInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInput.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = contactName.trim();
    if (!trimmed) return;
    const dollars = parseInt(valueDollars || "0", 10);
    const cents = Math.max(0, Math.round(dollars * 100));
    onCreate({
      stageId,
      contactName: trimmed,
      businessName: businessName.trim(),
      source: source || null,
      valueCents: cents,
    });
  };

  return (
    <ModalScrim onClose={onClose}>
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">New Opportunity</h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              Add a card to the {pipeline.name} board.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Field label="Stage">
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50"
          >
            {pipeline.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.kind === "won" ? " (won)" : s.kind === "lost" ? " (lost)" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Contact name">
          <input
            ref={firstInput}
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            maxLength={120}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50"
            placeholder="Jane Doe"
          />
        </Field>

        <Field label="Business">
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            maxLength={160}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50"
            placeholder="Acme Painters"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Source">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50"
            >
              {OPPORTUNITY_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Value ($)">
            <input
              type="number"
              min={0}
              step={50}
              value={valueDollars}
              onChange={(e) => setValueDollars(e.target.value)}
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50 tabular-nums"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </form>
    </ModalScrim>
  );
}

/* ============================================================
 * Detail / edit modal
 * ============================================================ */

function OpportunityDetailModal({
  opp,
  pipeline,
  onClose,
  onSave,
  onDelete,
}: {
  opp: Opportunity;
  pipeline: PipelineWithStages;
  onClose: () => void;
  onSave: (fields: {
    contactName?: string;
    businessName?: string | null;
    source?: string | null;
    valueCents?: number;
    notes?: string | null;
  }) => void;
  onDelete: () => void;
}) {
  const [contactName, setContactName] = useState(opp.contact_name ?? "");
  const [businessName, setBusinessName] = useState(opp.business_name ?? "");
  const [source, setSource] = useState(opp.source ?? "");
  const [valueDollars, setValueDollars] = useState(
    String(Math.round((opp.value_cents ?? 0) / 100)),
  );
  const [notes, setNotes] = useState(opp.notes ?? "");

  const stage = pipeline.stages.find((s) => s.id === opp.stage_id);

  const dirty =
    contactName !== (opp.contact_name ?? "") ||
    businessName !== (opp.business_name ?? "") ||
    source !== (opp.source ?? "") ||
    parseInt(valueDollars || "0", 10) !==
      Math.round((opp.value_cents ?? 0) / 100) ||
    notes !== (opp.notes ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = contactName.trim();
    if (!trimmed) return;
    const cents = Math.max(0, Math.round(parseInt(valueDollars || "0", 10) * 100));
    onSave({
      contactName: trimmed,
      businessName: businessName.trim() || null,
      source: source || null,
      valueCents: cents,
      notes: notes || null,
    });
  };

  return (
    <ModalScrim onClose={onClose}>
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Opportunity</h3>
            {stage && (
              <p className="text-xs text-[var(--muted)] mt-1">
                In <span className="font-medium">{stage.name}</span> · {pipeline.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Field label="Contact name">
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            maxLength={120}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50"
          />
        </Field>

        <Field label="Business">
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            maxLength={160}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Source">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="">(none)</option>
              {OPPORTUNITY_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Value ($)">
            <input
              type="number"
              min={0}
              step={50}
              value={valueDollars}
              onChange={(e) => setValueDollars(e.target.value)}
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50 tabular-nums"
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={4000}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50 resize-none"
            placeholder="Deal context, next steps…"
          />
        </Field>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!dirty}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </ModalScrim>
  );
}

/* ============================================================
 * Atoms
 * ============================================================ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ModalScrim({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {children}
    </div>
  );
}
