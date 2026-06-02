"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin-session";
import {
  createOpportunitySchema,
  moveOpportunitySchema,
  updateOpportunitySchema,
  uuidSchema,
  type CreateOpportunityInput,
  type MoveOpportunityInput,
  type UpdateOpportunityFields,
} from "@/lib/schemas";
import type { OpportunityStatus, StageKind } from "@/lib/admin-data";

/**
 * Server actions for opportunities (Phase 3 — kanban + drag-to-promote).
 *
 * All actions:
 *   - gate on requireAdminSession()
 *   - use the service-role client (opportunities table is RLS-no-policy)
 *   - validate input with Zod
 *   - revalidate /admin
 *
 * Status math: every move re-derives `status` and the win_at/lost_at
 * timestamps from the destination stage's `kind`:
 *   - open  → status='open',  won_at=null,        lost_at=null
 *   - won   → status='won',   won_at=now(),       lost_at=null
 *   - lost  → status='lost',  won_at=null,        lost_at=now()
 * Dragging back from a terminal stage to an open one clears both timestamps.
 */

type Err = { ok: false; error: string };
type Plain = { ok: true } | Err;
type WithPayload<T> = ({ ok: true } & T) | Err;

async function adminClient() {
  await requireAdminSession();
  return createServiceClient();
}

function authError(): Err {
  return { ok: false, error: "You must be signed in." };
}

interface StatusTransition {
  status: OpportunityStatus;
  won_at: string | null;
  lost_at: string | null;
}

function deriveStatus(stageKind: StageKind): StatusTransition {
  const now = new Date().toISOString();
  if (stageKind === "won") return { status: "won", won_at: now, lost_at: null };
  if (stageKind === "lost") return { status: "lost", won_at: null, lost_at: now };
  return { status: "open", won_at: null, lost_at: null };
}

/* ------------------------------------------------------------------ */
/*  Create                                                            */
/* ------------------------------------------------------------------ */

export async function createOpportunity(
  input: CreateOpportunityInput,
): Promise<WithPayload<{ id: string }>> {
  const parsed = createOpportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  // Stage must exist AND belong to the named pipeline — guards against
  // passing a stage id from another pipeline.
  const { data: stage, error: stageErr } = await supabase
    .from("pipeline_stages")
    .select("id, pipeline_id, kind")
    .eq("id", parsed.data.stageId)
    .maybeSingle();
  if (stageErr) return { ok: false, error: stageErr.message };
  if (!stage) return { ok: false, error: "Stage not found" };
  if (stage.pipeline_id !== parsed.data.pipelineId) {
    return { ok: false, error: "Stage does not belong to this pipeline" };
  }

  // Append at the end of the column.
  const { data: tail } = await supabase
    .from("opportunities")
    .select("sort_order")
    .eq("stage_id", parsed.data.stageId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (tail?.sort_order ?? -1) + 1;

  const transition = deriveStatus(stage.kind as StageKind);

  const { data: created, error } = await supabase
    .from("opportunities")
    .insert({
      pipeline_id: parsed.data.pipelineId,
      stage_id: parsed.data.stageId,
      contact_name: parsed.data.contactName,
      business_name: parsed.data.businessName ?? null,
      source: parsed.data.source ?? null,
      value_cents: parsed.data.valueCents,
      sort_order: nextOrder,
      status: transition.status,
      won_at: transition.won_at,
      lost_at: transition.lost_at,
    })
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not create opportunity" };
  }

  revalidatePath("/admin");
  return { ok: true, id: created.id as string };
}

/* ------------------------------------------------------------------ */
/*  Move (drag-to-promote)                                            */
/* ------------------------------------------------------------------ */

/**
 * Move an opportunity to a stage at a position. Re-packs the source AND
 * destination columns' sort_orders so positions stay stable with no
 * collisions. Derives status + won_at/lost_at from the destination stage's
 * kind.
 */
