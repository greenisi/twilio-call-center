"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { useCalls } from "@/hooks/useCalls";
import { formatPhone, formatDuration, formatTimeAgo, statusBadge } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PhoneCall } from "lucide-react";

// Twilio Voice SDK requires browser environment
const Softphone = dynamic(
  () => import("@/components/softphone/Softphone").then((m) => m.Softphone),
  { ssr: false, loading: () => <SoftphoneSkeleton /> }
);

function SoftphoneSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-navy-800 rounded-2xl border border-navy-600 h-96 animate-pulse" />
    </div>
  );
}

export default function SoftphonePage() {
  const { calls, loading } = useCalls({ status: "completed" });
  const recent = calls.slice(0, 6);

  return (
    <div className="animate-fade-in">
      <Header title="Softphone" subtitle="Make and receive calls from your browser" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Softphone */}
          <div className="lg:col-span-2">
            <Softphone />
          </div>

          {/* Recent + contacts */}
          <div className="lg:col-span-3 space-y-4">
            {/* Setup instructions */}
            <div className="bg-navy-800 rounded-xl border border-accent/30 p-5">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
                <PhoneCall className="w-4 h-4 text-accent" />
                Setup Required
              </h3>
              <ol className="space-y-2 text-sm text-slate-400">
                <li className="flex gap-2">
                  <span className="text-accent font-bold">1.</span>
                  Go to <a href="/settings" className="text-accent hover:underline">Settings</a> and add your Twilio credentials
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">2.</span>
                  Create a TwiML App in Twilio Console with Voice URL:{" "}
                  <code className="bg-navy-700 px-1.5 py-0.5 rounded text-xs text-white">
                    {typeof window !== "undefined" ? window.location.origin : "https://yourapp.com"}/api/calls/voice
                  </code>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">3.</span>
                  Set your Twilio phone number&apos;s incoming webhook to:{" "}
                  <code className="bg-navy-700 px-1.5 py-0.5 rounded text-xs text-white">
                    /api/calls/incoming
                  </code>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">4.</span>
                  Click &quot;Reconnect Device&quot; on the softphone to initialize
                </li>
              </ol>
            </div>

            {/* Recent calls */}
            <div className="bg-navy-800 rounded-xl border border-navy-700">
              <div className="px-5 py-4 border-b border-navy-700">
                <h3 className="text-white font-semibold">Recent Activity</h3>
              </div>
              {loading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-navy-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No recent calls</div>
              ) : (
                <div className="divide-y divide-navy-700">
                  {recent.map((call) => (
                    <div key={call.id} className="flex items-center gap-3 px-5 py-3 hover:bg-navy-700/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {formatPhone(call.direction === "inbound" ? call.from_number : call.to_number)}
                        </p>
                        <p className="text-slate-500 text-xs">{formatTimeAgo(call.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-mono">{formatDuration(call.duration)}</span>
                        <span className={cn("px-2 py-0.5 rounded-full", statusBadge(call.status))}>
                          {call.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
