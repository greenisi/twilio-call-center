import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return NextResponse.json({ calls: [] });
  try {
    const client = twilio(accountSid, authToken);
    const calls = await client.calls.list({ status: "in-progress", limit: 50 });
    const formatted = calls.map((c) => ({
      id: c.sid,
      sid: c.sid,
      fromNumber: c.from,
      toNumber: c.to,
      direction: c.direction === "inbound" ? "inbound" : "outbound",
      status: c.status,
      duration: c.duration,
      createdAt: c.startTime?.toISOString() || c.dateCreated?.toISOString(),
    }));
    return NextResponse.json({ calls: formatted });
  } catch {
    return NextResponse.json({ calls: [] });
  }
}
