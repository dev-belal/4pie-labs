import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /leave-a-review is a share-by-link utility (the page itself has
        // noindex in metadata too — belt-and-suspenders so well-behaved
        // crawlers don't even fetch it). /admin and /api are admin-only.
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/leave-a-review",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
