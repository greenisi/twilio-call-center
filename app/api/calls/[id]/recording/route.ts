import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("calls")
      .select("recording_url, sid")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (!data.recording_url) {
      return NextResponse.json(
        { error: "No recording available" },
        { status: 404 }
      );
    }

    return NextResponse.json({ recording_url: data.recording_url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
