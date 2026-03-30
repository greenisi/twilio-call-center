import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SARAH_SYSTEM = `You are Sarah, a warm and knowledgeable representative for Cash Annuity Solutions — a company that helps people sell their structured settlement payments, annuity payments, or lottery winnings for a lump sum of cash.

You are having a TEXT MESSAGE conversation. Keep replies SHORT (1-4 sentences max). Be conversational, friendly, and professional. Do NOT use bullet points or long lists in SMS replies.

Your goal:
- Understand what type of payments the person receives (structured settlement, annuity, lottery, etc.)
- Find out roughly how much they receive and how often
- Gauge their interest in getting a lump sum
- Offer to have a specialist call them or get them a free quote

Never pressure. Always empathetic. If they seem interested, ask for the best time to call.`;

async function generateAIReply(conversationHistory: { role: string; body: string }[]): Promise<string> {
  const geminiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!geminiKey) return "";

  const contents = conversationHistory.map((m) => ({
    role: m.role === "inbound" ? "user" : "model",
    parts: [{ text: m.body }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SARAH_SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
      }),
    }
  );

  if (!res.ok) return "";
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// GET /api/sms — fetch all messages
export async function GET() {
  const { data, error } = await supabase
    .from("demo_messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

// POST /api/sms — send a message
// body: { body: string, direction: "inbound" | "outbound", phone_number?: string }
export async function POST(req: Request) {
  const { body, direction, phone_number } = await req.json();

  if (!body || !direction) {
    return NextResponse.json({ error: "body and direction required" }, { status: 400 });
  }

  // Insert the message
  const { data: inserted, error } = await supabase
    .from("demo_messages")
    .insert({ body, direction, phone_number: phone_number ?? "+19123128862" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If inbound from phone, trigger AI auto-reply
  if (direction === "inbound" && (process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY)) {
    // Fetch recent history for context (last 20 messages)
    const { data: history } = await supabase
      .from("demo_messages")
      .select("body, direction")
      .order("created_at", { ascending: true })
      .limit(20);

    const reply = await generateAIReply(history ?? []);

    if (reply) {
      // Small delay so it feels like typing
      await new Promise((r) => setTimeout(r, 1200));

      await supabase
        .from("demo_messages")
        .insert({ body: reply, direction: "outbound", phone_number: phone_number ?? "+19123128862" });
    }
  }

  return NextResponse.json({ message: inserted });
}

// PATCH /api/sms — mark all inbound as read
export async function PATCH() {
  const { error } = await supabase
    .from("demo_messages")
    .update({ read: true })
    .eq("direction", "inbound")
    .eq("read", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/sms — clear all messages (reset demo)
export async function DELETE() {
  const { error } = await supabase.from("demo_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
