"use client";

import Link from "next/link";
import { PhoneIncoming, PhoneOutgoing, Play, ArrowRight } from "lucide-react";
import type { Call } from "@/lib/types";
import { formatTimeAgo, formatDuration, formatPhone, statusBadge } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RecentCallsProps {
  calls: Call[];
  loading: boolean;
}

export function RecentCalls({ calls, loading }: RecentCallsProps) {
  if (loading) {
    return (
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
        <h2 className="text-white font-semibold mb-4">Recent Calls</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-navy-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-700">
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700">
        <h2 className="text-white font-semibold">Recent Calls</h2>
        <Link
          href="/calls"
          className="text-accent text-sm hover:text-accent-light flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {calls.length === 0 ? (
        <div className="px-5 py-10 text-center text-slate-500 text-sm">
          No calls yet
        </div>
      ) : (
        <div className="divide-y divide-navy-700">
          {calls.slice(0, 8).map((call) => (
            <div
              key={call.id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-navy-700/40 transition-colors"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  call.direction === "inbound"
                    ? "bg-success/15"
                    : "bg-accent/15"
                )}
              >
                {call.direction === "inbound" ? (
                  <PhoneIncoming
                    className={cn(
                      "w-4 h-4",
                      call.status === "no-answer" || call.status === "busy"
                        ? "text-danger"
                        : "text-success"
                    )}
                  />
                ) : (
                  <PhoneOutgoing className="w-4 h-4 text-accent" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {call.direction === "inbound"
                    ? formatPhone(call.from_number)
                    : formatPhone(call.to_number)}
                </p>
                <p className="text-slate-500 text-xs">{formatTimeAgo(call.created_at)}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-400 text-xs font-mono">
                  {formatDuration(call.duration)}
                </span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", statusBadge(call.status))}>
                  {call.status}
                </span>
                {call.recording_url && (
                  <a
                    href={call.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-navy-600 text-slate-400 hover:text-white transition-colors"
                    title="Play recording"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
