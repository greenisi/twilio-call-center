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
  provider: "vapi",
  voiceId: "Chloe",
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

let _inboundId: string | null = null;
let _outboundId: string | null = null;

async function findOrCreateAssistant(
  config: typeof INBOUND_ASSISTANT_CONFIG
): Promise<string> {
  // Look for existing assistant by name
  const list = await vapiRequest<VapiAssistant[]>("/assistant");
  const existing = list.find((a) => a.name === config.name);
  if (existing) return existing.id;

  // Create if not found
  const created = await vapiRequest<VapiAssistant>("/assistant", "POST", config);
  console.log(`[Vapi] Created assistant "${config.name}" → ${created.id}`);
  return created.id;
}

export async function getInboundAssistantId(): Promise<string> {
  if (!_inboundId) _inboundId = await findOrCreateAssistant(INBOUND_ASSISTANT_CONFIG);
  return _inboundId;
}

export async function getOutboundAssistantId(): Promise<string> {
  if (!_outboundId) _outboundId = await findOrCreateAssistant(OUTBOUND_ASSISTANT_CONFIG);
  return _outboundId;
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
