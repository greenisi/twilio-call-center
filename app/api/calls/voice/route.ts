import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const to = formData.get("To") as string;
  const direction = formData.get("Direction") as string; // "inbound" or "outbound-api"

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const wsUrl = appUrl.replace(/^https?/, "wss");

  const twiml = new VoiceResponse();

  if (to?.startsWith("client:")) {
    const dial = twiml.dial({ callerId: process.env.TWILIO_PHONE_NUMBER! });
    dial.client(to.replace("client:", ""));
  } else {
    const isInbound = direction === "inbound";
    const callType = isInbound ? "inbound" : "outbound";

    const connect = twiml.connect();
    connect.stream({ url: `${wsUrl}/media-stream?callType=${callType}` });
  }

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
