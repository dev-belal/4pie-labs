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

export type IndexNowResult =
  | { ok: true; status: number }
  | { ok: false; status: number; error: string };

/**
 * Submit a batch of URLs to IndexNow. All URLs must use the
 * canonical host (www.fourpielabs.com); a mismatch throws, because
 * IndexNow refuses mixed-host batches and we'd rather catch the bug
 * here than read a confusing 422 later.
 *
 * Returns { ok: true } on 200 / 202 (the spec uses both:
 *   200 = URLs accepted for processing,
 *   202 = accepted but key verification still in progress).
 * Any other status surfaces as { ok: false } with the raw status code
 * and a short error message.
 */
export async function submitToIndexNow(
  urls: string[],
): Promise<{ ok: boolean; status: number; error?: string }> {
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
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[indexnow] network error: ${message}`);
    return { ok: false, status: 0, error: message };
  }

  if (res.status === 200 || res.status === 202) {
    console.log(
      `[indexnow] ok ${res.status} - submitted ${urls.length} URL(s)`,
    );
    return { ok: true, status: res.status };
  }

  // Try to surface the API's text body when present. IndexNow returns
  // plain text or JSON depending on the error class; we just log whatever
  // they send so debugging from the script output is enough.
  let detail = "";
  try {
    detail = (await res.text()).trim();
  } catch {
    // body unreadable - status alone has to be enough
  }
  const error = detail ? `${res.statusText}: ${detail}` : res.statusText;
  console.error(`[indexnow] failed ${res.status} - ${error}`);
  return { ok: false, status: res.status, error };
}
