"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Plus, X } from "lucide-react";
import type { Lead, PipelineWithStages } from "@/lib/admin-data";

/**
 * Parse a usable dollar amount out of a lead's payload, in priority order:
 *   1. monthlyBudget    — e.g. "$2,500 - $3,500", "5000", "1500/mo"
 *   2. recommendedBudget — output of the ROI calculator (often a plain number)
 *   3. monthlyRevenue   — the user's stated monthly revenue
 * Returns 0 (= "no auto-fill") when nothing parseable found.
 */
function parseValueFromPayload(payload: Record<string, unknown>): number {
  const keys = ["monthlyBudget", "recommendedBudget", "monthlyRevenue"];
  for (const k of keys) {
    const v = payload?.[k];
    if (v == null) continue;
    const s = typeof v === "string" ? v : String(v);
    // Strip currency / commas / hyphens / en-dashes / m+per+suffix words;
    // take the FIRST numeric token.
    const tokens = s.replace(/[^0-9.\s–-]/g, " ").split(/[\s,–\-]+/);
    for (const t of tokens) {
      if (!t) continue;
      const n = parseInt(t, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return 0;
}

export function AddToPipelineModal({
  lead,
  pipelines,
  alreadyInPipeline,
  busy,
  onClose,
  onConfirm,
}: {
  lead: Lead;
  pipelines: PipelineWithStages[];
  alreadyInPipeline: string | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (input: {
    pipelineId: string;
    stageId: string;
    valueCents: number;
  }) => void;
}) {
  const fallbackPipelineId = pipelines[0]?.id ?? "";
  const [pipelineId, setPipelineId] = useState(fallbackPipelineId);
  const pipeline = useMemo(
    () => pipelines.find((p) => p.id === pipelineId) ?? pipelines[0] ?? null,
    [pipelines, pipelineId],
  );

  const fallbackStageId =
    pipeline?.stages.find((s) => s.kind === "open")?.id ??
    pipeline?.stages[0]?.id ??
    "";
  const [stageId, setStageId] = useState(fallbackStageId);
  // When the user switches pipeline, snap the stage to the first stage of
  // the new pipeline. Otherwise the stale stageId from the previous pipeline
  // would fail server-side validation.
  useEffect(() => {
    if (!pipeline) return;
    if (!pipeline.stages.find((s) => s.id === stageId)) {
      const next =
        pipeline.stages.find((s) => s.kind === "open")?.id ??
        pipeline.stages[0]?.id ??
        "";
      setStageId(next);
    }
  }, [pipeline, stageId]);

  const [valueDollars, setValueDollars] = useState(() => {
    const parsed = parseValueFromPayload(lead.payload ?? {});
    return parsed > 0 ? String(parsed) : "";
  });

  const firstFieldRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipeline || !stageId) return;
    const dollars = parseInt(valueDollars || "0", 10);
    const cents = Math.max(0, Math.round(dollars * 100));
    onConfirm({
      pipelineId: pipeline.id,
      stageId,
      valueCents: cents,
    });
  };

  if (pipelines.length === 0) {
    return (
      <ModalScrim onClose={onClose}>
        <div
          className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-4 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold">Add to Pipeline</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[var(--muted)]">
            No pipelines yet. Create one in the Pipelines tab, then come back
            here to promote leads.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            >
              Close
            </button>
          </div>
        </div>
      </ModalScrim>
    );
  }

  return (
    <ModalScrim onClose={onClose}>
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Add to Pipeline</h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              Convert{" "}
              <span className="font-medium text-[var(--fg)]">
                {lead.name ?? lead.email ?? "this lead"}
              </span>{" "}
              into an opportunity.
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

        {alreadyInPipeline && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--accent-softer)] border border-primary/20 text-xs text-[var(--fg)]">
            <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              Already in{" "}
              <span className="font-semibold">{alreadyInPipeline}</span> — add
              anyway?
            </span>
          </div>
        )}

        {/* Pipeline picker */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[var(--muted)]">
            Pipeline
          </span>
          {pipelines.length <= 4 ? (
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
              {pipelines.map((p, i) => (
                <button
                  key={p.id}
                  ref={i === 0 ? firstFieldRef : undefined}
                  type="button"
                  onClick={() => setPipelineId(p.id)}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                    p.id === pipelineId
                      ? "bg-[var(--surface)] text-[var(--fg)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : (
            <select
              ref={(el) => {
                firstFieldRef.current = el as unknown as HTMLButtonElement | null;
              }}
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-primary/50"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Stage picker */}
        {pipeline && (
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[var(--muted)]">
              Stage
            </span>
            <div className="flex flex-wrap gap-1.5">
              {pipeline.stages.map((s) => {
                const active = s.id === stageId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStageId(s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-on-primary"
                        : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {s.name}
                    {s.kind === "won" ? " · won" : s.kind === "lost" ? " · lost" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Value */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[var(--muted)]">
            Deal value{" "}
            <span className="opacity-70">(monthly · USD)</span>
          </span>
          <div className="flex items-center bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg focus-within:border-primary/50 px-3 py-2.5 gap-2">
            <span className="text-[var(--muted)] text-sm">$</span>
            <input
              type="number"
              min={0}
              step={50}
              value={valueDollars}
              onChange={(e) => setValueDollars(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm tabular-nums"
              placeholder="3000"
            />
            <span className="text-[var(--muted)] text-xs">/mo</span>
          </div>
          {valueDollars && (
            <p className="text-xs text-[var(--muted)]">
              Auto-filled from the lead's submitted budget. Edit before saving
              if it's off.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !pipeline || !stageId}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {busy ? (
              "Adding…"
            ) : (
              <>
                <Plus className="w-4 h-4" /> Create Opportunity
              </>
            )}
          </button>
        </div>
      </form>
    </ModalScrim>
  );
}

function ModalScrim({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {children}
    </div>
  );
}

