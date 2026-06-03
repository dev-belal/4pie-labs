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
    <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-[var(--muted)]">{label}</div>
        <div
          className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export function OverviewPanel({ data }: { data: DashboardData }) {
  const avgViews =
    data.totalBlogs > 0
      ? Math.round(data.totalViews / data.totalBlogs).toLocaleString()
      : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
          bgColor="bg-[var(--accent-softer)]"
        />
        <KpiCard
          label="Live Testimonials"
          value={data.totalTestimonials.toString()}
          icon={Users}
          color="text-primary"
          bgColor="bg-[var(--accent-softer)]"
        />
        <KpiCard
          label="Avg. Views / Article"
          value={avgViews}
          icon={TrendingUp}
          color="text-emerald-400"
          bgColor="bg-emerald-400/10"
        />
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="p-5 pb-3 flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Per-Article Performance</h3>
        </div>

        {data.blogStats.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)] text-sm">
            No blog data yet. Publish your first article.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-[var(--border)]">
                  <th className="text-left text-xs font-medium text-[var(--muted)] px-5 py-3">
                    Article
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--muted)] px-3 py-3">
                    Category
                  </th>
                  <th className="text-right text-xs font-medium text-[var(--muted)] px-3 py-3">
                    Views
                  </th>
                  <th className="text-right text-xs font-medium text-[var(--muted)] px-5 py-3">
                    Published
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.blogStats.map((blog) => (
                  <tr
                    key={blog.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-sm max-w-xs truncate">
                        {blog.title}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--surface-hover)] text-[var(--muted)]">
                        {blog.category}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Eye className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span className="font-medium text-sm tabular-nums">
                          {(blog.views ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[var(--muted)] text-xs tabular-nums">
                      {formatDate(blog.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold">Recent Activity</h3>
          <span className="text-xs text-[var(--muted)] ml-auto">Live feed</span>
        </div>

        {data.recentEvents.length === 0 ? (
          <div className="text-center text-[var(--muted)] text-sm py-4">
            No activity recorded yet. Views will appear here once visitors read
            your articles.
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
            {data.recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {event.metadata?.title ?? event.page_path ?? "event"}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {event.event_type === "page_view"
                      ? "Article View"
                      : event.event_type}
                    {event.metadata?.category &&
                      ` · ${event.metadata.category}`}
                  </div>
                </div>
                <span className="text-xs text-[var(--muted)] flex-shrink-0 tabular-nums">
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
