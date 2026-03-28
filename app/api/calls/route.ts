import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") ?? "100");

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("calls")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (direction) query = query.eq("direction", direction);
    if (status) query = query.eq("status", status);
    if (search) {
      query = query.or(
        `from_number.ilike.%${search}%,to_number.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ calls: data ?? [] });
  } catch (err) {
    console.error("GET /api/calls error:", err);
    return NextResponse.json({ calls: [], error: String(err) }, { status: 500 });
  }
}
