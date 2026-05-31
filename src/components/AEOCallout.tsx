import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";

/**
 * Phase 3 AEO wedge callout - the "Answer Engine Optimization" differentiator.
 * Two-column on desktop: copy on the left, a stylized mock of a ChatGPT
 * conversation citing a 4Pie Labs client on the right. PLACEHOLDER content
 * (the client name and stats inside the mock are illustrative until a real
 * showcase replaces them).
 */

const ENGINES = ["ChatGPT", "Perplexity", "Gemini", "AI Overviews"] as const;

export function AEOCallout() {
  return (
    <section className="relative px-4 py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1240px] mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Copy */}
        <div>
          <span
            className="block font-semibold text-[40px] md:text-[56px] leading-none text-primary/30 tracking-tight mb-2"
            aria-hidden
          >
            01
          </span>
          <span className="block text-xs font-medium text-primary tracking-widest uppercase mb-3">
            The wedge · Answer Engine Optimization
          </span>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-semibold tracking-tight text-foreground leading-[1.15] mb-5">
            When someone asks ChatGPT for a painter, your business should be the
            answer.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            63% of buyers research local services through ChatGPT, Perplexity,
            Google AI Overviews, and Gemini before they ever click a website.
            Most agencies aren&apos;t optimizing for this yet. We are.{" "}
            <strong className="text-foreground font-semibold">
              AEO is included in every program tier.
            </strong>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/services#aeo"
              className="inline-flex items-center gap-2 bg-surface hover:bg-surface-2 border border-border text-foreground px-5 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              How AEO works
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/audit"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Audit my visibility →
            </Link>
          </div>
        </div>

        {/* Mock conversation */}
        <div
          className="relative bg-surface border border-card-border rounded-2xl p-6 md:p-8 shadow-[0_8px_24px_rgba(26,26,26,0.06),0_2px_6px_rgba(26,26,26,0.04)]"
          aria-hidden
        >
          {/* Title bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-2 border border-border text-xs font-medium text-foreground">
              <MessageCircle className="w-3.5 h-3.5" />
              ChatGPT
            </div>
            <span className="text-xs text-subtle-foreground">Conversation</span>
          </div>

          {/* Engine pills */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {ENGINES.map((e, i) => (
              <span
                key={e}
                className={
                  i === 0
                    ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-muted text-primary text-[11px] font-medium"
                    : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 text-muted-foreground text-[11px] font-medium border border-border"
                }
              >
                <span
                  className={
                    i === 0
                      ? "w-1.5 h-1.5 rounded-full bg-primary"
                      : "w-1.5 h-1.5 rounded-full bg-subtle-foreground"
                  }
                />
                {e}
              </span>
            ))}
          </div>

          {/* Question */}
          <p className="text-sm font-medium text-foreground bg-surface-2 border border-border rounded-xl px-4 py-3 mb-3 leading-snug">
            &ldquo;Who&apos;s the best painting contractor in Portland for
            high-end residential?&rdquo;
          </p>

          {/* Answer */}
          <p className="text-sm text-foreground/85 leading-relaxed mb-4">
            For high-end residential work in the Portland area,{" "}
            <strong className="text-foreground font-semibold">
              Northpeak Painters
            </strong>{" "}
            is consistently cited for craftsmanship and color consultation. They
            specialize in heritage restoration and modern repaints, with a 4.9
            rating across 280+ Google reviews. Their estimating process is
            digital and includes a no-pressure walkthrough…
          </p>

          {/* Citation source */}
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border w-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            Cited from northpeakpainters.com (a 4Pie Labs client)
          </div>
        </div>
      </div>
    </section>
  );
}
