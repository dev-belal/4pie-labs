import { NextResponse } from "next/server";
import { trackViewSchema } from "@/lib/schemas";
import { getPostBySlug, trackBlogView } from "@/lib/blog";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Per-visit blog view tracking. Called once on mount by the client beacon
 * (see `TrackView` in BlogPostClient). Kept off the ISR-cached page render so
 * counts reflect real visits rather than cache regenerations.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  // Loose cap: a single client shouldn't be able to inflate counts in bulk.
  const rl = rateLimit(`track-view:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = trackViewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { slug } = parsed.data;

  // Only count views for posts that actually exist - avoids logging
  // page_view metrics for bogus or probed slugs.
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await trackBlogView(slug, post.title);
  return NextResponse.json({ ok: true });
}
