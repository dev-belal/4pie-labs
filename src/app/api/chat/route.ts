import { NextResponse } from "next/server";
import { clientIp, postToN8N } from "@/lib/n8n";
import { rateLimit } from "@/lib/rate-limit";
import { chatSchema } from "@/lib/schemas";

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
  const rl = rateLimit(`chat:${ip}`, 20, 60_000); // 20 messages / minute / IP
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

  const result = await postToN8N(process.env.N8N_WEBHOOK_CHAT_URL, {
    message: parsed.data.message,
    source: "web-chat",
    ip,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Chat service unavailable" },
      { status: result.status ?? 502 },
    );
  }

  return NextResponse.json(result.data);
}
