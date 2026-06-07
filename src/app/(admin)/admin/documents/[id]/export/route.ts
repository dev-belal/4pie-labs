import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-session";
import { getClientDocumentById } from "@/lib/admin-data";
import {
  downloadFilenameFor,
  renderClientDocument,
} from "@/lib/documents/render";

/**
 * Binary download endpoint for a generated client document.
 *
 * Route handler instead of a server action because Next.js server
 * actions are JSON-only - they can't return a Response with a
 * .docx body + the Content-Disposition header that triggers the
 * browser's download UX. The handler:
 *
 *   1. Requires an admin session cookie (same gate the rest of
 *      the admin tab uses; 401 -> redirect to login at the UI
 *      layer).
 *   2. Loads the row through the service-role-backed fetcher
 *      (admin-only table; service-role bypasses the RLS-no-
 *      policies posture).
 *   3. Renders the template-of-record for this doc_type via
 *      docxtemplater (deterministic find-and-replace; no LLM).
 *   4. Streams the buffer back with the right Content-Type +
 *      Content-Disposition.
 *
 * 404 if the id doesn't resolve. 500 if the template render
 * blows up (unclosed tag, structural template damage). The error
 * body is intentionally terse - the operator can click again or
 * the browser console shows the response text.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await readAdminSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  const row = await getClientDocumentById(id);
  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = renderClientDocument(row.doc_type, row.field_values);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render failed";
    return new NextResponse(`Render failed: ${message}`, { status: 500 });
  }

  const filename = downloadFilenameFor(row.doc_type, row.client_name);

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buf.length),
      // Always re-render; field_values can change between requests
      // and the file is small enough that caching adds nothing.
      "Cache-Control": "no-store",
    },
  });
}
