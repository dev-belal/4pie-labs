"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquarePlus,
  PenTool,
} from "lucide-react";
import { signOut } from "@/lib/auth-actions";
import type { DashboardData } from "@/lib/admin-data";
import { OverviewPanel } from "./OverviewPanel";
import { BlogPublisher } from "./BlogPublisher";
import { TestimonialPublisher } from "./TestimonialPublisher";
import { LeadsPanel } from "./LeadsPanel";
import { ConversationsPanel } from "./ConversationsPanel";

type Tab =
  | "overview"
  | "leads"
  | "conversations"
  | "testimonials"
  | "blogs";

export function AdminShell({
  data,
  userEmail,
}: {
  data: DashboardData;
  userEmail: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // We dropped the Supabase realtime channel when we moved off Supabase Auth
  // — the anon client can no longer SELECT leads/conversations/messages, so
  // RLS would suppress the events. Poll every 15s while the tab is visible;
  // server actions still force an immediate revalidate on explicit edits.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        startTransition(() => router.refresh());
      }
    };
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [router]);

  const headings: Record<Tab, { title: string; sub: string }> = {
    overview: {
      title: "Analytics Dashboard",
      sub: "Live metrics · Auto-refreshing every 15s",
    },
    leads: {
      title: "Inbound Leads",
      sub: "Contact, custom requests, ROI, and chatbot leads",
    },
    conversations: {
      title: "Chat Conversations",
      sub: "Every chatbot session, live from Supabase",
    },
    testimonials: {
      title: "Add Testimonial",
      sub: "Publishes directly to Supabase",
    },
    blogs: {
      title: "Create New Insight",
      sub: "Publishes directly to Supabase",
    },
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-xl p-8 flex-col hidden md:flex">
        <div className="flex items-center gap-3 mb-12">
          <Image
            src="/logo.png"
            alt="4Pie Labs"
            width={128}
            height={28}
            className="h-7 w-auto brightness-0 invert"
          />
        </div>

        <nav className="space-y-2 flex-1">
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Analytics"
          />
          <TabButton
            active={tab === "leads"}
            onClick={() => setTab("leads")}
            icon={<Inbox className="w-4 h-4" />}
            label="Leads"
            badge={data.newLeads > 0 ? data.newLeads : undefined}
          />
          <TabButton
            active={tab === "conversations"}
            onClick={() => setTab("conversations")}
            icon={<MessageCircle className="w-4 h-4" />}
            label="Conversations"
            badge={
              data.totalConversations > 0 ? data.totalConversations : undefined
            }
          />
          <TabButton
            active={tab === "testimonials"}
            onClick={() => setTab("testimonials")}
            icon={<MessageSquarePlus className="w-4 h-4" />}
            label="Testimonials"
          />
          <TabButton
            active={tab === "blogs"}
            onClick={() => setTab("blogs")}
            icon={<PenTool className="w-4 h-4" />}
            label="Blog Publisher"
          />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold truncate">
            {userEmail}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-display font-bold">
              {headings[tab].title}
            </h2>
            <p className="text-white/40 text-sm mt-1">{headings[tab].sub}</p>
          </div>
          <div
            className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
              isPending
                ? "bg-amber-400/10 border-amber-400/20 text-amber-400"
                : "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPending ? "bg-amber-400" : "bg-emerald-400"}`}
            />
            {isPending ? "Syncing" : "Live"}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <OverviewPanel data={data} />
            </motion.div>
          )}
          {tab === "leads" && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <LeadsPanel leads={data.leads} />
            </motion.div>
          )}
          {tab === "conversations" && (
            <motion.div
              key="conversations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ConversationsPanel conversations={data.conversations} />
            </motion.div>
          )}
          {tab === "testimonials" && (
            <motion.div
              key="testimonials"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl"
            >
              <TestimonialPublisher />
            </motion.div>
          )}
          {tab === "blogs" && (
            <motion.div
              key="blogs"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl"
            >
              <BlogPublisher />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabButton({
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-white/10 text-white shadow-lg"
          : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {typeof badge === "number" && (
        <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
