import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";

const SITE_URL = SITE.url;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    // Three category landing pages - the ones engineered for AEO with
    // Service + FAQPage + Breadcrumb schemas. High priority so they get
    // crawled and indexed promptly.
    { url: `${SITE_URL}/services/aeo`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/services/ads`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/services/ai`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    // Conversion page (the audit lead form). Highest non-home priority -
    // ranking it well matters as much as the homepage commercially.
    { url: `${SITE_URL}/audit`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    // Tier comparison page. Slightly lower priority because the deeper
    // intent paths are /services/[category].
    { url: `${SITE_URL}/programs`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const posts = await getAllPosts();
  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    // Use the post's actual publish date so a 2025 article doesn't
    // claim "modified today" on every redeploy (a misleading freshness
    // signal that crawlers can down-trust). Prefer the ISO column,
    // fall back to the human-readable `date`, then to build time as a
    // last resort.
    lastModified: postLastModified(post.datePublishedISO, post.date, now),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}

/**
 * Resolve a stable lastModified for a blog post. Both inputs can be
 * absent or malformed; we never throw, just degrade. Capped at `now` so
 * a future-dated post doesn't surface a wrong lastmod to crawlers.
 */
function postLastModified(
  iso: string | null | undefined,
  human: string | null | undefined,
  now: Date,
): Date {
  const candidates: Date[] = [];
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) candidates.push(d);
  }
  if (human) {
    const d = new Date(human);
    if (!Number.isNaN(d.getTime())) candidates.push(d);
  }
  for (const d of candidates) {
    return d.getTime() > now.getTime() ? now : d;
  }
  return now;
}
