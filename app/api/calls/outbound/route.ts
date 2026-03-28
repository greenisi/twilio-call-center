import { NextRequest, NextResponse } from "next/server";
import { getTwilioClient } from "@/lib/twilio";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { to, from: fromParam } = await req.json();

    if (!to) {
      return NextResponse.json({ error: "Missing 'to' number" }, { status: 400 });
    }

    const fromNumber = fromParam ?? process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      return NextResponse.json(
        { error: "No from number configured" },
        { status: 400 }
      );
    }

    const client = getTwilioClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const call = await client.calls.create({
      to,
      from: fromNumber,
      url: `${appUrl}/api/calls/voice`,
      statusCallback: `${appUrl}/api/calls/status`,
      statusCallbackMethod: "POST",
      record: true,
      recordingStatusCallback: `${appUrl}/api/calls/recording-callback`,
    });

    // Save to database
    const supabase = getSupabaseAdmin();
    await supabase.from("calls").insert({
      sid: call.sid,
      from_number: fromNumber,
      to_number: to,
      direction: "outbound",
      status: "queued",
    });

    return NextResponse.json({ sid: call.sid, status: call.status });
  } catch (err) {
    console.error("Outbound call error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate call" },
      { status: 500 }
    );
  }
}
