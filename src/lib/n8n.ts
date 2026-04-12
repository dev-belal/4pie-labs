import { createHmac } from "node:crypto";

/**
 * Shared helper that POSTs a JSON payload to an n8n webhook.
 * - Optionally signs the request with HMAC-SHA256 of the body when
 *   `N8N_WEBHOOK_SECRET` is set.
 * - Never exposes the webhook URL to the client.
 */
export async function postToN8N(
  url: string | undefined,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; data?: unknown; status?: number }> {
  if (!url) return { ok: false, status: 500 };

  const body = JSON.stringify({ ...payload, timestamp: new Date().toISOString() });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (secret) {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    headers["X-Webhook-Signature"] = signature;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await response.json().catch(() => ({}));
    return { ok: true, data, status: response.status };
  } catch (err) {
    console.error("n8n POST error:", err);
    return { ok: false, status: 502 };
  }
}

/** Extract best-effort client IP from request headers. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
