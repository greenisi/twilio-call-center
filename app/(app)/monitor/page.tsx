"use client";

import { useEffect, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LiveCallCard } from "@/components/monitor/LiveCallCard";
import type { Call } from "@/lib/types";

export default function MonitorPage() {
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchActive = async () => {
    const res = await fetch("/api/calls?status=in-progress&limit=50");
    const data = await res.json();
    setActiveCalls(data.calls ?? []);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchActive();
    // Poll every 5 seconds
    const id = setInterval(fetchActive, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="animate-fade-in">
      <Header
        title="Live Monitor"
        subtitle={`${activeCalls.length} active call${activeCalls.length !== 1 ? "s" : ""}`}
      />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-slate-400">
              <Radio className="w-4 h-4 text-success" />
              Auto-refreshing every 5s
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchActive}
              className="p-2 rounded-lg bg-navy-800 border border-navy-600 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active calls */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-navy-800 rounded-xl border border-navy-700 animate-pulse" />
            ))}
          </div>
        ) : activeCalls.length === 0 ? (
          <div className="bg-navy-800 rounded-xl border border-navy-700 p-20 text-center">
            <div className="w-14 h-14 rounded-full bg-navy-700 flex items-center justify-center mx-auto mb-4">
              <Radio className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-white font-medium">No Active Calls</p>
            <p className="text-slate-500 text-sm mt-1">
              Live calls will appear here automatically
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeCalls.map((call) => (
              <LiveCallCard key={call.id} call={call} />
            ))}
          </div>
        )}

        {/* Stats bar */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
          <h3 className="text-white font-semibold mb-4">Session Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active Calls", value: activeCalls.length, color: "text-success" },
              {
                label: "Inbound",
                value: activeCalls.filter((c) => c.direction === "inbound").length,
                color: "text-accent",
              },
              {
                label: "Outbound",
                value: activeCalls.filter((c) => c.direction === "outbound").length,
                color: "text-accent-light",
              },
              { label: "Agents Busy", value: activeCalls.length, color: "text-warning" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
