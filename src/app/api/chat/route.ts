import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { chatSchema } from "@/lib/schemas";
import { clientIp } from "@/lib/client-ip";
import { generateChatReply, detectEmailInMessage } from "@/lib/chat";
import { createPublicClient } from "@/lib/supabase/public-client";

export const runtime = "nodejs";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = clientIp(request.headers);
  const rl = rateLimit(`chat:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limited. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { sessionId, message, history } = parsed.data;
  const userAgent = request.headers.get("user-agent");
  const supabase = createPublicClient();

  // 1. Upsert conversation → get id + current lead_id (via SECURITY DEFINER RPC
  //    so we don't need to grant anon SELECT on public.conversations).
  const { data: convRows, error: convErr } = await supabase.rpc(
    "chat_upsert_conversation",
    { p_session_id: sessionId, p_user_agent: userAgent ?? null },
  );
  if (convErr || !convRows || !convRows[0]) {
    console.error("[chat] upsert conversation failed:", convErr);
    return NextResponse.json(
      { error: "Could not start conversation" },
      { status: 500 },
    );
  }
  const conversationId = convRows[0].id as string;
  const existingLeadId = convRows[0].lead_id as string | null;

  // 2. Persist the inbound user message (fire-and-forget; failure to store
  //    shouldn't block the reply).
  await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role: "user", content: message });

  // 3. Call Claude with client-supplied history + the new turn. The client
  //    owns its own transcript so the server never has to read it back.
  const fullHistory = [...history, { role: "user" as const, content: message }];

  let reply: string;
  try {
    reply = await generateChatReply(fullHistory);
  } catch (err) {
    console.error("[chat] Claude request failed:", err);
    return NextResponse.json(
      {
        reply:
          "Sorry — I'm having trouble reaching my brain right now. Try again in a minute, or email us at fourpielabs@gmail.com.",
      },
      { status: 200 },
    );
  }

  // 4. Persist the assistant reply.
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: reply,
  });

  // 5. Lead auto-promotion: if the visitor just shared an email and we
  //    haven't linked a lead yet, create one and attach it.
  if (!existingLeadId) {
    const email = detectEmailInMessage(message);
    if (email) {
      const { data: leadRow, error: leadErr } = await supabase
        .from("leads")
        .insert({
          type: "chat",
          source: "Chatbot",
          email,
          payload: { first_message: message, session_id: sessionId },
        })
        .select("id")
        .single();

      if (!leadErr && leadRow?.id) {
        await supabase.rpc("chat_link_lead", {
          p_conversation_id: conversationId,
          p_lead_id: leadRow.id,
        });
      }
    }
  }

  return NextResponse.json({ reply });
}
