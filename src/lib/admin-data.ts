import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface BlogStat {
  id: string;
  slug: string;
  title: string;
  category: string;
  views: number;
  created_at: string;
}

export interface MetricEvent {
  id: string;
  event_type: string;
  page_path: string | null;
  metadata: { title?: string; category?: string } | null;
  created_at: string;
}

export interface DashboardData {
  totalViews: number;
  totalBlogs: number;
  totalTestimonials: number;
  blogStats: BlogStat[];
  recentEvents: MetricEvent[];
}

export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const supabase = await createClient();

  const [{ data: blogs }, { count: testCount }, { data: events }] =
    await Promise.all([
      supabase
        .from("blogs")
        .select("id, slug, title, category, views, created_at")
        .order("views", { ascending: false }),
      supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("metrics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const blogStats = (blogs ?? []) as BlogStat[];
  const totalViews = blogStats.reduce((sum, b) => sum + (b.views ?? 0), 0);

  return {
    totalViews,
    totalBlogs: blogStats.length,
    totalTestimonials: testCount ?? 0,
    blogStats,
    recentEvents: (events ?? []) as MetricEvent[],
  };
});
