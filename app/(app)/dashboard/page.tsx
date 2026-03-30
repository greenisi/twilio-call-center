"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentCalls } from "@/components/dashboard/RecentCalls";
import { useCallStats, useCalls } from "@/hooks/useCalls";

export default function DashboardPage() {
  const { stats, loading: statsLoading } = useCallStats();
  const { calls, loading: callsLoading } = useCalls();
  const [dialNumber, setDialNumber] = useState("");
  const [dialing, setDialing] = useState(false);
  const [dialStatus, setDialStatus] = useState("");

  const handleQuickDial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialNumber.trim()) return;
    setDialing(true);
    setDialStatus("");
    try {
      const res = await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: dialNumber.trim() }),
      });
      if (res.ok) {
        setDialStatus("Calling...");
        setDialNumber("");
        setTimeout(() => setDialStatus(""), 3000);
      } else {
        setDialStatus("Failed to place call");
      }
    } catch {
      setDialStatus("Error placing call");
    } finally {
      setDialing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="Dashboard"
        subtitle="Call center overview"
      />

      <div className="p-6 space-y-6">
        <StatsCards stats={stats} loading={statsLoading} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentCalls calls={calls} loading={callsLoading} />
          </div>

          <div className="space-y-4">
            {/* Quick Dial */}
            <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
              <h2 className="text-white font-semibold mb-3">Quick AI Dial</h2>
              <form onSubmit={handleQuickDial} className="space-y-2">
                <input
                  type="tel"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="+1 (912) 555-0000"
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={dialing || !dialNumber.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  {dialing ? "Calling..." : "Call with AI (Sarah)"}
                </button>
                {dialStatus && (
                  <p className="text-emerald-400 text-xs text-center">{dialStatus}</p>
                )}
              </form>
            </div>

            {/* Quick Actions */}
            <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
              <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href="/softphone"
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent transition-colors text-sm font-medium"
                >
                  <span className="text-lg">📞</span>
                  Open Softphone
                </a>
                <a
                  href="/calls"
                  className="flex items-center gap-3 p-3 rounded-lg bg-navy-700 hover:bg-navy-600 border border-navy-600 text-slate-300 transition-colors text-sm font-medium"
                >
                  <span className="text-lg">📋</span>
                  View All Call Logs
                </a>
                <a
                  href="/contacts"
                  className="flex items-center gap-3 p-3 rounded-lg bg-navy-700 hover:bg-navy-600 border border-navy-600 text-slate-300 transition-colors text-sm font-medium"
                >
                  <span className="text-lg">👥</span>
                  Manage Contacts
                </a>
                <a
                  href="/monitor"
                  className="flex items-center gap-3 p-3 rounded-lg bg-navy-700 hover:bg-navy-600 border border-navy-600 text-slate-300 transition-colors text-sm font-medium"
                >
                  <span className="text-lg">📡</span>
                  Live Monitor
                </a>
              </div>
            </div>

            {/* Status Summary */}
            <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
              <h2 className="text-white font-semibold mb-3">System Status</h2>
              <div className="space-y-2.5">
                {[
                  { label: "Twilio API", ok: true },
                  { label: "Supabase DB", ok: true },
                  { label: "Recording Service", ok: true },
                  { label: "Webhooks", ok: true },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ok
                          ? "bg-success/15 text-success"
                          : "bg-danger/15 text-danger"
                      }`}
                    >
                      {ok ? "Operational" : "Down"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
