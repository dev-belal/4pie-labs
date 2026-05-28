import type { Metadata } from "next";
import { Suspense } from "react";
import { ServicesBrowser } from "@/components/ServicesBrowser";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Local SEO, Maps pack, AEO, paid ads, and conversion engineering — the full local-growth catalog for painting contractors, tour operators, and service businesses.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Services — 4Pie Labs",
    description:
      "Local SEO, Maps pack, AEO, paid ads, and conversion engineering — built for local service businesses.",
    url: "/services",
    type: "website",
  },
};

export default function ServicesPage() {
  return (
    <main className="relative pt-12 md:pt-20 pb-24 px-4 overflow-hidden">
      {/* Local depth blobs */}
      <span
        aria-hidden
        className="absolute pointer-events-none -top-24 -left-32 w-[460px] h-[460px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(124,92,255,0.40), transparent 60%)",
        }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none top-[30%] -right-24 w-[380px] h-[380px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,155,124,0.32), transparent 60%)",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 max-w-3xl mx-auto text-center pb-12 md:pb-16">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-5">
          The full local-growth catalog
        </span>
        <h1 className="text-[clamp(36px,5.5vw,56px)] font-semibold leading-[1.05] tracking-tight text-foreground [text-wrap:balance]">
          Everything we run, so you{" "}
          <span className="font-serif italic font-normal text-primary">
            don&apos;t have to.
          </span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
          Local SEO, Google Business Profile, AEO, paid search and social, and
          the conversion path that ties them all to revenue. Pick the engine
          you need, or wrap them in a program and let us run the whole funnel.
        </p>
      </section>

      <section className="relative z-10">
        {/* ServicesBrowser calls useSearchParams() to read ?category=<slug>.
            In Next 16, that hook requires a Suspense boundary so the page
            can still be statically prerendered. */}
        <Suspense fallback={null}>
          <ServicesBrowser />
        </Suspense>
      </section>
    </main>
  );
}
