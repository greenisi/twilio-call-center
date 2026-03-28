"use client";

import { useState } from "react";
import {
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Call } from "@/lib/types";
import {
  formatDate,
  formatDuration,
  formatPhone,
  statusBadge,
  cn,
} from "@/lib/utils";

interface CallLogTableProps {
  calls: Call[];
  loading: boolean;
}

export function CallLogTable({ calls, loading }: CallLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-14 bg-navy-800 rounded-lg border border-navy-700 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-16 text-center">
        <p className="text-slate-500 text-sm">No calls found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-navy-700 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <span>Type</span>
        <span>From</span>
        <span>To</span>
        <span>Duration</span>
        <span>Status</span>
        <span>Date</span>
        <span>Actions</span>
      </div>

      <div className="divide-y divide-navy-700/60">
        {calls.map((call) => (
          <div key={call.id}>
            {/* Row */}
            <div
              className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-navy-700/30 transition-colors cursor-pointer"
              onClick={() =>
                setExpandedId(expandedId === call.id ? null : call.id)
              }
            >
              {/* Direction icon */}
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center",
                  call.direction === "inbound" ? "bg-success/15" : "bg-accent/15"
                )}
              >
                {call.direction === "inbound" ? (
                  <PhoneIncoming className="w-3.5 h-3.5 text-success" />
                ) : (
                  <PhoneOutgoing className="w-3.5 h-3.5 text-accent" />
                )}
              </div>

              {/* From */}
              <span className="text-white text-sm font-medium truncate">
                {formatPhone(call.from_number)}
              </span>

              {/* To */}
              <span className="text-slate-300 text-sm truncate">
                {formatPhone(call.to_number)}
              </span>

              {/* Duration */}
              <span className="text-slate-400 text-sm font-mono">
                {formatDuration(call.duration)}
              </span>

              {/* Status */}
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full whitespace-nowrap",
                  statusBadge(call.status)
                )}
              >
                {call.status}
              </span>

              {/* Date */}
              <span className="text-slate-500 text-xs whitespace-nowrap">
                {formatDate(call.created_at)}
              </span>

              {/* Actions */}
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {call.recording_url && (
                  <>
                    <a
                      href={call.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-navy-600 text-slate-400 hover:text-white transition-colors"
                      title="Play recording"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={call.recording_url}
                      download
                      className="p-1.5 rounded-md hover:bg-navy-600 text-slate-400 hover:text-white transition-colors"
                      title="Download recording"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
                <button className="p-1.5 rounded-md hover:bg-navy-600 text-slate-500 hover:text-white transition-colors">
                  {expandedId === call.id ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {expandedId === call.id && (
              <div className="px-5 py-4 bg-navy-900/50 border-t border-navy-700/50 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Call SID</p>
                  <p className="text-slate-300 text-xs font-mono">{call.sid}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Direction</p>
                  <p className="text-white text-sm capitalize">{call.direction}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Duration</p>
                  <p className="text-white text-sm">{formatDuration(call.duration)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Recording</p>
                  {call.recording_url ? (
                    <audio controls className="h-6 w-full" src={call.recording_url} />
                  ) : (
                    <p className="text-slate-500 text-sm">None</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
