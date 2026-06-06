/**
 * IndexNow client. Pings the IndexNow API so Bing (and the search
 * engines that read from it - Yandex, Seznam, Naver, plus the AI
 * surfaces that re-use Bing's index like ChatGPT search, Copilot, and
 * DuckDuckGo) re-crawl a URL within minutes instead of waiting for the
 * next normal crawl cycle.
 *
 * Ownership verification: IndexNow verifies the submitter by fetching
 * the keyLocation file from the host's root. We serve that file as a
 * static asset from /public, so the file MUST be deployed before the
 * first submission - the API rejects pings until verification succeeds.
 *
 * Host integrity: the API rejects submissions whose `urlList` contains
 * URLs from any host other than the `host` field. We validate that
 * eagerly and throw rather than silently dropping URLs, so a mistake in
 * the caller (passing both www and apex URLs, for example) surfaces in
 * the script log instead of as a quiet 422 response.
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

const INDEXNOW_KEY = "a409674f140d410da075d9c849664ff0";
const INDEXNOW_HOST = "www.fourpielabs.com";
const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;

/**
 * Response classification per the IndexNow spec. `reason` summarizes the
 * HTTP status into a stable machine-readable bucket so callers can branch
 * on intent (e.g. retry on `rate_limited`, alert on `forbidden`) without
 * caring about the raw status integer. `message` is a human-readable
 * sentence describing the bucket - paired with the body the API returned,
 * if any, when it adds detail.
 */
export type IndexNowReason =
  | "success"
  | "accepted"
  | "bad_request"
  | "forbidden"
  | "host_mismatch"
  | "rate_limited"
  | "unknown_error";

export interface IndexNowResult {
  ok: boolean;
  status: number;
  reason?: IndexNowReason;
  message?: string;
}

/**
 * Maps an HTTP status to the spec'd reason bucket and a short
 * human-readable explanation. Returned message is the bucket
 * description; callers append the API's response body separately so
 * the bucket stays stable while the detail is whatever IndexNow sent
 * this time.
 */
function classify(
  status: number,
): { reason: IndexNowReason; message: string } {
  switch (status) {
    case 200:
      return { reason: "success", message: "URLs submitted successfully." };
    case 202:
      return {
        reason: "accepted",
        message:
          "Accepted; IndexNow is still verifying the key file before processing.",
      };
    case 400:
      return {
        reason: "bad_request",
        message: "Invalid request format (malformed JSON, missing fields).",
      };
    case 403:
      return {
        reason: "forbidden",
        message:
          "Key file not found, or its contents don't match the submitted key.",
      };
    case 422:
      return {
        reason: "host_mismatch",
        message:
          "URLs don't belong to the declared host, or key/schema mismatch.",
      };
    case 429:
      return {
        reason: "rate_limited",
        message: "Too many requests; back off and retry later.",
      };
    default:
      return {
        reason: "unknown_error",
        message: `Unexpected HTTP status ${status}.`,
      };
  }
}

/**
 * Submit a batch of URLs to IndexNow. All URLs must use the
 * canonical host (www.fourpielabs.com); a mismatch throws, because
 * IndexNow refuses mixed-host batches and we'd rather catch the bug
 * here than read a confusing 422 later.
 *
 * Returns ok=true on 200 / 202 (the spec uses both:
 *   200 = URLs accepted for processing,
 *   202 = accepted but key verification still in progress).
 * Any other status surfaces as ok=false with the classified `reason`
 * and a `message` that combines our bucket description with whatever
 * body the API returned (if anything).
 */
export async function submitToIndexNow(
  urls: string[],
): Promise<IndexNowResult> {
  if (urls.length === 0) {
    throw new Error("submitToIndexNow: urlList is empty");
  }

  // Eager host validation. URL constructor throws on invalid input -
  // we let that bubble too, because a malformed URL in the batch
  // means a bug upstream worth surfacing loudly.
  for (const u of urls) {
    const parsed = new URL(u);
    if (parsed.host !== INDEXNOW_HOST) {
      throw new Error(
        `submitToIndexNow: every URL must use host "${INDEXNOW_HOST}" - got "${parsed.host}" in "${u}"`,
      );
    }
  }

  const body = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls,
  };

  let res: Response;
  try {
    res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      // Spec requires the explicit charset parameter. Some intermediaries
      // and the IndexNow validator will reject a bare "application/json".
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const message = `Network error: ${detail}`;
    console.error(`[indexnow] ${message}`);
    return { ok: false, status: 0, reason: "unknown_error", message };
  }

  const { reason, message: baseMessage } = classify(res.status);

  if (reason === "success" || reason === "accepted") {
    console.log(
      `[indexnow] ${reason} (HTTP ${res.status}) - submitted ${urls.length} URL(s)`,
    );
    return { ok: true, status: res.status, reason, message: baseMessage };
  }

  // Try to surface the API's body when present. IndexNow returns plain
  // text or JSON depending on the error class; whichever it is, we
  // append it to the bucket message so the log has the original detail
  // alongside our human-readable explanation.
  let body_text = "";
  try {
    body_text = (await res.text()).trim();
  } catch {
    // body unreadable - status + bucket message has to be enough
  }
  const message = body_text
    ? `${baseMessage} ${res.statusText}: ${body_text}`
    : `${baseMessage} ${res.statusText}`;

  console.error(`[indexnow] ${reason} (HTTP ${res.status}) - ${message}`);
  return { ok: false, status: res.status, reason, message };
}
