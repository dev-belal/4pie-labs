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
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
