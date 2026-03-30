import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { createOutboundCall } from "@/lib/vapi";
import type { Campaign } from "@/lib/types";

function isWithinSchedule(campaign: Campaign): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: campaign.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const day = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const hhmm = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

  return (
    campaign.schedule_days.includes(day) &&
    hhmm >= campaign.schedule_start &&
    hhmm < campaign.schedule_end
  );
}

export async function POST(req: NextRequest) {
  // Validate cron secret
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Get all active campaigns
  const { data: campaigns, error: campErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active");

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });
  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({ ok: true, dialed: 0, message: "No active campaigns" });
  }

  let totalDialed = 0;

  for (const campaign of campaigns as Campaign[]) {
    if (!isWithinSchedule(campaign)) continue;

    // Get next batch of leads to call
    const retryBefore = new Date(
      Date.now() - campaign.retry_delay_hours * 60 * 60 * 1000
    ).toISOString();

    const { data: leads } = await supabase
      .from("call_leads")
      .select("id, phone, call_count")
      .eq("campaign_id", campaign.id)
      .or(
        `status.eq.new,and(status.eq.no_answer,last_called_at.lt.${retryBefore})`
      )
      .lt("call_count", campaign.max_retries + 1)
      .order("created_at", { ascending: true })
      .limit(campaign.calls_per_minute);

    if (!leads || leads.length === 0) {
      // No more leads — mark campaign completed
      await supabase
        .from("campaigns")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", campaign.id);
      continue;
    }

    for (const lead of leads) {
      // Idempotency check: skip if a dialing record exists in last 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: existing } = await supabase
        .from("campaign_calls")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("lead_id", lead.id)
        .in("status", ["pending", "dialing"])
        .gte("created_at", fiveMinAgo);

      if (existing && existing > 0) continue;

      try {
        const call = await createOutboundCall(lead.phone);

        await supabase.from("campaign_calls").insert({
          campaign_id: campaign.id,
          lead_id: lead.id,
          call_sid: call.id,
          status: "dialing",
          attempt: lead.call_count + 1,
        });

        await supabase
          .from("call_leads")
          .update({
            status: "called",
            last_called_at: new Date().toISOString(),
            call_count: lead.call_count + 1,
          })
          .eq("id", lead.id);

        await supabase
          .from("campaigns")
          .update({
            leads_called: campaign.leads_called + 1,
            leads_remaining: Math.max(0, campaign.leads_remaining - 1),
          })
          .eq("id", campaign.id);

        totalDialed++;
      } catch (err) {
        console.error(`[tick] Failed to call ${lead.phone}:`, err);
        await supabase.from("campaign_calls").insert({
          campaign_id: campaign.id,
          lead_id: lead.id,
          status: "failed",
          attempt: lead.call_count + 1,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, dialed: totalDialed });
}
