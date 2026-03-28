import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

// TwiML Voice URL — called by Twilio when a browser client makes a call
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const to = formData.get("To") as string;
  const from = formData.get("From") as string;

  const twiml = new VoiceResponse();

  if (to) {
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER!,
    });

    // If To starts with "client:", connect to another browser client
    if (to.startsWith("client:")) {
      dial.client(to.replace("client:", ""));
    } else {
      // Dial a phone number
      dial.number(to);
    }
  } else {
    twiml.say("Thank you for calling. No destination specified.");
  }

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