export async function moveOpportunity(
  input: MoveOpportunityInput,
): Promise<Plain> {
  const parsed = moveOpportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { oppId, stageId, sortOrder } = parsed.data;

  const { data: opp, error: oppErr } = await supabase
    .from("opportunities")
    .select("id, pipeline_id, stage_id")
    .eq("id", oppId)
    .maybeSingle();
  if (oppErr) return { ok: false, error: oppErr.message };
  if (!opp) return { ok: false, error: "Opportunity not found" };

  const { data: stage, error: stageErr } = await supabase
    .from("pipeline_stages")
    .select("id, pipeline_id, kind")
    .eq("id", stageId)
    .maybeSingle();
  if (stageErr) return { ok: false, error: stageErr.message };
  if (!stage) return { ok: false, error: "Stage not found" };
  if (stage.pipeline_id !== opp.pipeline_id) {
    return {
      ok: false,
      error: "Destination stage is on a different pipeline",
    };
  }

  const transition = deriveStatus(stage.kind as StageKind);

  // Build the new destination column. Pull current opps (excluding the
  // moving one), insert at the clamped target index, re-pack sort_order.
  const { data: destRows, error: destErr } = await supabase
    .from("opportunities")
    .select("id, sort_order")
    .eq("stage_id", stageId)
    .neq("id", oppId)
    .order("sort_order", { ascending: true });
  if (destErr) return { ok: false, error: destErr.message };

  const destOrdered = (destRows ?? []) as { id: string; sort_order: number }[];
  const target = Math.max(0, Math.min(sortOrder, destOrdered.length));
  destOrdered.splice(target, 0, { id: oppId, sort_order: target });

  // Update the moving opp's stage/status/sort_order in one shot.
  const { error: moveErr } = await supabase
    .from("opportunities")
    .update({
      stage_id: stageId,
      sort_order: target,
      status: transition.status,
      won_at: transition.won_at,
      lost_at: transition.lost_at,
    })
    .eq("id", oppId);
  if (moveErr) return { ok: false, error: moveErr.message };

  // Re-pack any neighbours in the destination whose index changed.
  for (let i = 0; i < destOrdered.length; i++) {
    const row = destOrdered[i];
    if (row.id === oppId) continue;
    if (row.sort_order === i) continue;
    const { error } = await supabase
      .from("opportunities")
      .update({ sort_order: i })
      .eq("id", row.id);
    if (error) return { ok: false, error: error.message };
  }

  // Re-pack the source column too (one slot opened up).
  if (opp.stage_id !== stageId) {
    const { data: srcRows, error: srcErr } = await supabase
      .from("opportunities")
      .select("id, sort_order")
      .eq("stage_id", opp.stage_id)
      .order("sort_order", { ascending: true });
    if (srcErr) return { ok: false, error: srcErr.message };
    const srcOrdered = (srcRows ?? []) as {
      id: string;
      sort_order: number;
    }[];
    for (let i = 0; i < srcOrdered.length; i++) {
      const row = srcOrdered[i];
      if (row.sort_order === i) continue;
      const { error } = await supabase
        .from("opportunities")
        .update({ sort_order: i })
        .eq("id", row.id);
      if (error) return { ok: false, error: error.message };
    }
  }

  revalidatePath("/admin");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Update fields                                                     */
/* ------------------------------------------------------------------ */

export async function updateOpportunity(
  oppId: string,
  fields: UpdateOpportunityFields,
): Promise<Plain> {
  const parsed = updateOpportunitySchema.safeParse({ oppId, fields });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  // Map our camelCase field names → DB column names. nullish on businessName,
  // source, notes means "explicitly clear" if null; "leave alone" if omitted.
  const update: Record<string, unknown> = {};
  const f = parsed.data.fields;
  if (f.contactName !== undefined) update.contact_name = f.contactName;
  if (f.businessName !== undefined) update.business_name = f.businessName;
  if (f.source !== undefined) update.source = f.source;
  if (f.valueCents !== undefined) update.value_cents = f.valueCents;
  if (f.notes !== undefined) update.notes = f.notes;

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "No fields to update" };
  }

  const { error } = await supabase
    .from("opportunities")
    .update(update)
    .eq("id", parsed.data.oppId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Delete                                                            */
/* ------------------------------------------------------------------ */

export async function deleteOpportunity(oppId: string): Promise<Plain> {
  const parse = uuidSchema.safeParse(oppId);
  if (!parse.success) return { ok: false, error: "Invalid opportunity id" };

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  // Capture stage_id BEFORE delete so we can re-pack the column afterwards.
  const { data: opp } = await supabase
    .from("opportunities")
    .select("stage_id")
    .eq("id", parse.data)
    .maybeSingle();

  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", parse.data);
  if (error) return { ok: false, error: error.message };

  if (opp?.stage_id) {
    const { data: rows } = await supabase
      .from("opportunities")
      .select("id, sort_order")
      .eq("stage_id", opp.stage_id)
      .order("sort_order", { ascending: true });
    const ordered = (rows ?? []) as { id: string; sort_order: number }[];
    for (let i = 0; i < ordered.length; i++) {
      const row = ordered[i];
      if (row.sort_order === i) continue;
      await supabase
        .from("opportunities")
        .update({ sort_order: i })
        .eq("id", row.id);
    }
  }

  revalidatePath("/admin");
  return { ok: true };
}
