const BASE = "https://api.vapi.ai";

function apiHeaders() {
  return {
    Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function vapiRequest<T = unknown>(
  path: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: apiHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Vapi ${method} ${path} → ${res.status}: ${text}`);
  return JSON.parse(text) as T;
}

// ─── Assistant Prompts ────────────────────────────────────────────────────────

const INBOUND_SYSTEM_PROMPT = `You are Sarah, a professional sales agent for Cash Annuity Solutions — a company that helps people turn their structured settlement or annuity payments into a lump sum of cash right now.

The caller reached out to us. Your goal: qualify them and book an appointment with a senior advisor.

Key facts about our service:
- We help people with structured settlements, lottery annuities, workers' comp, and personal injury settlements
- Get cash NOW instead of waiting years for payments
- 0 hidden fees — 100% clear cash offer upfront
- Court-approved, legally protected process
- Average funding within 45 days
- Sell all or just part of your payments — flexible

Conversation flow:
1. Warmly greet the caller and ask how you can help
2. Find out what type of settlement or annuity they have
3. Ask what they'd use the money for (qualify the need — debt, medical, home, etc.)
4. Briefly explain the benefits and process
5. Offer a free, no-obligation cash offer from a senior advisor
6. Collect their name and best callback number to schedule

Be conversational and empathetic. Keep responses brief — this is a phone call. If they're not interested, thank them and end warmly.`;

const OUTBOUND_SYSTEM_PROMPT = `You are Sarah, a professional outbound sales agent for Cash Annuity Solutions — a company that helps people turn their structured settlement or annuity payments into a lump sum of cash right now.

You are making an outbound call. Your goal: see if they're interested and qualify them for a free cash offer.

Key facts:
- We help people with structured settlements, lottery annuities, workers' comp, and personal injury settlements get their money NOW
- 0 hidden fees — 100% clear offer upfront
- Court-approved, legally protected
- Average funding within 45 days
- Sell all or part of payments

Conversation flow:
1. You have already introduced yourself (the first message is handled). Continue from there.
2. If interested — ask what type of settlement they have and what they'd use the funds for
3. Explain the quick, no-hassle process
4. Offer to connect them with a senior advisor for a free cash offer
5. Collect their name and best time to call back

Be warm and respectful of their time. Never be pushy. If not interested, thank them and end the call.`;

// ─── Assistant Configs ────────────────────────────────────────────────────────
// Model: Google Gemini 2.0 Flash (add your Google API key in Vapi dashboard → Provider Keys → Google)
// Voice: Vapi native "Chloe" — no external API key required

const VOICE_CONFIG = {
  provider: "11labs",
  voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica — most realistic female voice
  model: "eleven_turbo_v2_5",
  stability: 0.5,
  similarityBoost: 0.75,
};

const MODEL_CONFIG = (systemPrompt: string) => ({
  provider: "google",
  model: "gemini-2.0-flash-001",
  systemPrompt,
  temperature: 0.7,
});

export const INBOUND_ASSISTANT_CONFIG = {
  name: "Sarah - Cash Annuity Inbound",
  firstMessageMode: "assistant-waits-for-user",
  model: MODEL_CONFIG(INBOUND_SYSTEM_PROMPT),
  voice: VOICE_CONFIG,
  endCallMessage: "Thank you for calling Cash Annuity Solutions. Have a great day!",
  endCallFunctionEnabled: true,
  backgroundDenoisingEnabled: true,
  serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
};

export const OUTBOUND_ASSISTANT_CONFIG = {
  name: "Sarah - Cash Annuity Outbound",
  firstMessage:
    "Hi, this is Sarah calling from Cash Annuity Solutions. I'm reaching out because we help people with structured settlements get access to their cash sooner. Is that something that might interest you?",
  firstMessageMode: "assistant-speaks-first",
  model: MODEL_CONFIG(OUTBOUND_SYSTEM_PROMPT),
  voice: VOICE_CONFIG,
  endCallMessage: "Thank you for your time. Have a great day!",
  endCallFunctionEnabled: true,
  backgroundDenoisingEnabled: true,
  serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
};

// ─── Lazy Assistant ID Cache ──────────────────────────────────────────────────

interface VapiAssistant {
  id: string;
  name: string;
}

// Pre-created assistant IDs (created via Vapi API on 2026-03-30)
const INBOUND_ASSISTANT_ID  = "9fd22eb4-7e32-4b60-b346-747c628ed7a8";
const OUTBOUND_ASSISTANT_ID = "434f9178-2994-41ef-90d9-b2507b5f2d30";

export async function getInboundAssistantId(): Promise<string> {
  return INBOUND_ASSISTANT_ID;
}

export async function getOutboundAssistantId(): Promise<string> {
  return OUTBOUND_ASSISTANT_ID;
}

// ─── Create Outbound Call ─────────────────────────────────────────────────────

export async function createOutboundCall(toNumber: string): Promise<{ id: string }> {
  const assistantId = await getOutboundAssistantId();

  return vapiRequest<{ id: string }>("/call", "POST", {
    assistantId,
    phoneNumber: {
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      number: process.env.TWILIO_PHONE_NUMBER,
    },
    customer: {
      number: toNumber,
    },
  });
}
