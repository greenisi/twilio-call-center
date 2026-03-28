import { NextRequest, NextResponse } from "next/server";
import { generateAccessToken } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = body.identity ?? "agent";

    const token = generateAccessToken(identity);
    return NextResponse.json({ token, identity });
  } catch (err) {
    console.error("Token generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Token generation failed" },
      { status: 500 }
    );
  }
}
