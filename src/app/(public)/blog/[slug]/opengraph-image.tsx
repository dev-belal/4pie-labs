import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";
import { SITE } from "@/lib/site";

export const alt = "4Pie Labs blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post?.title ?? SITE.name;
  const category = post?.category ?? "INSIGHTS";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #1a0a2e 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            4
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: -0.5,
              color: "#ffffff",
            }}
          >
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#8b5cf6",
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1,
              color: "#ffffff",
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <div>AI Automation · Design · Marketing</div>
          <div style={{ color: "#8b5cf6", fontWeight: 700 }}>
            4pielabs.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
