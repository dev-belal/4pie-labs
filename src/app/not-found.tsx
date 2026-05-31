import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex-1 flex items-center justify-center px-6 py-32 overflow-hidden">
      <span
        aria-hidden
        className="absolute pointer-events-none -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.25), transparent 60%)",
        }}
      />
      <div className="relative z-10 text-center max-w-xl">
        <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">
          404
        </span>
        <h1 className="text-[clamp(40px,6vw,64px)] font-semibold tracking-tight text-foreground mb-5 leading-[1.05] [text-wrap:balance]">
          Page{" "}
          <span className="font-semibold text-primary">not found.</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          The page you&apos;re looking for has moved, been renamed, or never
          existed.
        </p>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3 rounded-lg text-sm font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
        >
          Back home
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </main>
  );
}
