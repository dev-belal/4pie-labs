import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
    ],
  },
};

export default nextConfig;
