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
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md glass-morphism rounded-[40px] border-white/5 p-10 relative z-10 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-white/40 text-sm">
            Nexus Internal Management System
          </p>
        </div>

        <LoginForm next={next} />

        <Link
          href="/"
          className="block w-full mt-6 text-white/20 hover:text-white/40 text-xs font-bold transition-colors uppercase tracking-[0.2em] text-center"
        >
          Back to Mainframe
        </Link>
      </div>
    </div>
  );
}
