"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  GitBranch,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquarePlus,
  Moon,
  PenTool,
  Search,
  Sun,
} from "lucide-react";
import { signOut } from "@/lib/auth-actions";
import { useTheme } from "@/lib/use-theme";
import type { DashboardData, PipelineWithStages } from "@/lib/admin-data";
import { OverviewPanel } from "./OverviewPanel";
import { BlogPublisher } from "./BlogPublisher";
import { TestimonialPublisher } from "./TestimonialPublisher";
import { LeadsPanel } from "./LeadsPanel";
import { ConversationsPanel } from "./ConversationsPanel";
import { PipelinesPanel } from "./PipelinesPanel";

type Tab =
  | "overview"
  | "leads"
  | "pipelines"
  | "conversations"
  | "testimonials"
  | "blogs";

const NAV: Array<{
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: Inbox },
  { id: "pipelines", label: "Pipelines", icon: GitBranch },
  { id: "conversations", label: "Conversations", icon: MessageCircle },
  { id: "testimonials", label: "Testimonials", icon: MessageSquarePlus },
  { id: "blogs", label: "Blogs", icon: PenTool },
];

const HEADINGS: Record<Tab, { title: string; sub: string }> = {
  overview: {
    title: "Overview",
    sub: "Your agency at a glance",
  },
  leads: {
    title: "Leads",
    sub: "Inbound requests from the website",
  },
  pipelines: {
    title: "Pipelines",
    sub: "Build and manage your sales stages",
  },
  conversations: {
    title: "Conversations",
    sub: "Chat transcripts from the site bot",
  },
  testimonials: {
    title: "Testimonials",
    sub: "Approve and publish reviews",
  },
  blogs: {
    title: "Blogs",
    sub: "Publish to the live site",
  },
};

export function AdminShell({
  data,
  pipelines,
  userEmail,
}: {
  data: DashboardData;
  pipelines: PipelineWithStages[];
  userEmail: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // Poll every 15s while the tab is visible. Server actions still force an
  // immediate revalidate on explicit edits.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        startTransition(() => router.refresh());
      }
    };
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [router]);

  const heading = HEADINGS[tab];
  const initials = (userEmail?.[0] ?? "A").toUpperCase();

  const badgeFor = (id: Tab): number | undefined => {
    if (id === "leads" && data.newLeads > 0) return data.newLeads;
    if (id === "conversations" && data.totalConversations > 0)
      return data.totalConversations;
    return undefined;
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar (desktop) */}
      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col bg-[var(--surface)] border-r border-[var(--border)] overflow-y-auto"
      >
        <div className="px-5 py-5 flex items-center gap-2">
          <Image
            data-logo
            src="/logo.png"
            alt="4Pie Labs"
            width={104}
            height={26}
            className="h-6 w-auto"
            priority
          />
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((n) => (
            <SidebarItem
              key={n.id}
              active={tab === n.id}
              onClick={() => setTab(n.id)}
              icon={<n.icon className="w-4 h-4" />}
              label={n.label}
              badge={badgeFor(n.id)}
            />
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-3 space-y-2">
          <div className="px-3 text-xs text-[var(--muted)] truncate">
            {userEmail}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="shrink-0 flex items-center gap-3 px-4 md:px-6 h-16 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate leading-tight">
              {heading.title}
            </h1>
            <p className="text-xs text-[var(--muted)] truncate">
              {heading.sub}
            </p>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] min-w-[200px] max-w-[280px]">
            <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
            <input
              placeholder="Search…"
              className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-[var(--muted)]"
              aria-label="Search"
            />
          </div>

          <SyncDot active={isPending} />

          <button
            type="button"
            onClick={toggle}
            title="Toggle theme"
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            title="Notifications"
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>

          <div
            className="w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--on-soft)] flex items-center justify-center text-xs font-semibold shrink-0"
            title={userEmail}
          >
            {initials}
          </div>
        </header>

        {/* Mobile nav strip (replaces hidden sidebar on small viewports) */}
        <div className="lg:hidden flex gap-1 overflow-x-auto p-2 border-b border-[var(--border)] bg-[var(--surface)]">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setTab(n.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                tab === n.id
                  ? "bg-[var(--accent-soft)] text-[var(--on-soft)]"
                  : "text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <n.icon className="w-3.5 h-3.5" />
              {n.label}
              {badgeFor(n.id) !== undefined && (
                <span className="text-[10px] font-semibold bg-primary text-on-primary px-1.5 rounded-full">
                  {badgeFor(n.id)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <OverviewPanel data={data} />
              </motion.div>
            )}
            {tab === "leads" && (
              <motion.div
                key="leads"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <LeadsPanel leads={data.leads} />
              </motion.div>
            )}
            {tab === "pipelines" && (
              <motion.div
                key="pipelines"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <PipelinesPanel pipelines={pipelines} />
              </motion.div>
            )}
            {tab === "conversations" && (
              <motion.div
                key="conversations"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <ConversationsPanel conversations={data.conversations} />
              </motion.div>
            )}
            {tab === "testimonials" && (
              <motion.div
                key="testimonials"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="max-w-2xl"
              >
                <TestimonialPublisher />
              </motion.div>
            )}
            {tab === "blogs" && (
              <motion.div
                key="blogs"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="max-w-4xl"
              >
                <BlogPublisher />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--accent-soft)] text-[var(--on-soft)]"
          : "text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {typeof badge === "number" && (
        <span className="min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center text-[10px] font-semibold rounded-full bg-primary text-on-primary">
          {badge}
        </span>
      )}
    </button>
  );
}

function SyncDot({ active }: { active: boolean }) {
  return (
    <span
      title={active ? "Syncing…" : "Live"}
      aria-label={active ? "Syncing" : "Live"}
      className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium text-[var(--muted)]"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-primary animate-pulse" : "bg-emerald-400"
        }`}
      />
      {active ? "Sync" : "Live"}
    </span>
  );
}
