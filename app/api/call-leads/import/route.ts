import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

interface LeadRow {
  phone: string;
  name?: string;
  email?: string;
  company?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leads, campaign_id, source = "csv" } = body as {
    leads: LeadRow[];
    campaign_id?: string;
    source?: string;
  };

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });
  }

  // Filter out rows without a phone number
  const valid = leads
    .filter((l) => l.phone?.trim())
    .map((l) => ({
      phone: l.phone.trim(),
      name: l.name?.trim() || null,
      email: l.email?.trim() || null,
      company: l.company?.trim() || null,
      notes: l.notes?.trim() || null,
      source,
      campaign_id: campaign_id || null,
    }));

  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid phone numbers found" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("call_leads")
    .upsert(valid, { onConflict: "phone", ignoreDuplicates: false })
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update campaign total_leads count
  if (campaign_id && data) {
    const { count } = await supabase
      .from("call_leads")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign_id);
    await supabase
      .from("campaigns")
      .update({ total_leads: count ?? 0, leads_remaining: count ?? 0 })
      .eq("id", campaign_id);
  }

  return NextResponse.json({ imported: data?.length ?? 0, total: valid.length });
}
