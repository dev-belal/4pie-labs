"use client";

import {
  BarChart3,
  Eye,
  FileText,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { DashboardData } from "@/lib/admin-data";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeAgo(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

function KpiCard({ label, value, icon: Icon, color, bgColor }: KpiCardProps) {
  return (
    <div className="p-6 glass-morphism rounded-[28px] border-white/5 group hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
          {label}
        </div>
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-4xl font-display font-bold">{value}</div>
    </div>
  );
}

export function OverviewPanel({ data }: { data: DashboardData }) {
  const avgViews =
    data.totalBlogs > 0
      ? Math.round(data.totalViews / data.totalBlogs).toLocaleString()
      : "0";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard
          label="Total Page Views"
          value={data.totalViews.toLocaleString()}
          icon={Eye}
          color="text-blue-400"
          bgColor="bg-blue-400/10"
        />
        <KpiCard
          label="Published Articles"
          value={data.totalBlogs.toString()}
          icon={FileText}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <KpiCard
          label="Live Testimonials"
          value={data.totalTestimonials.toString()}
          icon={Users}
          color="text-amber-400"
          bgColor="bg-amber-400/10"
        />
        <KpiCard
          label="Avg. Views / Article"
          value={avgViews}
          icon={TrendingUp}
          color="text-emerald-400"
          bgColor="bg-emerald-400/10"
        />
      </div>

      <div className="glass-morphism rounded-[32px] border-white/5 overflow-hidden">
        <div className="p-8 pb-4 flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-display font-bold">
            Per-Article Performance
          </h3>
        </div>

        {data.blogStats.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">
            No blog data yet. Publish your first article!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-8 py-4">
                    Article
                  </th>
                  <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 py-4">
                    Category
                  </th>
                  <th className="text-right text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 py-4">
                    Views
                  </th>
                  <th className="text-right text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-8 py-4">
                    Published
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.blogStats.map((blog) => (
                  <tr
                    key={blog.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="font-bold text-sm max-w-xs truncate">
                        {blog.title}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full bg-white/5 text-white/50">
                        {blog.category}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Eye className="w-3.5 h-3.5 text-white/20" />
                        <span className="font-bold text-sm">
                          {(blog.views ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right text-white/40 text-xs">
                      {formatDate(blog.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-morphism rounded-[32px] border-white/5 p-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-display font-bold">Recent Activity</h3>
          <span className="text-[10px] font-bold text-white/20 ml-auto uppercase tracking-widest">
            Live Feed
          </span>
        </div>

        {data.recentEvents.length === 0 ? (
          <div className="text-center text-white/30 text-sm py-4">
            No activity recorded yet. Views will appear here once visitors read
            your articles.
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {data.recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">
                    {event.metadata?.title ?? event.page_path ?? "event"}
                  </div>
                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                    {event.event_type === "page_view"
                      ? "Article View"
                      : event.event_type}
                    {event.metadata?.category &&
                      ` · ${event.metadata.category}`}
                  </div>
                </div>
                <span className="text-xs text-white/20 font-bold flex-shrink-0">
                  {formatTimeAgo(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
