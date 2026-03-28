export type CallDirection = "inbound" | "outbound";

export type CallStatus =
  | "queued"
  | "ringing"
  | "in-progress"
  | "completed"
  | "failed"
  | "busy"
  | "no-answer"
  | "canceled";

export interface Call {
  id: string;
  sid: string;
  from_number: string;
  to_number: string;
  direction: CallDirection;
  status: CallStatus;
  duration: number | null;
  recording_url: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  company: string | null;
  notes: string | null;
  created_at: string;
}

export interface Settings {
  id?: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  twilio_twiml_app_sid?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
  created_at: string;
}

export interface CallStats {
  total: number;
  inbound: number;
  outbound: number;
  missed: number;
  avgDuration: number;
  activeNow: number;
}
