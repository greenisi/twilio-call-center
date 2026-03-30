import { WebSocket } from "ws";
import { GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import { mulaw } from "alawmulaw";
import { getSupabaseAdmin } from "./supabase-server";
import { acquireSession } from "./gemini-session-pool";

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

export async function handleTwilioMediaStream(twilioWs: WebSocket, callType = "inbound") {
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
    // Grab a pre-warmed session from the pool (near-instant)
    const acquired = await acquireSession(callType);
    session = acquired.session;
    acquired.setMessageHandler(onGeminiMessage);
    acquired.setCloseHandler((e) => console.log("[Bridge] Gemini closed:", e.code));

    // Gemini is ready — drain buffered messages
    geminiReady = true;
    console.log(`[Bridge] Session acquired, draining ${messageQueue.length} buffered messages`);
    for (const raw of messageQueue) {
      processMessage(raw);
    }
    messageQueue.length = 0;

  } catch (err) {
    console.error("[Bridge] Failed to acquire Gemini session:", err);
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
