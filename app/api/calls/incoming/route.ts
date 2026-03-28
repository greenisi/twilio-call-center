import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Webhook — called by Twilio when someone calls your Twilio number
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callSid = formData.get("CallSid") as string;
  const from = formData.get("From") as string;
  const to = formData.get("To") as string;

  // Log the inbound call to Supabase
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("calls").insert({
      sid: callSid,
      from_number: from,
      to_number: to,
      direction: "inbound",
      status: "ringing",
    });
  } catch (err) {
    console.error("Failed to log incoming call:", err);
  }

  const twiml = new VoiceResponse();

  // Route call to browser client named "agent"
  const dial = twiml.dial({
    timeout: 30,
    record: "record-from-answer",
    recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/recording-callback`,
    recordingStatusCallbackMethod: "POST",
  });

  dial.client("agent");

  // Fallback: if no agent available, play a message
  twiml.say(
    "Sorry, no agents are available right now. Please try again later."
  );

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
