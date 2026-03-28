"use client";

import { useState } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CallLogTable } from "@/components/calls/CallLogTable";
import { useCalls } from "@/hooks/useCalls";
import { cn } from "@/lib/utils";

const DIRECTIONS = [
  { value: "", label: "All" },
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "in-progress", label: "In Progress" },
  { value: "no-answer", label: "No Answer" },
  { value: "failed", label: "Failed" },
  { value: "busy", label: "Busy" },
];

export default function CallsPage() {
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");

  const { calls, loading, refetch } = useCalls({
    direction: direction || undefined,
    status: status || undefined,
    search: search || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputVal);
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="Call Logs"
        subtitle={`${calls.length} calls found`}
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 flex-1 min-w-64">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search by number..."
              className="bg-transparent text-white text-sm placeholder:text-slate-500 outline-none flex-1"
            />
          </form>

          {/* Direction tabs */}
          <div className="flex items-center bg-navy-800 border border-navy-600 rounded-lg p-0.5">
            {DIRECTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDirection(d.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  direction === d.value
                    ? "bg-accent text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent text-white text-sm outline-none cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} className="bg-navy-800">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 rounded-lg bg-navy-800 border border-navy-600 text-slate-400 hover:text-white hover:border-navy-500 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Table */}
        <CallLogTable calls={calls} loading={loading} />
      </div>
    </div>
  );
}
