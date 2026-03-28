import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("settings")
      .select("id, twilio_phone_number, twilio_account_sid")
      .single();

    // Never expose auth token via GET
    return NextResponse.json({ settings: data ?? null });
  } catch (err) {
    return NextResponse.json({ settings: null, error: String(err) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { twilio_account_sid, twilio_auth_token, twilio_phone_number, twilio_twiml_app_sid } = body;

    const supabase = getSupabaseAdmin();

    // Upsert settings (only one row)
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .single();

    const record = {
      twilio_account_sid,
      twilio_auth_token,
      twilio_phone_number,
      twilio_twiml_app_sid,
    };

    let result;
    if (existing?.id) {
      result = await supabase
        .from("settings")
        .update(record)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("settings")
        .insert(record)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, settings: result.data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
