import twilio from "twilio";

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  return twilio(accountSid, authToken);
}

export function generateAccessToken(identity: string): string {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID!;

  if (!accountSid || !authToken || !twimlAppSid) {
    throw new Error("Twilio credentials or TwiML App SID not configured");
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  const token = new AccessToken(accountSid, authToken, twimlAppSid, {
    identity,
    ttl: 3600, // 1 hour
  });

  token.addGrant(voiceGrant);
  return token.toJwt();
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
  return phone.startsWith("+") ? phone : `+${cleaned}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
