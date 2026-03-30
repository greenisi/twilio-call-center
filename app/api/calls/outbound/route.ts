import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { createOutboundCall } from "@/lib/vapi";

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();
    if (!to) {
      return NextResponse.json({ error: "Missing 'to' number" }, { status: 400 });
    }

    const call = await createOutboundCall(to);

    // Save to database using Vapi call ID as the sid
    const supabase = getSupabaseAdmin();
    await supabase.from("calls").insert({
      sid: call.id,
      from_number: process.env.TWILIO_PHONE_NUMBER,
      to_number: to,
      direction: "outbound",
      status: "queued",
    });

    return NextResponse.json({ sid: call.id, status: "queued" });
  } catch (err) {
    console.error("Outbound call error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate call" },
      { status: 500 }
    );
  }
}
