"use client";

import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentCalls } from "@/components/dashboard/RecentCalls";
import { useCallStats, useCalls } from "@/hooks/useCalls";

export default function DashboardPage() {
  const { stats, loading: statsLoading } = useCallStats();
  const { calls, loading: callsLoading } = useCalls();

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
