import type { Metadata } from "next";
import { BookingFlow } from "@/components/BookingFlow";

export const metadata: Metadata = {
  title: "Book a Strategy Call",
  description:
    "Book a free 30-minute strategy call with 4Pie Labs. No pitch deck, no pressure. You leave with a clear plan for your local business.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a strategy call - 4Pie Labs",
    description:
      "30-min discovery call. No pitch deck. You leave with a plan.",
    url: "/book",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <main className="relative min-h-screen pt-20 md:pt-24 pb-24 overflow-hidden">
      <span
        aria-hidden
        className="absolute pointer-events-none -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.22), transparent 60%)",
        }}
      />
      <div className="relative z-10">
        <BookingFlow />
      </div>
    </main>
  );
}
