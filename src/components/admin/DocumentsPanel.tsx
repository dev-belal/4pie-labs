"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { deleteClientDocument } from "@/lib/document-actions";
import {
  DOC_TYPE_LABELS,
  type ClientDocumentRow,
  type DocType,
} from "@/lib/documents/types";
import { WelcomePackEditor } from "./WelcomePackEditor";
import { AgreementEditor } from "./AgreementEditor";
import { ConfirmModal } from "./ConfirmModal";

/**
 * Top-level Documents tab. Two sub-tabs (welcome_pack /
 * client_agreement) that each show a list of their own doc_type
 * plus a "New" entry point into the relevant editor.
 *
 * Owns:
 *   - sub-tab state (DocType)
 *   - mode state (list | create | edit { row })
 *   - delete-confirm modal target
 *
 * Delegates:
 *   - the row form + preview to {WelcomePack,Agreement}Editor
 *   - confirm UX to <ConfirmModal>
 *   - DB writes to document-actions (already imported there)
 *
 * Search: the AdminShell wires its topbar search into the panel
 * via globalSearch; we filter by client_name (case-insensitive
 * contains).
 */
type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; row: ClientDocumentRow };

export function DocumentsPanel({
  documents,
  globalSearch,
}: {
  documents: ClientDocumentRow[];
  globalSearch?: string;
}) {
  const [docType, setDocType] = useState<DocType>("welcome_pack");
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [confirming, setConfirming] = useState<ClientDocumentRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const router = useRouter();

  const search = (globalSearch ?? "").trim().toLowerCase();
  const filtered = useMemo(() => {
    const byType = documents.filter((d) => d.doc_type === docType);
    if (!search) return byType;
    return byType.filter((d) =>
      d.client_name.toLowerCase().includes(search),
    );
  }, [documents, docType, search]);

  // Re-show the list AFTER a save so the row appears with the
  // latest updated_at. The editor calls onSaved with the new id;
  // we router.refresh() to pull the new fetch and switch back.
  const handleSaved = () => {
    startTransition(() => router.refresh());
    setMode({ kind: "list" });
  };

  const runDelete = (row: ClientDocumentRow) => {
    startTransition(async () => {
      const res = await deleteClientDocument(row.id);
      setConfirming(null);
      if (!res.ok) {
        setNotice({ type: "error", message: res.error });
      } else {
        setNotice({
          type: "success",
          message: `Deleted "${row.client_name}".`,
        });
      }
      window.setTimeout(() => setNotice(null), 3500);
    });
  };

  if (mode.kind === "create") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMode({ kind: "list" })}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {DOC_TYPE_LABELS[docType]}s
        </button>
        {docType === "welcome_pack" ? (
          <WelcomePackEditor
            onSaved={handleSaved}
            onCancel={() => setMode({ kind: "list" })}
          />
        ) : (
          <AgreementEditor
            onSaved={handleSaved}
            onCancel={() => setMode({ kind: "list" })}
          />
        )}
      </div>
    );
  }

  if (mode.kind === "edit") {
    const initial = {
      id: mode.row.id,
      client_name: mode.row.client_name,
      field_values: mode.row.field_values,
    };
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMode({ kind: "list" })}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {DOC_TYPE_LABELS[mode.row.doc_type]}s
        </button>
        {mode.row.doc_type === "welcome_pack" ? (
          <WelcomePackEditor
            initial={initial}
            onSaved={handleSaved}
            onCancel={() => setMode({ kind: "list" })}
          />
        ) : (
          <AgreementEditor
            initial={initial}
            onSaved={handleSaved}
            onCancel={() => setMode({ kind: "list" })}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sub-tab strip: welcome_pack | client_agreement. A third
          tab will land later for the onboarding form. */}
      <div className="flex items-center gap-2 border-b border-[var(--border)]">
        <SubTab
          active={docType === "welcome_pack"}
          onClick={() => setDocType("welcome_pack")}
          label="Welcome Pack"
        />
        <SubTab
          active={docType === "client_agreement"}
          onClick={() => setDocType("client_agreement")}
          label="Client Agreement"
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm text-[var(--muted)]">
          <span className="font-semibold text-[var(--fg)]">
            {filtered.length}
          </span>{" "}
          {DOC_TYPE_LABELS[docType].toLowerCase()}
          {filtered.length === 1 ? "" : "s"}
          {search && (
            <span className="ml-2 text-xs">
              matching <span className="font-mono">{`"${search}"`}</span>
            </span>
          )}
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setMode({ kind: "create" })}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New {DOC_TYPE_LABELS[docType]}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-[var(--muted)]">
            <FileText className="w-8 h-8 mx-auto mb-3 text-[var(--muted)]/60" />
            {search
              ? "No documents match this search."
              : `No ${DOC_TYPE_LABELS[docType].toLowerCase()}s yet.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-3 py-3">Updated</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-[var(--fg)] truncate max-w-xs">
                        {row.client_name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)] tabular-nums whitespace-nowrap">
                      {formatRelative(row.updated_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setMode({ kind: "edit", row })
                          }
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <a
                          href={`/admin/documents/${row.id}/export`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--fg)] hover:bg-[var(--surface-hover)]"
                        >
                          <Download className="w-3 h-3" />
                          Export
                        </a>
                        <button
                          type="button"
                          onClick={() => setConfirming(row)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium text-white ${
            notice.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {notice.message}
        </div>
      )}

      <ConfirmModal
        open={confirming !== null}
        title="Delete this document?"
        message={
          confirming ? (
            <>
              <span className="font-semibold text-[var(--fg)]">
                {confirming.client_name}
              </span>{" "}
              ({DOC_TYPE_LABELS[confirming.doc_type]}) will be removed. The
              saved field values can&apos;t be recovered.
            </>
          ) : (
            ""
          )
        }
        warning="This can't be undone."
        confirmLabel="Delete document"
        pendingLabel="Deleting…"
        variant="destructive"
        busy={isPending}
        onConfirm={() => confirming && runDelete(confirming)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

function SubTab({
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
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "text-[var(--fg)] border-primary"
          : "text-[var(--muted)] border-transparent hover:text-[var(--fg)]"
      }`}
    >
      {label}
    </button>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
