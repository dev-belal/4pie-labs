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
  // Ship the Welcome Pack + Client Agreement .docx templates with the
  // serverless function bundle. Next.js's automatic file tracing finds
  // statically imported files, but our templates are read at runtime
  // via `fs.readFile(path.join(process.cwd(), ...))` - those reads are
  // invisible to the tracer. Without this include, Vercel would
  // deploy the function without the .docx files and the document
  // generation server action would 500 with ENOENT.
  outputFileTracingIncludes: {
    "/admin/**": ["src/lib/documents/templates/*.docx"],
    "/api/**":   ["src/lib/documents/templates/*.docx"],
  },
};

export default nextConfig;
