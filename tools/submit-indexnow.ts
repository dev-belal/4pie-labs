/**
 * Manual IndexNow submitter. Calls the same async function the Next.js
 * sitemap route does, harvests every URL it returns, normalizes each to
 * the canonical www host, and POSTs the batch to IndexNow.
 *
 * Why reuse the sitemap function: it's the production source of truth.
 * When a new blog post is added, the sitemap pulls it from Supabase
 * (with a graceful fallback to the static blog array if env isn't
 * configured) - so this script automatically picks up everything that
 * the next sitemap crawl would surface, no manual list maintenance.
 *
 * Why normalize the host here and not in lib/indexnow.ts: SITE.url is
 * the non-www form right now (a separate task is tracking the canonical
 * fix). lib/indexnow.ts is host-strict on purpose - it should never
 * silently rewrite caller URLs. The normalization belongs at the
 * boundary between sitemap data and the IndexNow client.
 *
 * Run: `npm run submit-indexnow`
 *      (or directly: `npx tsx --env-file=.env.local tools/submit-indexnow.ts`)
 * The env file is optional - the sitemap's blog fetch falls back to the
 * static array when Supabase env is unset, so the script still runs.
 */
import sitemap from "../src/app/sitemap";
import { submitToIndexNow } from "../src/lib/indexnow";

const CANONICAL_HOST = "www.fourpielabs.com";

function toCanonicalHost(input: string): string {
  const u = new URL(input);
  if (u.host !== CANONICAL_HOST) {
    u.host = CANONICAL_HOST;
    u.protocol = "https:";
  }
  return u.toString();
}

async function main(): Promise<void> {
  const entries = await sitemap();
  // Sitemap entries can be { url } or just a URL string in older shapes;
  // App Router types use the object form, but we defensively support both
  // in case the route changes shape later.
  const raw = entries.map((e) =>
    typeof e === "string" ? e : e.url,
  );

  // De-duplicate after normalization - if the sitemap ever yields the
  // same URL under both apex and www forms, IndexNow would treat them
  // as a single submission anyway. Dedupe early so the URL count we
  // print matches what we actually send.
  const normalized = Array.from(new Set(raw.map(toCanonicalHost)));

  console.log(`[submit-indexnow] sitemap yielded ${raw.length} URL(s)`);
  console.log(
    `[submit-indexnow] after host normalization + dedupe: ${normalized.length} URL(s)`,
  );
  for (const url of normalized) console.log(`  - ${url}`);

  const result = await submitToIndexNow(normalized);

  console.log("");
  if (result.ok) {
    console.log(
      `[submit-indexnow] done - HTTP ${result.status} (${result.reason ?? "ok"}), ${normalized.length} URL(s) accepted by IndexNow`,
    );
    if (result.message) console.log(`[submit-indexnow] ${result.message}`);
    return;
  }

  // Failure block prints the classified reason on its own line so the
  // human reading the script output can scan for the bucket without
  // parsing the full message. The raw HTTP status comes along too in
  // case the reason ever needs to be cross-referenced against the spec.
  console.error(`[submit-indexnow] FAILED`);
  console.error(`  status:  HTTP ${result.status}`);
  console.error(`  reason:  ${result.reason ?? "unknown_error"}`);
  console.error(`  message: ${result.message ?? "(no detail)"}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("[submit-indexnow] unexpected error:");
  console.error(err);
  process.exitCode = 1;
});
