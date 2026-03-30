import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai";

const GEMINI_MODEL = "gemini-3.1-flash-live-preview";
const SESSION_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes — Gemini idle timeout is ~10m

const INBOUND_PROMPT = `You are Sarah, a professional sales agent for Cash Annuity Solutions — a company that helps people turn their structured settlement or annuity payments into a lump sum of cash right now.

The caller reached out to us. Your goal: qualify them and book an appointment with a senior advisor.

Key facts about our service:
- We help people with structured settlements, lottery annuities, workers' comp, and personal injury settlements
- Get cash NOW instead of waiting years for payments
- 0 hidden fees — 100% clear cash offer upfront
- Court-approved, legally protected process
- Average funding within 45 days
- Sell all or just part of your payments — flexible

Conversation flow:
1. Wait for the caller to speak first. Do NOT say anything until they do.
2. Once they speak, warmly respond and find out what type of settlement or annuity they have
3. Ask what they'd use the money for (qualify the need — debt, medical, home, etc.)
4. Briefly explain the benefits and process
5. Offer a free, no-obligation cash offer from a senior advisor
6. Collect their name and best callback number to schedule

Be conversational and empathetic. Keep responses brief — this is a phone call. If they're not interested, thank them and end warmly.`;

const OUTBOUND_PROMPT = `You are Sarah, a professional outbound sales agent for Cash Annuity Solutions — a company that helps people turn their structured settlement or annuity payments into a lump sum of cash right now.

You are making an outbound call to someone who may have a structured settlement or annuity. Your goal: see if they're interested and qualify them for a free cash offer.

Key facts:
- We help people with structured settlements, lottery annuities, workers' comp, and personal injury settlements get their money NOW
- 0 hidden fees — 100% clear offer upfront
- Court-approved, legally protected
- Average funding within 45 days
- Sell all or part of payments

Conversation flow:
1. Introduce yourself: "Hi, this is Sarah from Cash Annuity Solutions. I'm reaching out because we help people who have structured settlement or annuity payments get access to their cash sooner. Is that something that might be of interest to you?"
2. If interested — ask what type of settlement they have and what they'd use the funds for
3. Explain the quick, no-hassle process
4. Offer to connect them with a senior advisor for a free cash offer
5. Collect their name and best time to call back

Be warm and respectful of their time. Never be pushy. If not interested, thank them and end the call.`;

export interface AcquiredSession {
  session: Session;
  setMessageHandler: (fn: (msg: LiveServerMessage) => void) => void;
  setCloseHandler: (fn: (e: { code: number }) => void) => void;
}

interface PoolSlot {
  callType: string;
  createdAt: number;
  entry: Promise<AcquiredSession>;
}

const slots: PoolSlot[] = [];

function getPrompt(callType: string) {
  return callType === "outbound" ? OUTBOUND_PROMPT : INBOUND_PROMPT;
}

function createSession(callType: string): Promise<AcquiredSession> {
  return new Promise(async (resolve, reject) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return reject(new Error("GOOGLE_API_KEY not set"));

    const ai = new GoogleGenAI({ apiKey });
    let messageHandler: ((msg: LiveServerMessage) => void) | null = null;
    let closeHandler: ((e: { code: number }) => void) | null = null;

    try {
      const session = await ai.live.connect({
        model: GEMINI_MODEL,
        callbacks: {
          onopen: () => console.log(`[Pool] Session warmed (${callType})`),
          onmessage: (msg) => messageHandler?.(msg),
          onerror: (e) => console.error("[Pool] Session error:", e),
          onclose: (e) => {
            closeHandler?.({ code: e.code });
            // Drop from pool if still idle (not yet acquired)
            const idx = slots.findIndex((s) => {
              let resolved: AcquiredSession | undefined;
              s.entry.then((r) => { resolved = r; });
              return resolved?.session === session;
            });
            if (idx !== -1) {
              slots.splice(idx, 1);
              console.log(`[Pool] Idle session closed — refilling (${callType})`);
              slots.push({ callType, createdAt: Date.now(), entry: createSession(callType) });
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: getPrompt(callType) }] },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              prefixPaddingMs: 20,
              silenceDurationMs: 200,
            },
          },
        },
      });

      resolve({
        session,
        setMessageHandler: (fn) => { messageHandler = fn; },
        setCloseHandler: (fn) => { closeHandler = fn; },
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function initPool() {
  // Pre-warm 2 inbound + 1 outbound
  slots.push({ callType: "inbound",  createdAt: Date.now(), entry: createSession("inbound") });
  slots.push({ callType: "inbound",  createdAt: Date.now(), entry: createSession("inbound") });
  slots.push({ callType: "outbound", createdAt: Date.now(), entry: createSession("outbound") });
  console.log("[Pool] Warming 3 Gemini sessions...");

  // Periodically replace sessions approaching the age limit
  setInterval(() => {
    const now = Date.now();
    for (let i = slots.length - 1; i >= 0; i--) {
      if (now - slots[i].createdAt > SESSION_MAX_AGE_MS) {
        const { callType } = slots[i];
        slots[i].entry.then((s) => s.session.close()).catch(() => {});
        slots.splice(i, 1);
        slots.push({ callType, createdAt: now, entry: createSession(callType) });
        console.log(`[Pool] Refreshed stale session (${callType})`);
      }
    }
  }, 60_000);
}

export async function acquireSession(callType: string): Promise<AcquiredSession> {
  const idx = slots.findIndex((s) => s.callType === callType);
  if (idx !== -1) {
    const slot = slots.splice(idx, 1)[0];
    // Immediately queue a replacement
    slots.push({ callType, createdAt: Date.now(), entry: createSession(callType) });
    console.log(`[Pool] Acquired session (${callType}), pool size: ${slots.length}`);
    try {
      return await slot.entry;
    } catch (err) {
      console.error("[Pool] Pooled session failed, creating fresh:", err);
      return createSession(callType);
    }
  }

  console.log(`[Pool] No warm session for ${callType} — creating fresh`);
  return createSession(callType);
}
