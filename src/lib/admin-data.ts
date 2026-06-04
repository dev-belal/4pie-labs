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
  // Denormalized from a join in getDashboardData(). Name of the FIRST non-
  // lost pipeline this lead has been promoted into, or null if not promoted.
  // Used by LeadsPanel to render an "In <pipeline>" pill in place of status.
  inPipelineName?: string | null;
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
  let leads = (leadsData ?? []) as Lead[];

  // Enrich leads with the name of the first non-lost pipeline they appear
  // in, so LeadsPanel can show an "In <pipeline>" pill. Two small extra
  // queries; both indexed (opportunities_lead_idx + pipelines pk).
  if (leads.length > 0) {
    const leadIds = leads.map((l) => l.id);
    const { data: oppLinks } = await supabase
      .from("opportunities")
      .select("lead_id, pipeline_id, status, created_at")
      .in("lead_id", leadIds)
      .neq("status", "lost")
      .order("created_at", { ascending: true });

    const links = (oppLinks ?? []) as Array<{
      lead_id: string | null;
      pipeline_id: string;
    }>;

    if (links.length > 0) {
      const pipelineIds = Array.from(new Set(links.map((l) => l.pipeline_id)));
      const { data: pipelineRows } = await supabase
        .from("pipelines")
        .select("id, name")
        .in("id", pipelineIds);
      const nameById = new Map(
        ((pipelineRows ?? []) as Array<{ id: string; name: string }>).map(
          (p) => [p.id, p.name],
        ),
      );
      const inPipelineByLead = new Map<string, string>();
      for (const link of links) {
        if (!link.lead_id) continue;
        if (inPipelineByLead.has(link.lead_id)) continue;
        const name = nameById.get(link.pipeline_id);
        if (name) inPipelineByLead.set(link.lead_id, name);
      }
      leads = leads.map((l) => ({
        ...l,
        inPipelineName: inPipelineByLead.get(l.id) ?? null,
      }));
    }
  }
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

/* ============================================================
 * Opportunities (Phase 3).
 *
 * Cards on the kanban. lead_id is nullable — Phase 4 will populate it for
 * the lead → opportunity promotion flow. status mirrors the destination
 * stage's kind ('open' | 'won' | 'lost'); won_at / lost_at carry the
 * transition timestamps for win-rate math.
 * ============================================================ */

export type OpportunityStatus = "open" | "won" | "lost";

export interface Opportunity {
  id: string;
  pipeline_id: string;
  stage_id: string;
  lead_id: string | null;
  contact_name: string | null;
  business_name: string | null;
  source: string | null;
  value_cents: number;
  status: OpportunityStatus;
  notes: string | null;
  sort_order: number;
  expected_close_at: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

const OPPORTUNITY_COLUMNS =
  "id, pipeline_id, stage_id, lead_id, contact_name, business_name, source, value_cents, status, notes, sort_order, expected_close_at, won_at, lost_at, lost_reason, created_at, updated_at";

/**
 * Opportunities for a single pipeline, ordered by (stage sort_order asc,
 * sort_order asc within stage). The board groups by stage_id client-side.
 */
export async function getOpportunitiesByPipeline(
  pipelineId: string,
): Promise<Opportunity[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .eq("pipeline_id", pipelineId)
    .order("stage_id", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []) as Opportunity[];
}

/**
 * Every opportunity, across every pipeline. Used by the admin page to
 * hydrate the kanban with one round-trip; the client filters per active
 * pipeline.
 */
export async function getAllOpportunities(): Promise<Opportunity[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .order("pipeline_id", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []) as Opportunity[];
}

/* ============================================================
 * Appointments (Phase 5 — local Cal.com mirror).
 *
 * Rows in this table are owned by the admin shell: cal_booking_id / cal_uid
 * dedupe against Cal.com, but `category` and `notes` are admin-edited and
 * never sent back to Cal. The public /book flow writes a row via the
 * after()-wrapped mirror in booking-actions.ts; the syncAppointmentsFromCal
 * action backfills history.
 * ============================================================ */

export type AppointmentStatus = "confirmed" | "cancelled" | "rescheduled";

export interface Appointment {
  id: string;
  cal_booking_id: number | null;
  cal_uid: string | null;
  title: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_tz: string | null;
  channel: string | null;
  starts_at: string;
  ends_at: string;
  category: string | null;
  notes: string | null;
  status: AppointmentStatus;
  lead_id: string | null;
  opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

const APPOINTMENT_COLUMNS =
  "id, cal_booking_id, cal_uid, title, attendee_name, attendee_email, attendee_tz, channel, starts_at, ends_at, category, notes, status, lead_id, opportunity_id, created_at, updated_at";

/**
 * Local appointments in a date window. Both bounds are ISO; the window is
 * inclusive on starts_at. Used by the admin calendar to render either a
 * month or a week without pulling the full history each render.
 */
export async function getAppointments(
  rangeStartISO: string,
  rangeEndISO: string,
): Promise<Appointment[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS)
    .gte("starts_at", rangeStartISO)
    .lte("starts_at", rangeEndISO)
    .order("starts_at", { ascending: true });
  return (data ?? []) as Appointment[];
}

/* ============================================================
 * Testimonials (admin management).
 *
 * Mirrors the BlogPost flow: TestimonialRow carries the FULL row shape
 * (including unpublished drafts and the rating value the public
 * carousel doesn't render), the admin fetcher uses the service-role
 * client to bypass the public RLS read policy that hides drafts.
 * ============================================================ */

export interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  headline: string;
  quote: string;
  rating: number;
  avatar: string | null;
  is_published: boolean;
  created_at: string;
}

const TESTIMONIAL_COLUMNS =
  "id, name, role, headline, quote, rating, avatar, is_published, created_at";

/**
 * Admin-facing fetch: every testimonial row, drafts included, newest
 * first. The public component is gated by the
 * `testimonials_public_read_published` RLS policy and only sees
 * is_published=true; we bypass that via the service-role client here
 * so the admin can manage drafts before they go live.
 */
export async function getAllTestimonialsForAdmin(): Promise<TestimonialRow[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("testimonials")
    .select(TESTIMONIAL_COLUMNS)
    .order("created_at", { ascending: false });
  return (data ?? []) as TestimonialRow[];
}

/* ============================================================
 * Notifications (Phase 2 of admin notifications).
 *
 * One row per surfaceable event (new lead / new chat session / new
 * appointment), populated by AFTER INSERT triggers on the source tables
 * (0009_notification_triggers.sql). Shared read_at means clearing read
 * on one admin clears it for both. source_id is plain uuid pointing at
 * the source row - intentionally not a FK so the audit trail survives
 * source-row deletion.
 * ============================================================ */

export type NotificationKind = "lead" | "conversation" | "appointment";

export interface Notification {
  id: string;
  kind: NotificationKind;
  source_id: string;
  title: string;
  preview: string | null;
  created_at: string;
  read_at: string | null;
}

export interface UnreadCounts {
  lead: number;
  conversation: number;
  appointment: number;
  total: number;
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
