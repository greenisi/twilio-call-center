import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

// Twilio status callback webhook
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callSid = formData.get("CallSid") as string;
  const callStatus = formData.get("CallStatus") as string;
  const callDuration = formData.get("CallDuration") as string;

  if (!callSid) {
    return new NextResponse("OK", { status: 200 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const updates: Record<string, unknown> = { status: callStatus };
    if (callDuration) updates.duration = parseInt(callDuration);

    await supabase.from("calls").update(updates).eq("sid", callSid);
  } catch (err) {
    console.error("Status callback error:", err);
  }

  return new NextResponse("OK", { status: 200 });
}
