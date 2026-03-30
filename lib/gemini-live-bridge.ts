import { WebSocket } from "ws";
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai";
import { mulaw } from "alawmulaw";
import { getSupabaseAdmin } from "./supabase-server";

const GEMINI_MODEL = "gemini-3.1-flash-live-preview";

// Twilio mulaw 8kHz → Gemini PCM16 16kHz (base64)
function twilioToGemini(mulawBuf: Buffer): string {
  const pcm8k = mulaw.decode(mulawBuf);
  const pcm16k = new Int16Array(pcm8k.length * 2);
  for (let i = 0; i < pcm8k.length; i++) {
    pcm16k[i * 2] = pcm8k[i];
    pcm16k[i * 2 + 1] =
      i + 1 < pcm8k.length ? Math.round((pcm8k[i] + pcm8k[i + 1]) / 2) : pcm8k[i];
  }
  return Buffer.from(pcm16k.buffer).toString("base64");
}

// Gemini PCM16 24kHz → Twilio mulaw 8kHz
function geminiToTwilio(base64Audio: string): Buffer {
  const raw = Buffer.from(base64Audio, "base64");
  const pcm24k = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2);
  const pcm8k = new Int16Array(Math.floor(pcm24k.length / 3));
  for (let i = 0; i < pcm8k.length; i++) {
    pcm8k[i] = pcm24k[i * 3];
  }
  return Buffer.from(mulaw.encode(pcm8k));
}

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
1. Warmly ask how you can help them today
2. Find out what type of settlement or annuity they have
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

export async function handleTwilioMediaStream(twilioWs: WebSocket, callType = "inbound") {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("[Bridge] GOOGLE_API_KEY not set");
    twilioWs.close();
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = callType === "outbound" ? OUTBOUND_PROMPT : INBOUND_PROMPT;
  let session: Session | null = null;
  let streamSid: string | null = null;
  let callSid: string | null = null;
  let isModelSpeaking = false;
  const transcript: { role: string; text: string }[] = [];

  // Buffer Twilio messages that arrive before Gemini is ready
  const messageQueue: string[] = [];
  let geminiReady = false;

  function processMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);
      if (msg.event === "start") {
        streamSid = msg.start.streamSid;
        callSid = msg.start.callSid;
        console.log(`[Bridge] Stream started sid=${streamSid}`);
      } else if (msg.event === "media" && session) {
        // If model is currently speaking and user starts talking, clear buffer immediately
        if (isModelSpeaking && streamSid && twilioWs.readyState === WebSocket.OPEN) {
          isModelSpeaking = false;
          twilioWs.send(JSON.stringify({ event: "clear", streamSid }));
        }
        const pcm = twilioToGemini(Buffer.from(msg.media.payload, "base64"));
        session.sendRealtimeInput({ audio: { data: pcm, mimeType: "audio/pcm;rate=16000" } });
      } else if (msg.event === "stop") {
        console.log("[Bridge] Stream stopped");
        session?.close();
        handleCallEnd(callSid, transcript);
      }
    } catch (err) {
      console.error("[Bridge] Message error:", err);
    }
  }

  // Set up Twilio handler immediately (BEFORE awaiting Gemini)
  twilioWs.on("message", (data: Buffer) => {
    const raw = data.toString();
    if (!geminiReady) {
      messageQueue.push(raw);
    } else {
      processMessage(raw);
    }
  });

  twilioWs.on("close", () => {
    session?.close();
    handleCallEnd(callSid, transcript);
  });

  twilioWs.on("error", (err) => {
    console.error("[Bridge] Twilio WS error:", err);
    session?.close();
  });

  function onGeminiMessage(msg: LiveServerMessage) {
    if (!streamSid || twilioWs.readyState !== WebSocket.OPEN) return;

    // User interrupted — clear Twilio's audio buffer immediately
    if (msg.serverContent?.interrupted) {
      console.log("[Bridge] Barge-in detected — clearing Twilio buffer");
      isModelSpeaking = false;
      twilioWs.send(JSON.stringify({ event: "clear", streamSid }));
      return;
    }

    // Send audio chunks to Twilio
    if (msg.serverContent?.modelTurn?.parts) {
      for (const part of msg.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          try {
            isModelSpeaking = true;
            const mulawBuf = geminiToTwilio(part.inlineData.data);
            twilioWs.send(
              JSON.stringify({
                event: "media",
                streamSid,
                media: { payload: mulawBuf.toString("base64") },
              })
            );
          } catch (err) {
            console.error("[Bridge] Audio convert error:", err);
          }
        }
      }
    }

    // Model finished speaking
    if (msg.serverContent?.turnComplete) {
      isModelSpeaking = false;
    }

    const inputTx = msg.serverContent?.inputTranscription?.text;
    if (inputTx) transcript.push({ role: "user", text: inputTx });
    const outputTx = msg.serverContent?.outputTranscription?.text;
    if (outputTx) transcript.push({ role: "assistant", text: outputTx });
  }

  try {
    // Connect to Gemini
    session = await ai.live.connect({
      model: GEMINI_MODEL,
      callbacks: {
        onopen: () => console.log("[Bridge] Gemini connected"),
        onmessage: onGeminiMessage,
        onerror: (e) => console.error("[Bridge] Gemini error:", e),
        onclose: (e) => console.log("[Bridge] Gemini closed:", e.code),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: { parts: [{ text: systemPrompt }] },
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

    // Gemini is ready — drain buffered messages
    geminiReady = true;
    console.log(`[Bridge] Draining ${messageQueue.length} buffered messages`);
    for (const raw of messageQueue) {
      processMessage(raw);
    }
    messageQueue.length = 0;

  } catch (err) {
    console.error("[Bridge] Failed to connect to Gemini:", err);
    twilioWs.close();
  }
}

async function handleCallEnd(
  callSid: string | null,
  transcript: { role: string; text: string }[]
) {
  if (!callSid || transcript.length === 0) return;
  try {
    const apiKey = process.env.GOOGLE_API_KEY!;
    const ai = new GoogleGenAI({ apiKey });
    const transcriptText = transcript
      .map((t) => `${t.role === "user" ? "Caller" : "Agent"}: ${t.text}`)
      .join("\n");

    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Summarize this call center conversation in 2-3 sentences.\n\n${transcriptText}`,
            },
          ],
        },
      ],
    });

    const supabase = getSupabaseAdmin();
    await supabase
      .from("calls")
      .update({ transcript: transcriptText, summary: res.text ?? "", status: "completed" })
      .eq("sid", callSid);

    console.log(`[Bridge] Saved summary for ${callSid}`);
  } catch (err) {
    console.error("[Bridge] Summary error:", err);
  }
}
