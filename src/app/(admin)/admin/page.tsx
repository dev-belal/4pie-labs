import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/admin-session";
import {
  getAllOpportunities,
  getAllTestimonialsForAdmin,
  getAppointments,
  getDashboardData,
  getPipelinesWithStages,
} from "@/lib/admin-data";
import {
  getRecentNotifications,
  getUnreadCounts,
} from "@/lib/notification-actions";
import { getAllPosts } from "@/lib/blog";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await readAdminSession();
  if (!session) redirect("/admin/login");

  // Calendar window: ~90 days back, ~90 days forward. The CalendarPanel
  // filters per cursor month within this. Tight enough to keep the initial
  // payload small; wide enough that month-paging across this period needs
  // no extra round-trip.
  const now = new Date();
  const apptWindowStart = new Date(now.getTime() - 90 * 86_400_000)
    .toISOString();
  const apptWindowEnd = new Date(now.getTime() + 90 * 86_400_000)
    .toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    data,
    pipelines,
    opportunities,
    appointments,
    blogs,
    testimonials,
    notifications,
    unreadCounts,
  ] = await Promise.all([
    getDashboardData(),
    getPipelinesWithStages(),
    getAllOpportunities(),
    getAppointments(apptWindowStart, apptWindowEnd),
    // Blogs are read via the same getAllPosts() that powers the public
    // site (Supabase-first, static fallback). Same data path, same
    // ordering (created_at desc). The new BlogsListPanel uses this
    // for the listing + edit-seed.
    getAllPosts(),
    // Testimonials use a separate admin-only fetch via the service-
    // role client so drafts (is_published = false) show up too. The
    // public component uses the anon client and is gated by RLS to
    // published rows only.
    getAllTestimonialsForAdmin(),
    // Notifications + per-kind unread counts (Phase 2). Both reads hit
    // the service-role client; both rely on the notifications_unread_idx
    // partial index for cheap counting.
    getRecentNotifications(20),
    getUnreadCounts(),
  ]);

  return (
    <AdminShell
      data={data}
      pipelines={pipelines}
      opportunities={opportunities}
      appointments={appointments}
      blogs={blogs}
      testimonials={testimonials}
      notifications={notifications}
      unreadCounts={unreadCounts}
      monthStartISO={monthStart}
      userEmail={session.sub}
    />
  );
}
