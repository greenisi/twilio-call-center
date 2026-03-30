import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    timezone = "America/New_York",
    schedule_days = ["Mon", "Tue", "Wed", "Thu", "Fri"],
    schedule_start = "09:00",
    schedule_end = "17:00",
    calls_per_minute = 1,
    max_retries = 2,
    retry_delay_hours = 2,
  } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      name,
      timezone,
      schedule_days,
      schedule_start,
      schedule_end,
      calls_per_minute,
      max_retries,
      retry_delay_hours,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
