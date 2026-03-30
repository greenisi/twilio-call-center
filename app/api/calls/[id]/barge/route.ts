import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
  try {
    const client = twilio(accountSid, authToken);
    const call = await client.calls(id).fetch();
    return NextResponse.json({ success: true, mode: "barge", callSid: call.sid, status: call.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
