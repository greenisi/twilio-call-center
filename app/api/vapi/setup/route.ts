/**
 * POST /api/vapi/setup
 *
 * One-time setup: creates Vapi assistants and registers the Twilio phone
 * number with Vapi so inbound calls are handled by the AI agent.
 *
 * Call this once after deploy: curl -X POST https://your-app.railway.app/api/vapi/setup
 */
import { NextResponse } from "next/server";
import {
  vapiRequest,
  getInboundAssistantId,
  getOutboundAssistantId,
  INBOUND_ASSISTANT_CONFIG,
} from "@/lib/vapi";

interface VapiPhoneNumber {
  id: string;
  number: string;
  provider: string;
}

export async function POST() {
  try {
    // 1. Ensure assistants exist
    const [inboundId, outboundId] = await Promise.all([
      getInboundAssistantId(),
      getOutboundAssistantId(),
    ]);

    // 2. Register the Twilio phone number with Vapi (for inbound calls)
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (!twilioNumber || !twilioAccountSid || !twilioAuthToken) {
      return NextResponse.json(
        { error: "Missing Twilio env vars (TWILIO_PHONE_NUMBER, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)" },
        { status: 400 }
      );
    }

    // Check if number is already registered
    const existingNumbers = await vapiRequest<VapiPhoneNumber[]>("/phone-number");
    const alreadyRegistered = existingNumbers.find((n) => n.number === twilioNumber);

    let phoneNumberResult;
    if (alreadyRegistered) {
      // Update the assistant on the existing number
      phoneNumberResult = await vapiRequest(`/phone-number/${alreadyRegistered.id}`, "PATCH", {
        assistantId: inboundId,
        serverUrl: INBOUND_ASSISTANT_CONFIG.serverUrl,
      });
    } else {
      // Import Twilio number into Vapi
      phoneNumberResult = await vapiRequest("/phone-number", "POST", {
        provider: "twilio",
        number: twilioNumber,
        twilioAccountSid,
        twilioAuthToken,
        name: "Cash Annuity Solutions",
        assistantId: inboundId,
        serverUrl: INBOUND_ASSISTANT_CONFIG.serverUrl,
      });
    }

    return NextResponse.json({
      ok: true,
      inboundAssistantId: inboundId,
      outboundAssistantId: outboundId,
      phoneNumber: phoneNumberResult,
    });
  } catch (err) {
    console.error("[Vapi setup] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Setup failed" },
      { status: 500 }
    );
  }
}
