import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/admin-session";
import { getDashboardData } from "@/lib/admin-data";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await readAdminSession();
  if (!session) redirect("/admin/login");

  const data = await getDashboardData();

  return <AdminShell data={data} userEmail={session.sub} />;
}
