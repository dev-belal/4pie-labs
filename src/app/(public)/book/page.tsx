import type { Metadata } from "next";
import { BookingFlowProbe } from "@/components/BookingFlowProbe";

export const metadata: Metadata = {
  title: "Book a Strategy Call",
  description:
    "Pick a 30-minute slot to talk about how 4Pie Labs can automate your operations.",
  alternates: { canonical: "/book" },
};

export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <main className="relative min-h-screen pt-32 pb-24">
      <div className="hero-glow" />
      <div className="relative z-10">
        <BookingFlowProbe />
      </div>
    </main>
  );
}
