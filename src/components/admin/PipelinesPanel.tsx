"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  GitBranch,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  addStage,
  archivePipeline,
  createPipeline,
  deleteStage,
  renamePipeline,
  renameStage,
  reorderStages,
  setStageKind,
} from "@/lib/pipeline-actions";
import type {
  Opportunity,
  PipelineStage,
  PipelineWithStages,
  StageKind,
} from "@/lib/admin-data";
import { OpportunitiesBoard } from "./OpportunitiesBoard";

type ToastKind = "success" | "error";
interface Toast {
  kind: ToastKind;
  message: string;
}

const KIND_LABELS: Record<StageKind, string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
};
const KIND_DOT: Record<StageKind, string> = {
  open: "bg-[var(--muted)]",
  won: "bg-[var(--status-won)]",
  lost: "bg-[var(--status-lost)]",
};

export function PipelinesPanel({
  pipelines: initialPipelines,
  opportunities: initialOpportunities,
}: {
  pipelines: PipelineWithStages[];
  opportunities: Opportunity[];
}) {
  // Local state seeded from server props. We intentionally do NOT re-sync
  // from props on poll-refresh so a user's mid-edit work is not clobbered
  // every 15s. Hard reload picks up external changes if ever needed.
  const [pipelines, setPipelines] =
    useState<PipelineWithStages[]>(initialPipelines);
  const [opportunities, setOpportunities] =
    useState<Opportunity[]>(initialOpportunities);
  const [activeId, setActiveId] = useState<string | null>(
    initialPipelines[0]?.id ?? null,
  );
  const [view, setView] = useState<"builder" | "opportunities">("builder");
  const [toast, setToast] = useState<Toast | null>(null);
  const [, startTransition] = useTransition();

  // Auto-dismiss toasts.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const active = pipelines.find((p) => p.id === activeId) ?? null;

  const updatePipeline = (
    id: string,
    fn: (p: PipelineWithStages) => PipelineWithStages,
  ) => setPipelines((prev) => prev.map((p) => (p.id === id ? fn(p) : p)));

  const flashError = (msg: string) => setToast({ kind: "error", message: msg });
  const flashOk = (msg: string) => setToast({ kind: "success", message: msg });

  /* ---------- Pipeline ops ---------- */

  const handleNewPipeline = () => {
    startTransition(async () => {
      const res = await createPipeline("Untitled Pipeline");
      if (!res.ok) return flashError(res.error);
      // Optimistic-ish: add a placeholder with the seeded 4 stages so the
      // builder is immediately usable. The next poll-refresh syncs the
      // real ids/timestamps; for naming purposes id alone is enough now.
      const now = new Date().toISOString();
      const stub: PipelineWithStages = {
        id: res.id,
        name: "Untitled Pipeline",
        sort_order: pipelines.length,
        archived_at: null,
        created_at: now,
        updated_at: now,
        stages: [
          { id: "tmp-1-" + res.id, pipeline_id: res.id, name: "New Lead", kind: "open", sort_order: 0, created_at: now, updated_at: now },
          { id: "tmp-2-" + res.id, pipeline_id: res.id, name: "Qualified", kind: "open", sort_order: 1, created_at: now, updated_at: now },
          { id: "tmp-3-" + res.id, pipeline_id: res.id, name: "Proposal", kind: "open", sort_order: 2, created_at: now, updated_at: now },
          { id: "tmp-4-" + res.id, pipeline_id: res.id, name: "Won", kind: "won", sort_order: 3, created_at: now, updated_at: now },
        ],
      };
      setPipelines((prev) => [...prev, stub]);
      setActiveId(res.id);
      setView("builder");
      flashOk("Pipeline created. Reload to refresh stage ids.");
    });
  };

  const handleRenamePipeline = (id: string, name: string) => {
    const prev = pipelines.find((p) => p.id === id);
    if (!prev || prev.name === name) return;
    updatePipeline(id, (p) => ({ ...p, name }));
    startTransition(async () => {
      const res = await renamePipeline(id, name);
      if (!res.ok) {
        updatePipeline(id, (p) => ({ ...p, name: prev.name }));
        flashError(res.error);
      }
    });
  };

  const handleArchivePipeline = (id: string) => {
    if (!window.confirm("Archive this pipeline? It will be hidden from the admin.")) return;
    const prev = pipelines;
    const remaining = pipelines.filter((p) => p.id !== id);
    setPipelines(remaining);
    setActiveId(remaining[0]?.id ?? null);
    startTransition(async () => {
      const res = await archivePipeline(id);
      if (!res.ok) {
        setPipelines(prev);
        setActiveId(id);
        flashError(res.error);
      } else {
        flashOk("Pipeline archived.");
      }
    });
  };

  /* ---------- Stage ops ---------- */

  const handleAddStage = (pipelineId: string) => {
    startTransition(async () => {
      const res = await addStage(pipelineId, "New stage");
      if (!res.ok) return flashError(res.error);
      const now = new Date().toISOString();
      updatePipeline(pipelineId, (p) => ({
        ...p,
        stages: [
          ...p.stages,
          {
            id: res.id,
            pipeline_id: pipelineId,
            name: "New stage",
            kind: "open",
            sort_order: p.stages.length,
            created_at: now,
            updated_at: now,
          },
        ],
      }));
    });
  };

  const handleRenameStage = (
    pipelineId: string,
    stageId: string,
    name: string,
  ) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    const prev = pipeline?.stages.find((s) => s.id === stageId);
    if (!prev || prev.name === name) return;
    updatePipeline(pipelineId, (p) => ({
      ...p,
      stages: p.stages.map((s) => (s.id === stageId ? { ...s, name } : s)),
    }));
    startTransition(async () => {
      const res = await renameStage(stageId, name);
      if (!res.ok) {
        updatePipeline(pipelineId, (p) => ({
          ...p,
          stages: p.stages.map((s) =>
            s.id === stageId ? { ...s, name: prev.name } : s,
          ),
        }));
        flashError(res.error);
      }
    });
  };

  const handleSetKind = (
    pipelineId: string,
    stageId: string,
    kind: StageKind,
  ) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    const prev = pipeline?.stages.find((s) => s.id === stageId);
    if (!prev || prev.kind === kind) return;
    updatePipeline(pipelineId, (p) => ({
      ...p,
      stages: p.stages.map((s) => (s.id === stageId ? { ...s, kind } : s)),
    }));
    startTransition(async () => {
      const res = await setStageKind(stageId, kind);
      if (!res.ok) {
        updatePipeline(pipelineId, (p) => ({
          ...p,
          stages: p.stages.map((s) =>
            s.id === stageId ? { ...s, kind: prev.kind } : s,
          ),
        }));
        flashError(res.error);
      }
    });
  };

  const handleDeleteStage = (pipelineId: string, stageId: string) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return;
    if (pipeline.stages.length <= 2) {
      flashError("A pipeline needs at least 2 stages.");
      return;
    }
    const prev = pipeline.stages;
    updatePipeline(pipelineId, (p) => ({
      ...p,
      stages: p.stages.filter((s) => s.id !== stageId),
    }));
    startTransition(async () => {
      const res = await deleteStage(stageId);
      if (!res.ok) {
        updatePipeline(pipelineId, (p) => ({ ...p, stages: prev }));
        flashError(res.error);
      }
    });
  };

  const handleReorder = (pipelineId: string, newOrder: PipelineStage[]) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return;
    const prev = pipeline.stages;
    // Skip any stages whose id is still a temporary placeholder (created by
    // the optimistic new-pipeline flow before the real ids load).
    const ids = newOrder.map((s) => s.id);
    if (ids.some((id) => id.startsWith("tmp-"))) {
      flashError("Reload the page to finish syncing this pipeline before reordering.");
      return;
    }
    updatePipeline(pipelineId, (p) => ({
      ...p,
      stages: newOrder.map((s, i) => ({ ...s, sort_order: i })),
    }));
    startTransition(async () => {
      const res = await reorderStages(pipelineId, ids);
      if (!res.ok) {
        updatePipeline(pipelineId, (p) => ({ ...p, stages: prev }));
        flashError(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <PipelineSwitcher
          pipelines={pipelines}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={handleNewPipeline}
        />
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
          <ViewTab
            active={view === "builder"}
            onClick={() => setView("builder")}
            label="Pipeline"
          />
          <ViewTab
            active={view === "opportunities"}
            onClick={() => setView("opportunities")}
            label="Opportunities"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {active && view === "builder" && (
            <>
              <button
                type="button"
                onClick={() => handleAddStage(active.id)}
                className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add stage
              </button>
              <button
                type="button"
                onClick={() => handleArchivePipeline(active.id)}
                className="px-3 py-2 text-sm font-medium rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                title="Archive pipeline"
              >
                Archive
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active pipeline name (editable) */}
      {active && (
        <InlineRename
          value={active.name}
          onCommit={(v) => handleRenamePipeline(active.id, v)}
          className="text-xl font-semibold"
        />
      )}

      {/* Empty state when no pipelines yet */}
      {!active && (
        <EmptyState
          icon={<GitBranch className="w-10 h-10" />}
          title="No pipelines yet"
          body="Create your first pipeline to start organising opportunities into stages."
          action={
            <button
              type="button"
              onClick={handleNewPipeline}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-on-primary hover:opacity-90 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Pipeline
            </button>
          }
        />
      )}

      {/* Builder board */}
      {active && view === "builder" && (
        <BuilderBoard
          pipeline={active}
          onRenameStage={handleRenameStage}
          onSetKind={handleSetKind}
          onDeleteStage={handleDeleteStage}
          onReorder={handleReorder}
          onAddStage={() => handleAddStage(active.id)}
        />
      )}

      {/* Opportunities board */}
      {active && view === "opportunities" && (
        <OpportunitiesBoard
          pipeline={active}
          opportunities={opportunities}
          setOpportunities={setOpportunities}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium ${
            toast.kind === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
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
 * Pipeline switcher (dropdown)
 * ============================================================ */

function PipelineSwitcher({
  pipelines,
  activeId,
  onSelect,
  onNew,
}: {
  pipelines: PipelineWithStages[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const active = pipelines.find((p) => p.id === activeId);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="min-w-[220px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] hover:border-[var(--border-strong)] text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          {active?.name ?? "No pipelines"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-[260px] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-2 z-30">
          {pipelines.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--surface-hover)] text-left"
            >
              <GitBranch className="w-4 h-4 text-[var(--muted)]" />
              <span className="flex-1 truncate">{p.name}</span>
              {p.id === activeId && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
          {pipelines.length > 0 && (
            <div className="my-1 h-px bg-[var(--border)]" />
          )}
          <button
            type="button"
            onClick={() => {
              onNew();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10"
          >
            <Plus className="w-4 h-4" />
            New Pipeline
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Builder board — columns of stages, drag to reorder
 * ============================================================ */

function BuilderBoard({
  pipeline,
  onRenameStage,
  onSetKind,
  onDeleteStage,
  onReorder,
  onAddStage,
}: {
  pipeline: PipelineWithStages;
  onRenameStage: (pipelineId: string, stageId: string, name: string) => void;
  onSetKind: (pipelineId: string, stageId: string, kind: StageKind) => void;
  onDeleteStage: (pipelineId: string, stageId: string) => void;
  onReorder: (pipelineId: string, newOrder: PipelineStage[]) => void;
  onAddStage: () => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId || draggingId === id) return;
    setOverId(id);
  };
  const handleDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setOverId(null);
      return;
    }
    const from = pipeline.stages.findIndex((s) => s.id === draggingId);
    const to = pipeline.stages.findIndex((s) => s.id === targetId);
    if (from === -1 || to === -1) {
      setDraggingId(null);
      setOverId(null);
      return;
    }
    const reordered = [...pipeline.stages];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setDraggingId(null);
    setOverId(null);
    onReorder(pipeline.id, reordered);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setOverId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipeline.stages.map((stage) => (
        <StageColumn
          key={stage.id}
          stage={stage}
          pipelineId={pipeline.id}
          isDragging={draggingId === stage.id}
          isOver={overId === stage.id}
          onDragStart={handleDragStart(stage.id)}
          onDragOver={handleDragOver(stage.id)}
          onDrop={handleDrop(stage.id)}
          onDragEnd={handleDragEnd}
          onRename={(name) => onRenameStage(pipeline.id, stage.id, name)}
          onSetKind={(kind) => onSetKind(pipeline.id, stage.id, kind)}
          onDelete={() => onDeleteStage(pipeline.id, stage.id)}
        />
      ))}
      <button
        type="button"
        onClick={onAddStage}
        className="shrink-0 w-[260px] rounded-xl border-2 border-dashed border-[var(--border)] hover:border-primary/40 hover:bg-primary/5 text-[var(--muted)] hover:text-primary transition-colors flex flex-col items-center justify-center gap-2 py-12"
      >
        <Plus className="w-6 h-6" />
        <span className="text-sm font-bold">Add stage</span>
      </button>
    </div>
  );
}

function StageColumn({
  stage,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRename,
  onSetKind,
  onDelete,
}: {
  stage: PipelineStage;
  pipelineId: string;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRename: (name: string) => void;
  onSetKind: (kind: StageKind) => void;
  onDelete: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`shrink-0 w-[260px] rounded-xl border bg-[var(--surface)] transition-all ${
        isOver
          ? "border-primary/50 bg-[var(--accent-softer)]"
          : "border-[var(--border)]"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="flex items-center gap-2 p-3 border-b border-[var(--border)] cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-[var(--muted)] shrink-0" />
        <span className={`w-2 h-2 rounded-full shrink-0 ${KIND_DOT[stage.kind]}`} />
        <InlineRename
          value={stage.name}
          onCommit={onRename}
          className="text-sm font-semibold flex-1"
        />
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded text-[var(--muted)] hover:text-red-400 hover:bg-red-400/10"
          title="Delete stage"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3 space-y-3">
        <KindSelector value={stage.kind} onChange={onSetKind} />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-[var(--surface-hover)]/40 border border-dashed border-[var(--border)]"
            />
          ))}
        </div>
        <div className="text-xs text-[var(--muted)] text-center pt-1">
          0 opportunities
        </div>
      </div>
    </div>
  );
}

function KindSelector({
  value,
  onChange,
}: {
  value: StageKind;
  onChange: (k: StageKind) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-md bg-[var(--surface-hover)]">
      {(Object.keys(KIND_LABELS) as StageKind[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`flex-1 text-[11px] py-1 rounded-sm font-medium transition-colors ${
            value === k
              ? "bg-[var(--surface)] text-[var(--fg)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--fg)]"
          }`}
          title={`Mark stage as ${KIND_LABELS[k]}`}
        >
          {KIND_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
 * Misc atoms
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
      className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
        active
          ? "bg-[var(--surface)] text-[var(--fg)] shadow-sm"
          : "text-[var(--muted)] hover:text-[var(--fg)]"
      }`}
    >
      {label}
    </button>
  );
}

function InlineRename({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next) {
      setDraft(value);
      return;
    }
    if (next === value) return;
    onCommit(next);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={`bg-[var(--surface-hover)] rounded px-2 py-0.5 outline-none ring-1 ring-primary/50 ${className ?? ""}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`text-left truncate hover:underline decoration-[var(--border-strong)] underline-offset-4 inline-flex items-center gap-1 group ${className ?? ""}`}
      title="Click to rename"
    >
      <span className="truncate">{value}</span>
      <Pencil className="w-3 h-3 text-[var(--muted)] opacity-40 group-hover:opacity-100 shrink-0" />
    </button>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-16 text-center">
      <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--muted)] mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted)] max-w-md mx-auto mb-6">
        {body}
      </p>
      {action}
    </div>
  );
}

