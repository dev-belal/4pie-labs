import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/service";

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

export type LeadType = "contact" | "custom_request" | "roi" | "chat";
export type LeadStatus = "new" | "in_progress" | "won" | "lost";

export interface Lead {
  id: string;
  type: LeadType;
  status: LeadStatus;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  payload: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationSummary {
  id: string;
  session_id: string;
  user_agent: string | null;
  lead_id: string | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  preview: string | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface DashboardData {
  totalViews: number;
  totalBlogs: number;
  totalTestimonials: number;
  totalLeads: number;
  newLeads: number;
  totalConversations: number;
  blogStats: BlogStat[];
  recentEvents: MetricEvent[];
  leads: Lead[];
  conversations: ConversationSummary[];
}

export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const supabase = createServiceClient();

  const [
    { data: blogs },
    { count: testCount },
    { data: events },
    { data: leadsData, count: leadsCount },
    { count: newLeadsCount },
    { data: conversationsData, count: convCount },
  ] = await Promise.all([
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
    supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("conversations")
      .select("*", { count: "exact" })
      .order("last_message_at", { ascending: false })
      .limit(50),
  ]);

  const blogStats = (blogs ?? []) as BlogStat[];
  const totalViews = blogStats.reduce((sum, b) => sum + (b.views ?? 0), 0);
  const leads = (leadsData ?? []) as Lead[];
  const conversationRows = (conversationsData ?? []) as Array<{
    id: string;
    session_id: string;
    user_agent: string | null;
    lead_id: string | null;
    started_at: string;
    last_message_at: string;
  }>;

  let conversations: ConversationSummary[] = conversationRows.map((c) => ({
    ...c,
    message_count: 0,
    preview: null,
  }));

  if (conversationRows.length > 0) {
    const ids = conversationRows.map((c) => c.id);
    const { data: msgRows } = await supabase
      .from("messages")
      .select("id, conversation_id, role, content, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false });

    const grouped = new Map<
      string,
      { count: number; lastUserContent: string | null }
    >();
    for (const m of (msgRows ?? []) as ConversationMessage[]) {
      const acc = grouped.get(m.conversation_id) ?? {
        count: 0,
        lastUserContent: null,
      };
      acc.count += 1;
      if (acc.lastUserContent == null && m.role === "user") {
        acc.lastUserContent = m.content;
      }
      grouped.set(m.conversation_id, acc);
    }

    conversations = conversationRows.map((c) => {
      const g = grouped.get(c.id);
      return {
        ...c,
        message_count: g?.count ?? 0,
        preview: g?.lastUserContent
          ? g.lastUserContent.slice(0, 140)
          : null,
      };
    });
  }

  return {
    totalViews,
    totalBlogs: blogStats.length,
    totalTestimonials: testCount ?? 0,
    totalLeads: leadsCount ?? leads.length,
    newLeads: newLeadsCount ?? 0,
    totalConversations: convCount ?? conversations.length,
    blogStats,
    recentEvents: (events ?? []) as MetricEvent[],
    leads,
    conversations,
  };
});

/* ============================================================
 * Pipelines + stages (Phase 2 of the CRM expansion).
 *
 * Admin-only tables created in migration 0007. RLS denies anon /
 * authenticated; only the service-role client (this module) can read.
 * ============================================================ */

export type StageKind = "open" | "won" | "lost";

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  kind: StageKind;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineWithStages {
  id: string;
  name: string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  stages: PipelineStage[];
}

/**
 * Fetch every non-archived pipeline with its stages ordered by sort_order.
 * Two reads in parallel — the in-list filter on stages avoids fetching a
 * pipeline's stages individually.
 */
export async function getPipelinesWithStages(): Promise<PipelineWithStages[]> {
  const supabase = createServiceClient();

  const { data: pipelines, error: pipelineErr } = await supabase
    .from("pipelines")
    .select("id, name, sort_order, archived_at, created_at, updated_at")
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (pipelineErr || !pipelines || pipelines.length === 0) return [];

  const ids = pipelines.map((p) => p.id as string);
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("id, pipeline_id, name, kind, sort_order, created_at, updated_at")
    .in("pipeline_id", ids)
    .order("sort_order", { ascending: true });

  const byPipeline = new Map<string, PipelineStage[]>();
  for (const s of (stages ?? []) as PipelineStage[]) {
    const list = byPipeline.get(s.pipeline_id) ?? [];
    list.push(s);
    byPipeline.set(s.pipeline_id, list);
  }

  return pipelines.map((p) => ({
    ...(p as Omit<PipelineWithStages, "stages">),
    stages: byPipeline.get(p.id as string) ?? [],
  }));
}

/** Fetch the full message thread for a single conversation. */
export async function getConversationMessages(
  conversationId: string,
): Promise<ConversationMessage[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ConversationMessage[];
}
