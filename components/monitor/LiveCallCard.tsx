"use client";

import { useState, useEffect } from "react";
import { Phone, PhoneOff, Ear, MessageSquare, Users, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Call } from "@/lib/types";
import { cn } from "@/lib/utils";

type MonitorMode = "off" | "listen" | "whisper" | "barge";

export function LiveCallCard({ call }: { call: Call }) {
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<MonitorMode>("off");
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const start = new Date(call.created_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [call.created_at]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleMonitor = async (newMode: MonitorMode) => {
    if (newMode === mode) { setMode("off"); return; }
    setLoading(true);
    try {
      const endpoint = newMode === "listen" ? "listen" : newMode === "whisper" ? "whisper" : "barge";
      await fetch(`/api/calls/${call.id}/${endpoint}`, { method: "POST" });
      setMode(newMode);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleEnd = async () => {
    if (!confirm("End this call?")) return;
    await fetch(`/api/calls/${call.id}/end`, { method: "POST" });
  };

  const isInbound = call.direction === "inbound";

  return (
    <div className={cn(
      "bg-navy-800 rounded-xl border p-4 md:p-5 transition-all",
      mode !== "off" ? "border-accent shadow-lg shadow-accent/10" : "border-navy-700"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", call.status === "in-progress" ? "bg-emerald-500" : "bg-yellow-500")} />
          <span className="text-white font-semibold text-sm">{call.status === "in-progress" ? "Connected" : "Ringing"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{fmt(elapsed)}</span>
        </div>
      </div>

      {/* Caller Info */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isInbound ? "bg-blue-500/20" : "bg-emerald-500/20")}>
          {isInbound ? <ArrowDownLeft className="w-5 h-5 text-blue-400" /> : <ArrowUpRight className="w-5 h-5 text-emerald-400" />}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{call.from_number}</p>
          <p className="text-slate-500 text-xs">→ {call.to_number}</p>
        </div>
      </div>

      {/* Audio Waveform (visual only) */}
      {mode !== "off" && (
        <div className="flex items-center gap-0.5 h-8 mb-4 px-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-accent/60 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: `${0.3 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Monitor Mode indicator */}
      {mode !== "off" && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
          <Ear className="w-4 h-4 text-accent animate-pulse" />
          <span className="text-accent text-xs font-medium">
            {mode === "listen" ? "Listening..." : mode === "whisper" ? "Whisper Mode" : "Barged In"}
          </span>
        </div>
      )}

      {/* Monitor Controls */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => handleMonitor("listen")}
          disabled={loading}
          className={cn(
            "flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium transition-all min-h-[56px]",
            mode === "listen" ? "bg-accent text-white" : "bg-navy-700 text-slate-400 hover:text-white hover:bg-navy-600"
          )}
        >
          <Ear className="w-5 h-5" />
          Listen
        </button>
        <button
          onClick={() => handleMonitor("whisper")}
          disabled={loading}
          className={cn(
            "flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium transition-all min-h-[56px]",
            mode === "whisper" ? "bg-amber-500 text-white" : "bg-navy-700 text-slate-400 hover:text-white hover:bg-navy-600"
          )}
        >
          <MessageSquare className="w-5 h-5" />
          Whisper
        </button>
        <button
          onClick={() => handleMonitor("barge")}
          disabled={loading}
          className={cn(
            "flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium transition-all min-h-[56px]",
            mode === "barge" ? "bg-red-500 text-white" : "bg-navy-700 text-slate-400 hover:text-white hover:bg-navy-600"
          )}
        >
          <Users className="w-5 h-5" />
          Barge
        </button>
      </div>

      {/* Details Toggle */}
      <button onClick={() => setShowDetails(!showDetails)} className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors">
        {showDetails ? "Hide Details" : "Show Details"}
      </button>

      {showDetails && (
        <div className="mt-3 space-y-3 border-t border-navy-700 pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-slate-500">Call SID</span><p className="text-slate-300 font-mono truncate">{call.sid || call.id}</p></div>
            <div><span className="text-slate-500">Direction</span><p className="text-slate-300 capitalize">{call.direction}</p></div>
            <div><span className="text-slate-500">Started</span><p className="text-slate-300">{new Date(call.created_at).toLocaleTimeString()}</p></div>
            <div><span className="text-slate-500">Duration</span><p className="text-slate-300 font-mono">{fmt(elapsed)}</p></div>
          </div>
          <div>
            <label className="text-slate-500 text-xs block mb-1">Call Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this call..."
              className="w-full bg-navy-950 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent min-h-[60px] resize-none"
            />
          </div>
          <button onClick={handleEnd} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors min-h-[44px]">
            <PhoneOff className="w-4 h-4" /> End Call
          </button>
        </div>
      )}
    </div>
  );
}
