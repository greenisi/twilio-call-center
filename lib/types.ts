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

export type LeadStatus =
  | "new"
  | "called"
  | "interested"
  | "not_interested"
  | "no_answer"
  | "callback"
  | "dnc";

export type LeadSource = "manual" | "csv" | "webhook" | "paste";

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  notes: string | null;
  source: LeadSource;
  status: LeadStatus;
  last_called_at: string | null;
  call_count: number;
  campaign_id: string | null;
  created_at: string;
}

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  timezone: string;
  schedule_days: string[];
  schedule_start: string;
  schedule_end: string;
  calls_per_minute: number;
  max_retries: number;
  retry_delay_hours: number;
  total_leads: number;
  leads_called: number;
  leads_remaining: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignCall {
  id: string;
  campaign_id: string;
  lead_id: string;
  call_sid: string | null;
  status: "pending" | "dialing" | "completed" | "failed" | "skipped";
  attempt: number;
  created_at: string;
}
