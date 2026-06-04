"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
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
  X,
} from "lucide-react";
import { signOut } from "@/lib/auth-actions";
import { useTheme } from "@/lib/use-theme";
import { getRecentNotifications } from "@/lib/notification-actions";
import {
  useNotificationStream,
  type NotificationPayload,
} from "@/lib/realtime-client";
import type {
  Appointment,
  DashboardData,
  Notification,
  NotificationKind,
  Opportunity,
  PipelineWithStages,
  TestimonialRow,
  UnreadCounts,
} from "@/lib/admin-data";
import type { BlogPost } from "@/data/blogs";
import { OverviewPanel } from "./OverviewPanel";
import { BlogsListPanel } from "./BlogsListPanel";
import { TestimonialsListPanel } from "./TestimonialsListPanel";
import { LeadsPanel } from "./LeadsPanel";
import { ConversationsPanel } from "./ConversationsPanel";
import { PipelinesPanel } from "./PipelinesPanel";
import { CalendarPanel } from "./CalendarPanel";
import { NotificationsBell } from "./NotificationsBell";

type Tab =
  | "overview"
  | "leads"
  | "pipelines"
  | "calendar"
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
  { id: "calendar", label: "Calendar", icon: CalendarDays },
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
  calendar: {
    title: "Calendar",
    sub: "Appointments synced from Cal.com",
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
  opportunities,
  appointments,
  blogs,
  testimonials,
  notifications,
  unreadCounts,
  monthStartISO,
  userEmail,
}: {
  data: DashboardData;
  pipelines: PipelineWithStages[];
  opportunities: Opportunity[];
  appointments: Appointment[];
  blogs: BlogPost[];
  testimonials: TestimonialRow[];
  notifications: Notification[];
  unreadCounts: UnreadCounts;
  monthStartISO: string;
  userEmail: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  // Topbar search state lives at shell level. Each panel decides
  // whether to consume it via a `globalSearch?: string` prop. Currently
  // wired into LeadsPanel (matches name / email / business / notes)
  // and BlogsListPanel (matches title / slug / category). Other panels
  // ignore it and the input is dimmed when those tabs are active so it
  // doesn't look interactive.
  const [globalSearch, setGlobalSearch] = useState("");
  const SEARCH_CONSUMERS: ReadonlySet<Tab> = new Set([
    "leads",
    "blogs",
    "testimonials",
  ]);
  const searchActive = SEARCH_CONSUMERS.has(tab);

  // Focus ticket: any time the user clicks "View →" on a promotion toast,
  // gotoPipeline bumps the token AND sets the destination id. PipelinesPanel
  // watches the whole object (which is a fresh reference each call) and
  // syncs its active pipeline + view. Re-firing with the same pipelineId
  // still works because the token changes every time.
  const focusTokenRef = useRef(0);
  const [pipelineFocus, setPipelineFocus] = useState<{
    pipelineId: string;
    token: number;
  } | null>(null);
  const gotoPipeline = useCallback((pipelineId: string) => {
    focusTokenRef.current += 1;
    setPipelineFocus({ pipelineId, token: focusTokenRef.current });
    setTab("pipelines");
  }, []);

  // Cross-tab focus driven by the bell. Each click on a notification
  // generates a fresh { id, token } ticket; the target panel watches the
  // whole object reference (new object every fire so re-firing with the
  // same id still triggers the effect).
  const [leadFocus, setLeadFocus] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const [conversationFocus, setConversationFocus] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const [appointmentFocus, setAppointmentFocus] = useState<{
    id: string;
    token: number;
  } | null>(null);

  const gotoNotification = useCallback(
    (kind: NotificationKind, sourceId: string) => {
      focusTokenRef.current += 1;
      const token = focusTokenRef.current;
      if (kind === "lead") {
        setLeadFocus({ id: sourceId, token });
        setTab("leads");
      } else if (kind === "conversation") {
        setConversationFocus({ id: sourceId, token });
        setTab("conversations");
      } else if (kind === "appointment") {
        setAppointmentFocus({ id: sourceId, token });
        setTab("calendar");
      }
    },
    [],
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // Poll every 15s while the tab is visible. Server actions still force an
  // immediate revalidate on explicit edits. Kept alongside the Realtime
  // subscription as belt-and-suspenders: if a websocket ever drops, the
  // poll catches missed events within 15s.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        startTransition(() => router.refresh());
      }
    };
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [router]);

  // Toast queue for live "new notification" pings. Each toast carries its
  // own id (random) so multiple in-flight toasts can timeout independently.
  // Auto-dismiss after 5s. Stacked bottom-right via the Tailwind classes
  // in the render block at the end of the topbar column.
  const [toasts, setToasts] = useState<NotifToast[]>([]);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const pushToast = useCallback(
    (kind: NotificationKind, title: string) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, kind, title }]);
      window.setTimeout(() => dismissToast(id), 5000);
    },
    [dismissToast],
  );

  // Track which notification ids have already been toasted so a missed-then-
  // delivered duplicate event (or the 15s poll catching up) doesn't double-
  // toast. Seeded from the initial props so existing rows never toast
  // retroactively.
  const toastedIdsRef = useRef<Set<string>>(
    new Set(notifications.map((n) => n.id)),
  );

  // Realtime: subscribe via the anon channel. On every INSERT event, refresh
  // server state so badges + bell list update; also fire a toast.
  //
  // RLS-payload contingency: the notifications table is RLS-enabled with
  // zero policies, so the anon channel can't SELECT and Supabase Realtime
  // strips the row content from the broadcast (the realtime hook emits null
  // in that case). We detect both shapes:
  //   - If `payload` carries id+title, toast directly from it.
  //   - If `payload` is null, fall back to a service-role server-action
  //     refetch of the newest unread notification and toast that.
  // In production this resolves at runtime; the actual path is reported
  // back in commit 2.3 verification.
  const handleNewNotification = useCallback(
    (payload: NotificationPayload | null) => {
      startTransition(() => router.refresh());
      const direct =
        payload &&
        typeof payload.id === "string" &&
        typeof payload.title === "string" &&
        typeof payload.kind === "string";
      if (direct && payload) {
        if (toastedIdsRef.current.has(payload.id!)) return;
        toastedIdsRef.current.add(payload.id!);
        pushToast(payload.kind as NotificationKind, payload.title as string);
        return;
      }
      void (async () => {
        const recent = await getRecentNotifications(3);
        for (const n of recent) {
          if (toastedIdsRef.current.has(n.id)) continue;
          toastedIdsRef.current.add(n.id);
          pushToast(n.kind, n.title);
          return; // newest unseen only
        }
      })();
    },
    [router, pushToast],
  );
  useNotificationStream(handleNewNotification);

  const heading = HEADINGS[tab];
  const initials = (userEmail?.[0] ?? "A").toUpperCase();

  // Badges reflect *unread notifications*, not pipeline status or row
  // totals. Three notification kinds map 1:1 to three tabs; the other
  // tabs get no badge. Counts come from the server fetch; live updates
  // arrive via Realtime → router.refresh in commit 2.3.
  const badgeFor = (id: Tab): number | undefined => {
    if (id === "leads" && unreadCounts.lead > 0) return unreadCounts.lead;
    if (id === "conversations" && unreadCounts.conversation > 0)
      return unreadCounts.conversation;
    if (id === "calendar" && unreadCounts.appointment > 0)
      return unreadCounts.appointment;
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

          <div
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] min-w-[200px] max-w-[280px] transition-opacity ${
              searchActive ? "opacity-100" : "opacity-40"
            }`}
            title={
              searchActive
                ? undefined
                : "Search isn't available on this panel"
            }
          >
            <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              disabled={!searchActive}
              placeholder={
                searchActive
                  ? tab === "leads"
                    ? "Search leads…"
                    : tab === "blogs"
                      ? "Search blogs…"
                      : "Search testimonials…"
                  : "Search…"
              }
              className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-[var(--muted)] disabled:cursor-not-allowed"
              aria-label="Search"
            />
            {searchActive && globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch("")}
                className="text-[var(--muted)] hover:text-[var(--fg)]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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

          <NotificationsBell
            notifications={notifications}
            unreadTotal={unreadCounts.total}
            onOpenNotification={gotoNotification}
          />


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
                <LeadsPanel
                leads={data.leads}
                pipelines={pipelines}
                gotoPipeline={gotoPipeline}
                globalSearch={globalSearch}
                focus={leadFocus}
              />
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
                <PipelinesPanel
                  pipelines={pipelines}
                  opportunities={opportunities}
                  pipelineFocus={pipelineFocus}
                />
              </motion.div>
            )}
            {tab === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <CalendarPanel
                  appointments={appointments}
                  monthStartISO={monthStartISO}
                  focus={appointmentFocus}
                />
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
                <ConversationsPanel
                  conversations={data.conversations}
                  focus={conversationFocus}
                />
              </motion.div>
            )}
            {tab === "testimonials" && (
              <motion.div
                key="testimonials"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <TestimonialsListPanel
                  testimonials={testimonials}
                  globalSearch={globalSearch}
                />
              </motion.div>
            )}
            {tab === "blogs" && (
              <motion.div
                key="blogs"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <BlogsListPanel blogs={blogs} globalSearch={globalSearch} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Live notification toasts. Stacked bottom-right above the
          OpportunitiesBoard toast slot (z-50 vs that toast's z-50 —
          both kinds rarely fire together so the overlap is acceptable). */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              role="status"
              className="pointer-events-auto min-w-[260px] max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--on-soft)] flex items-center justify-center">
                {t.kind === "lead" ? (
                  <Inbox className="w-4 h-4" />
                ) : t.kind === "conversation" ? (
                  <MessageCircle className="w-4 h-4" />
                ) : (
                  <CalendarDays className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted)] font-semibold">
                  {t.kind === "lead"
                    ? "New lead"
                    : t.kind === "conversation"
                      ? "New chat"
                      : "New booking"}
                </div>
                <div className="text-sm font-medium truncate">{t.title}</div>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-[var(--muted)] hover:text-[var(--fg)]"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface NotifToast {
  id: string;
  kind: NotificationKind;
  title: string;
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
