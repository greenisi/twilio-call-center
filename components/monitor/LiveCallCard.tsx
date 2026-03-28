"use client";

import { useEffect, useState } from "react";
import { Phone, Clock, Eye, Mic } from "lucide-react";
import type { Call } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

interface LiveCallCardProps {
  call: Call;
}

export function LiveCallCard({ call }: LiveCallCardProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(call.created_at).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [call.created_at]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-navy-800 rounded-xl border border-success/30 p-5 hover:border-success/50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-success text-xs font-semibold uppercase tracking-wider">
            Live
          </span>
        </div>
        <span className="text-accent font-mono text-lg font-bold">{fmt(elapsed)}</span>
      </div>

      {/* Call details */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded bg-navy-700 flex items-center justify-center">
            <Phone className="w-3 h-3 text-slate-400" />
          </div>
          <div>
            <p className="text-slate-500 text-xs">From</p>
            <p className="text-white font-medium">{formatPhone(call.from_number)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded bg-navy-700 flex items-center justify-center">
            <Phone className="w-3 h-3 text-slate-400" />
          </div>
          <div>
            <p className="text-slate-500 text-xs">To</p>
            <p className="text-white font-medium">{formatPhone(call.to_number)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded bg-navy-700 flex items-center justify-center">
            <Clock className="w-3 h-3 text-slate-400" />
          </div>
          <div>
            <p className="text-slate-500 text-xs">Started</p>
            <p className="text-white font-medium">
              {new Date(call.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Direction badge */}
      <div className="mt-4 pt-4 border-t border-navy-700 flex items-center justify-between">
        <span className="text-xs px-2 py-0.5 rounded-full bg-navy-700 text-slate-400 capitalize">
          {call.direction}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-navy-700 hover:bg-navy-600 text-slate-400 hover:text-white transition-colors"
            title="Listen in (whisper)"
          >
            <Eye className="w-3 h-3" />
            Listen
          </button>
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-navy-700 hover:bg-navy-600 text-slate-400 hover:text-white transition-colors"
            title="Barge in"
          >
            <Mic className="w-3 h-3" />
            Barge
          </button>
        </div>
      </div>
    </div>
  );
}
