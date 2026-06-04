import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { LeaveReviewForm } from "@/components/LeaveReviewForm";

export const metadata: Metadata = {
  title: "Leave a review",
  description:
    "Share your experience with 4Pie Labs. Reviews are moderated and may appear on the homepage.",
  // Share-by-link utility page, not SEO content. Excluded from sitemap.ts
  // and noindex'd here so search engines don't surface it independently.
  robots: { index: false, follow: false },
};

const POINTS = [
  "Tell us in your own words — what was it like working with us.",
  "Mention specifics (the project, the result, what changed).",
  "If you're willing, a real name + role makes it credible.",
];

export default function LeaveAReviewPage() {
  return (
    <main className="px-4 pb-32">
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center pt-12 pb-10 md:pt-20 md:pb-12">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
          Share your experience
        </span>
        <h1 className="text-[clamp(36px,5vw,52px)] font-semibold leading-[1.1] tracking-tight text-foreground mb-6 [text-wrap:balance]">
          We&apos;d love to{" "}
          <span className="font-semibold text-primary">hear from you.</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-3 [text-wrap:balance]">
          A short review goes a long way. We read every one, edit lightly for
          length, and publish on the homepage after a quick review.
        </p>
        <p className="text-xs text-subtle-foreground">
          Moderated · Usually live within a day · Anonymous-not-an-option (we
          credit you)
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-12 items-start">
        <div className="bg-surface border border-card-border rounded-2xl p-6 md:p-10 lg:sticky lg:top-28">
          <div className="w-10 h-10 rounded-xl bg-primary/15 grid place-items-center mb-5">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-3 tracking-tight">
            A few quick tips
          </h2>
          <ul className="grid gap-3.5">
            {POINTS.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 text-sm text-foreground/90 leading-snug"
              >
                <span
                  aria-hidden
                  className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary"
                />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 pt-7 border-t border-card-border">
            <p className="text-xs text-subtle-foreground leading-relaxed">
              Your review goes to our team for a quick read first. If it&apos;s
              a fit for the homepage, it&apos;ll appear shortly with your
              name and role.
            </p>
          </div>
        </div>

        <LeaveReviewForm />
      </section>
    </main>
  );
}
