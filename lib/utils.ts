import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow, format } from "date-fns";
import type { CallStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTimeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string) {
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function statusColor(status: CallStatus): string {
  const map: Record<CallStatus, string> = {
    "in-progress": "text-success",
    completed: "text-slate-400",
    ringing: "text-warning",
    queued: "text-warning",
    failed: "text-danger",
    busy: "text-danger",
    "no-answer": "text-danger",
    canceled: "text-slate-500",
  };
  return map[status] ?? "text-slate-400";
}

export function statusBadge(status: CallStatus): string {
  const map: Record<CallStatus, string> = {
    "in-progress":
      "bg-success/20 text-success border border-success/30",
    completed:
      "bg-slate-700/50 text-slate-300 border border-slate-600/30",
    ringing:
      "bg-warning/20 text-warning border border-warning/30",
    queued:
      "bg-warning/20 text-warning border border-warning/30",
    failed: "bg-danger/20 text-danger border border-danger/30",
    busy: "bg-danger/20 text-danger border border-danger/30",
    "no-answer":
      "bg-danger/20 text-danger border border-danger/30",
    canceled:
      "bg-slate-700/50 text-slate-500 border border-slate-600/30",
  };
  return map[status] ?? "bg-slate-700/50 text-slate-400";
}
