"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin-session";
import {
  pipelineNameSchema,
  reorderStagesSchema,
  stageKindSchema,
  stageNameSchema,
  uuidSchema,
  type StageKind,
} from "@/lib/schemas";

/**
 * Server actions for pipelines + stages (Phase 2).
 *
 * All actions:
 *   - gate on readAdminSession() via requireAdminSession()
 *   - use the service-role client (the new tables are RLS-no-policy)
 *   - validate input with Zod
 *   - revalidate /admin so the next render reads fresh data
 *
 * Return shape is the same {ok: true, ...} / {ok: false, error} pattern the
 * existing imperative admin actions (updateLeadStatus, etc.) use — this is
 * NOT a useActionState form action, so we keep the call site simple.
 */

type Err = { ok: false; error: string };
// Bare success (no extra payload) — used by rename/archive/reorder/delete.
type Plain = { ok: true } | Err;
// Success carries an extra payload — used by createPipeline / addStage.
type WithPayload<T> = ({ ok: true } & T) | Err;

async function adminClient() {
  await requireAdminSession();
  return createServiceClient();
}

function authError(): Err {
  return { ok: false, error: "You must be signed in." };
}

// Postgres FK violation; emitted when on-delete-restrict refuses the delete.
const FK_VIOLATION = "23503";

/* ------------------------------------------------------------------ */
/*  Pipelines                                                         */
/* ------------------------------------------------------------------ */

