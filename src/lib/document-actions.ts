"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/admin-session";
import type { DocType } from "@/lib/documents/types";
import { DOC_TYPES } from "@/lib/documents/types";

/**
 * Server actions for the Client Documents admin tab. Mirrors the
 * imperative call shape used by deleteLead / deleteBlog so the
 * caller can branch on `ok` and the typescript narrowing falls out
 * cleanly. All three actions:
 *
 *   - require an admin session (cookie-based; the same gate every
 *     other admin action uses)
 *   - go through the service-role client (the client_documents
 *     table is admin-only via RLS-with-no-policies, so the anon
 *     client wouldn't see anything)
 *   - revalidate /admin so an open list view refreshes without a
 *     hard reload
 *
 * No FormData wrapper here because the form state is too rich
 * (24 fields with auto-fill behaviour) to roundtrip through a
 * <form action> - the editor builds the payload imperatively and
 * calls these via useTransition.
 */

async function requireAdmin() {
  await requireAdminSession();
  return createServiceClient();
}

interface CreateInput {
  doc_type: DocType;
  client_name: string;
  field_values: Record<string, string>;
}

type CreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type MutationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Insert a new document row. Returns the generated id so the
 * editor can pivot from "create" mode into "edit" mode in place
 * after a save, without needing to reload the list.
 */
export async function createClientDocument(
  input: CreateInput,
): Promise<CreateResult> {
  if (!DOC_TYPES.includes(input.doc_type)) {
    return { ok: false, error: "Invalid doc type" };
  }
  if (!input.client_name || input.client_name.trim().length === 0) {
    return { ok: false, error: "Client name is required" };
  }
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("client_documents")
      .insert({
        doc_type: input.doc_type,
        client_name: input.client_name.trim(),
        field_values: input.field_values,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message ?? "Failed to create" };
    }
    revalidatePath("/admin");
    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}

interface UpdateInput {
  id: string;
  client_name: string;
  field_values: Record<string, string>;
}

/**
 * Overwrite the editable columns on an existing row. doc_type is
 * intentionally NOT updatable - a row's doc_type chooses its
 * template at render time and the field shape, so switching it
 * mid-life would orphan the field_values payload against the new
 * template. If a user wants to convert, they create a fresh row.
 *
 * The touch trigger on the table (0012 migration) bumps updated_at
 * automatically; we don't pass it in the update payload.
 */
export async function updateClientDocument(
  input: UpdateInput,
): Promise<MutationResult> {
  if (!input.id) {
    return { ok: false, error: "Missing id" };
  }
  if (!input.client_name || input.client_name.trim().length === 0) {
    return { ok: false, error: "Client name is required" };
  }
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("client_documents")
      .update({
        client_name: input.client_name.trim(),
        field_values: input.field_values,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}

/**
 * Hard delete (no soft-delete column on the table). The ConfirmModal
 * in the panel handles the "are you sure" UX; this action assumes
 * the click was confirmed.
 */
export async function deleteClientDocument(
  id: string,
): Promise<MutationResult> {
  if (!id) return { ok: false, error: "Missing id" };
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("client_documents")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}
