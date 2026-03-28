import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callSid = formData.get("CallSid") as string;
  const recordingUrl = formData.get("RecordingUrl") as string;
  const recordingSid = formData.get("RecordingSid") as string;

  if (!callSid || !recordingUrl) {
    return new NextResponse("OK", { status: 200 });
  }

  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("calls")
      .update({ recording_url: `${recordingUrl}.mp3` })
      .eq("sid", callSid);
  } catch (err) {
    console.error("Recording callback error:", err);
  }

  return new NextResponse("OK", { status: 200 });
}
