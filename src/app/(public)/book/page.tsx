import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Strategy Call",
  description:
    "Pick a 30-minute slot to talk about how 4Pie Labs can automate your operations.",
  alternates: { canonical: "/book" },
};

export const dynamic = "force-dynamic";

// Minimal diagnostic page — BookingFlow is temporarily removed to isolate
// which part of the /book tree is crashing on Vercel. If this renders,
// the bug is inside BookingFlow (or its transitive imports). If this
// still 500s, the bug is higher up in the (public) layout chain.
export default function BookPage() {
  return (
    <main className="relative min-h-screen pt-32 pb-24 flex items-center justify-center">
      <div className="hero-glow" />
      <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4 [text-wrap:balance]">
          Booking page — diagnostic mode
        </h1>
        <p className="text-white/60">
          If you see this, the page itself renders fine. The booking UI
          will be re-enabled in the next deploy.
        </p>
      </div>
    </main>
  );
}
