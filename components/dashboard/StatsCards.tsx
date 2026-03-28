"use client";

import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Radio } from "lucide-react";
import type { CallStats } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  delta?: string;
}

function StatCard({ label, value, icon: Icon, color, bg, delta }: StatCardProps) {
  return (
    <div className="bg-navy-800 rounded-xl border border-navy-700 p-5 flex items-start justify-between hover:border-navy-600 transition-colors">
      <div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
        {delta && (
          <p className="text-slate-500 text-xs mt-1">{delta}</p>
        )}
      </div>
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
    </div>
  );
}

export function StatsCards({ stats, loading }: { stats: CallStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-navy-800 rounded-xl border border-navy-700 p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Calls",
      value: stats.total,
      icon: Phone,
      color: "text-accent",
      bg: "bg-accent/15",
    },
    {
      label: "Inbound",
      value: stats.inbound,
      icon: PhoneIncoming,
      color: "text-success",
      bg: "bg-success/15",
    },
    {
      label: "Outbound",
      value: stats.outbound,
      icon: PhoneOutgoing,
      color: "text-accent-light",
      bg: "bg-accent/15",
    },
    {
      label: "Missed",
      value: stats.missed,
      icon: PhoneMissed,
      color: "text-danger",
      bg: "bg-danger/15",
    },
    {
      label: "Avg Duration",
      value: formatDuration(stats.avgDuration),
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/15",
    },
    {
      label: "Active Now",
      value: stats.activeNow,
      icon: Radio,
      color: "text-success",
      bg: "bg-success/15",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
