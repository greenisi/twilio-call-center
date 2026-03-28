"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Pause, Play, PhoneOff } from "lucide-react";
import type { ActiveCallState } from "@/hooks/useTwilioDevice";
import { cn } from "@/lib/utils";

interface CallControlsProps {
  call: ActiveCallState;
  onMute: () => void;
  onHold: () => void;
  onHangUp: () => void;
}

export function CallControls({ call, onMute, onHold, onHangUp }: CallControlsProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!call.startTime) return;
    const start = call.startTime.getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [call.startTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Call info */}
      <div className="bg-navy-950 rounded-xl p-4 border border-navy-600 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              call.onHold ? "bg-warning" : "bg-success animate-pulse"
            )}
          />
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
            {call.onHold ? "On Hold" : call.direction === "inbound" ? "Incoming" : "Connected"}
          </span>
        </div>
        <p className="text-white font-semibold">
          {call.direction === "outbound" ? call.to : call.from}
        </p>
        <p className="text-accent text-2xl font-mono font-bold mt-1">
          {formatTime(elapsed)}
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onMute}
          className={cn(
            "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150",
            call.muted
              ? "bg-warning/20 border-warning/40 text-warning"
              : "bg-navy-800 border-navy-600 text-slate-300 hover:border-accent/30 hover:text-white"
          )}
        >
          {call.muted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          <span className="text-xs font-medium">
            {call.muted ? "Unmute" : "Mute"}
          </span>
        </button>

        <button
          onClick={onHold}
          className={cn(
            "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150",
            call.onHold
              ? "bg-warning/20 border-warning/40 text-warning"
              : "bg-navy-800 border-navy-600 text-slate-300 hover:border-accent/30 hover:text-white"
          )}
        >
          {call.onHold ? (
            <Play className="w-5 h-5" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
          <span className="text-xs font-medium">
            {call.onHold ? "Resume" : "Hold"}
          </span>
        </button>
      </div>

      {/* Hang up */}
      <button
        onClick={onHangUp}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-danger hover:bg-danger/90 text-white font-semibold transition-all duration-150 shadow-lg shadow-danger/20"
      >
        <PhoneOff className="w-5 h-5" />
        End Call
      </button>
    </div>
  );
}
