import type { Metadata } from "next";
import { BookingFlow } from "@/components/BookingFlow";

export const metadata: Metadata = {
  title: "Book a Strategy Call",
  description:
    "Pick a 30-minute slot to talk about how 4Pie Labs can automate your operations. Calendar invite + Google Meet link sent automatically.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a strategy call — 4Pie Labs",
    description:
      "Pick a 30-minute slot to talk about your AI automation roadmap.",
    url: "/book",
    type: "website",
  },
};

// Slots are visitor-timezone-specific, so the page itself is dynamic.
export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <main className="relative min-h-screen pt-32 pb-24">
      <div className="hero-glow" />
      <div className="relative z-10">
        <BookingFlow />
      </div>
    </main>
  );
}
