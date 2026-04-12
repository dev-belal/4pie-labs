import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex-1 flex items-center justify-center px-6 py-32 noise-bg">
      <div className="hero-glow" aria-hidden />
      <div className="relative z-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-4">
          404
        </p>
        <h1 className="text-5xl md:text-7xl font-semibold mb-6">
          <span className="text-gradient">Page not found</span>
        </h1>
        <p className="text-white/60 max-w-md mx-auto mb-8">
          The page you&apos;re looking for has moved, been renamed, or never
          existed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-transform"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
