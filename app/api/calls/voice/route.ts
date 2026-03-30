import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

// This webhook is used by the Twilio softphone (browser client → client: routing).
// Inbound AI calls are handled directly by Vapi (after running /api/vapi/setup).
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const to = formData.get("To") as string;

  const twiml = new VoiceResponse();

  if (to?.startsWith("client:")) {
    const dial = twiml.dial({ callerId: process.env.TWILIO_PHONE_NUMBER! });
    dial.client(to.replace("client:", ""));
  } else {
    // Fallback: say a message if called directly outside Vapi flow
    twiml.say({ voice: "alice" }, "Thank you for calling Cash Annuity Solutions. Please hold.");
  }

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
