import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

// Public webhook endpoint for pushing leads from third-party systems
// Secure with x-webhook-secret header matching WEBHOOK_SECRET env var
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const leads = Array.isArray(body) ? body : [body];

  const valid = leads
    .filter((l) => l.phone?.trim())
    .map((l) => ({
      phone: l.phone.trim(),
      name: l.name?.trim() || null,
      email: l.email?.trim() || null,
      company: l.company?.trim() || null,
      notes: l.notes?.trim() || null,
      campaign_id: l.campaign_id || null,
      source: "webhook",
    }));

  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid leads" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("call_leads")
    .insert(valid)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ received: data?.length ?? 0 });
}
