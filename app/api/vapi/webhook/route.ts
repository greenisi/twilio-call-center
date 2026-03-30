import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

interface VapiCallStarted {
  type: "call-started";
  call: {
    id: string;
    phoneNumber?: { number: string };
    customer?: { number: string };
    type: string;
  };
}

interface VapiEndOfCallReport {
  type: "end-of-call-report";
  call: {
    id: string;
    phoneNumber?: { number: string };
    customer?: { number: string };
    type: string;
  };
  transcript: string;
  summary: string;
  recordingUrl?: string;
  durationSeconds?: number;
}

type VapiEvent = { message: VapiCallStarted | VapiEndOfCallReport };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VapiEvent;
    const msg = body.message;
    const supabase = getSupabaseAdmin();

    if (msg.type === "call-started") {
      const { call } = msg;
      const isInbound = call.type === "inboundPhoneCall";
      await supabase.from("calls").upsert({
        sid: call.id,
        from_number: isInbound ? call.customer?.number : call.phoneNumber?.number,
        to_number: isInbound ? call.phoneNumber?.number : call.customer?.number,
        direction: isInbound ? "inbound" : "outbound",
        status: "in-progress",
      });
    }

    if (msg.type === "end-of-call-report") {
      const { call, transcript, summary, recordingUrl, durationSeconds } = msg;
      await supabase
        .from("calls")
        .update({
          status: "completed",
          transcript,
          summary,
          recording_url: recordingUrl ?? null,
          duration: durationSeconds ?? null,
        })
        .eq("sid", call.id);

      // Update campaign call record and lead status
      const { data: campaignCall } = await supabase
        .from("campaign_calls")
        .select("id, lead_id")
        .eq("call_sid", call.id)
        .single();

      if (campaignCall) {
        await supabase
          .from("campaign_calls")
          .update({ status: "completed" })
          .eq("id", campaignCall.id);

        // Determine lead outcome from summary keywords
        const text = (summary ?? transcript ?? "").toLowerCase();
        let leadStatus = "called";
        if (text.includes("interested") || text.includes("appointment") || text.includes("callback") || text.includes("call back")) {
          leadStatus = "interested";
        } else if (text.includes("not interested") || text.includes("no thanks") || text.includes("remove")) {
          leadStatus = "not_interested";
        } else if (text.includes("no answer") || text.includes("voicemail") || durationSeconds != null && durationSeconds < 10) {
          leadStatus = "no_answer";
        }

        await supabase
          .from("call_leads")
          .update({ status: leadStatus })
          .eq("id", campaignCall.lead_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Vapi webhook] error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
