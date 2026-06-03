import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center border border-primary/20">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[var(--fg)] mb-1">
            Admin Portal
          </h1>
          <p className="text-[var(--muted)] text-sm">
            4Pie Labs internal management
          </p>
        </div>

        <LoginForm next={next} />

        <Link
          href="/"
          className="block w-full mt-5 text-[var(--muted)] hover:text-[var(--fg)] text-xs transition-colors text-center"
        >
          Back to site
        </Link>
      </div>
    </div>
  );
}