export async function createPipeline(
  rawName: string,
): Promise<WithPayload<{ id: string }>> {
  const parsed = pipelineNameSchema.safeParse(rawName);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  // Append to the end. Always non-archived, so a single max query is enough.
  const { data: tail } = await supabase
    .from("pipelines")
    .select("sort_order")
    .is("archived_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (tail?.sort_order ?? -1) + 1;

  const { data: created, error: insertErr } = await supabase
    .from("pipelines")
    .insert({ name: parsed.data, sort_order: nextOrder })
    .select("id")
    .single();

  if (insertErr || !created) {
    return { ok: false, error: insertErr?.message ?? "Could not create pipeline" };
  }

  // Seed the design's four-stage default. Won is marked as the won kind so
  // status math works out of the box; admin can rename/reorder freely.
  const stagesSeed = [
    { name: "New Lead", kind: "open" as const, sort_order: 0 },
    { name: "Qualified", kind: "open" as const, sort_order: 1 },
    { name: "Proposal", kind: "open" as const, sort_order: 2 },
    { name: "Won", kind: "won" as const, sort_order: 3 },
  ].map((s) => ({ ...s, pipeline_id: created.id }));

  const { error: stagesErr } = await supabase
    .from("pipeline_stages")
    .insert(stagesSeed);

  if (stagesErr) {
    // Roll back the pipeline so the user is not left with a stageless ghost.
    await supabase.from("pipelines").delete().eq("id", created.id);
    return { ok: false, error: stagesErr.message };
  }

  revalidatePath("/admin");
  return { ok: true, id: created.id as string };
}

export async function renamePipeline(
  id: string,
  rawName: string,
): Promise<Plain> {
  const idParse = uuidSchema.safeParse(id);
  if (!idParse.success) return { ok: false, error: "Invalid pipeline id" };
  const nameParse = pipelineNameSchema.safeParse(rawName);
  if (!nameParse.success) {
    return { ok: false, error: nameParse.error.issues[0]?.message ?? "Invalid name" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { error } = await supabase
    .from("pipelines")
    .update({ name: nameParse.data })
    .eq("id", idParse.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Soft delete via archived_at. Hard delete would cascade to stages
 * (and would be blocked by opportunities once Phase 3 lands), and we
 * want history to survive.
 */
export async function archivePipeline(id: string): Promise<Plain> {
  const idParse = uuidSchema.safeParse(id);
  if (!idParse.success) return { ok: false, error: "Invalid pipeline id" };

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { error } = await supabase
    .from("pipelines")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", idParse.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Stages                                                            */
/* ------------------------------------------------------------------ */

export async function addStage(
  pipelineId: string,
  rawName: string,
): Promise<WithPayload<{ id: string }>> {
  const idParse = uuidSchema.safeParse(pipelineId);
  if (!idParse.success) return { ok: false, error: "Invalid pipeline id" };
  const nameParse = stageNameSchema.safeParse(rawName);
  if (!nameParse.success) {
    return { ok: false, error: nameParse.error.issues[0]?.message ?? "Invalid name" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  // Append at the end of this pipeline's stages.
  const { data: tail } = await supabase
    .from("pipeline_stages")
    .select("sort_order")
    .eq("pipeline_id", idParse.data)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (tail?.sort_order ?? -1) + 1;

  const { data: created, error } = await supabase
    .from("pipeline_stages")
    .insert({
      pipeline_id: idParse.data,
      name: nameParse.data,
      kind: "open",
      sort_order: nextOrder,
    })
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not add stage" };
  }

  revalidatePath("/admin");
  return { ok: true, id: created.id as string };
}

export async function renameStage(
  id: string,
  rawName: string,
): Promise<Plain> {
  const idParse = uuidSchema.safeParse(id);
  if (!idParse.success) return { ok: false, error: "Invalid stage id" };
  const nameParse = stageNameSchema.safeParse(rawName);
  if (!nameParse.success) {
    return { ok: false, error: nameParse.error.issues[0]?.message ?? "Invalid name" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { error } = await supabase
    .from("pipeline_stages")
    .update({ name: nameParse.data })
    .eq("id", idParse.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function setStageKind(
  id: string,
  kind: StageKind,
): Promise<Plain> {
  const idParse = uuidSchema.safeParse(id);
  if (!idParse.success) return { ok: false, error: "Invalid stage id" };
  const kindParse = stageKindSchema.safeParse(kind);
  if (!kindParse.success) return { ok: false, error: "Invalid stage kind" };

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { error } = await supabase
    .from("pipeline_stages")
    .update({ kind: kindParse.data })
    .eq("id", idParse.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Delete a stage. Refuses if:
 *   1. it would drop the pipeline below 2 stages
 *   2. opportunities reference it (FK ON DELETE RESTRICT). No opportunities
 *      exist yet but Phase 3 will add them; handled now so the message is
 *      friendly when it eventually fires.
 */
export async function deleteStage(id: string): Promise<Plain> {
  const idParse = uuidSchema.safeParse(id);
  if (!idParse.success) return { ok: false, error: "Invalid stage id" };

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { data: stage, error: lookupErr } = await supabase
    .from("pipeline_stages")
    .select("pipeline_id")
    .eq("id", idParse.data)
    .maybeSingle();
  if (lookupErr) return { ok: false, error: lookupErr.message };
  if (!stage) return { ok: false, error: "Stage not found" };

  const { count, error: countErr } = await supabase
    .from("pipeline_stages")
    .select("*", { count: "exact", head: true })
    .eq("pipeline_id", stage.pipeline_id);
  if (countErr) return { ok: false, error: countErr.message };

  if ((count ?? 0) <= 2) {
    return {
      ok: false,
      error: "A pipeline needs at least 2 stages. Add a new stage before removing this one.",
    };
  }

  const { error } = await supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", idParse.data);
  if (error) {
    if (error.code === FK_VIOLATION) {
      return {
        ok: false,
        error: "Move this stage's opportunities to another stage first.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Persist a full new column order for one pipeline. We accept the entire
 * array of ids (not a diff) so the caller can drop-replace without computing
 * deltas. The server verifies the id set matches the pipeline's stages
 * exactly — guards against passing a stage id that belongs to a different
 * pipeline.
 */
export async function reorderStages(
  pipelineId: string,
  orderedStageIds: string[],
): Promise<Plain> {
  const parsed = reorderStagesSchema.safeParse({ pipelineId, orderedStageIds });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order" };
  }

  let supabase;
  try {
    supabase = await adminClient();
  } catch {
    return authError();
  }

  const { data: existing, error: lookupErr } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("pipeline_id", parsed.data.pipelineId);
  if (lookupErr) return { ok: false, error: lookupErr.message };

  const existingSet = new Set((existing ?? []).map((s) => s.id as string));
  const incomingSet = new Set(parsed.data.orderedStageIds);
  if (
    existingSet.size !== incomingSet.size ||
    [...existingSet].some((id) => !incomingSet.has(id))
  ) {
    return { ok: false, error: "Stage set does not match this pipeline" };
  }

  // Sequential updates: with <40 stages per pipeline this is negligible,
  // and avoids the upsert-needs-all-NOT-NULL-columns dance. No unique
  // index on (pipeline_id, sort_order), so intermediate collisions are fine.
  for (let i = 0; i < parsed.data.orderedStageIds.length; i++) {
    const stageId = parsed.data.orderedStageIds[i];
    const { error } = await supabase
      .from("pipeline_stages")
      .update({ sort_order: i })
      .eq("id", stageId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
