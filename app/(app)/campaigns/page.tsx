"use client";

import { useState, useEffect } from "react";
import { Plus, X, Play, Pause, Trash2, Users, Clock, BarChart2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import type { Campaign, CampaignStatus } from "@/lib/types";

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "bg-slate-500/15 text-slate-400",
  active: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-yellow-500/15 text-yellow-400",
  completed: "bg-blue-500/15 text-blue-400",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const defaultForm = {
  name: "",
  timezone: "America/New_York",
  schedule_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  schedule_start: "09:00",
  schedule_end: "17:00",
  calls_per_minute: 1,
  max_retries: 2,
  retry_delay_hours: 2,
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm(defaultForm);
      fetchCampaigns();
    }
    setSaving(false);
  };

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      schedule_days: f.schedule_days.includes(day)
        ? f.schedule_days.filter((d) => d !== day)
        : [...f.schedule_days, day],
    }));
  };

  const handleStart = async (id: string) => {
    await fetch(`/api/campaigns/${id}/start`, { method: "POST" });
    fetchCampaigns();
  };

  const handlePause = async (id: string) => {
    await fetch(`/api/campaigns/${id}/pause`, { method: "POST" });
    fetchCampaigns();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign and all its data?")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="animate-fade-in">
      <Header title="Campaigns" subtitle="Automated outbound call campaigns" />

      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-navy-800 rounded-xl border border-navy-700 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-navy-800 rounded-xl border border-navy-700 p-16 text-center">
            <BarChart2 className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 font-medium">No campaigns yet</p>
            <p className="text-slate-500 text-sm mt-1">Create one to start auto-dialing leads</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campaigns.map((c) => {
              const pct = c.total_leads > 0 ? Math.round((c.leads_called / c.total_leads) * 100) : 0;
              return (
                <div key={c.id} className="bg-navy-800 rounded-xl border border-navy-700 p-5 hover:border-navy-600 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold">{c.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_COLORS[c.status]}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-danger hover:bg-danger/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Total", value: c.total_leads },
                      { label: "Called", value: c.leads_called },
                      { label: "Remaining", value: c.leads_remaining },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-navy-900 rounded-lg p-2 text-center">
                        <div className="text-white font-semibold text-sm">{value}</div>
                        <div className="text-slate-500 text-xs">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  {c.total_leads > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    {c.schedule_days.join(", ")} · {c.schedule_start}–{c.schedule_end}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="flex-1 py-2 rounded-lg border border-navy-600 text-slate-300 text-xs font-medium text-center hover:bg-navy-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Manage
                    </Link>
                    {c.status === "active" ? (
                      <button
                        onClick={() => handlePause(c.id)}
                        className="flex-1 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-medium hover:bg-yellow-500/25 transition-colors flex items-center justify-center gap-1"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Pause
                      </button>
                    ) : c.status !== "completed" ? (
                      <button
                        onClick={() => handleStart(c.id)}
                        className="flex-1 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start
                      </button>
                    ) : (
                      <div className="flex-1 py-2 rounded-lg bg-navy-700 text-slate-500 text-xs font-medium text-center flex items-center justify-center">
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 rounded-2xl border border-navy-600 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700 sticky top-0 bg-navy-800">
              <h2 className="text-white font-semibold">New Campaign</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Campaign Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Q2 Settlement Outreach"
                  required
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                >
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Call Days</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        form.schedule_days.includes(day)
                          ? "bg-accent text-white"
                          : "bg-navy-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-sm mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={form.schedule_start}
                    onChange={(e) => setForm({ ...form, schedule_start: e.target.value })}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={form.schedule_end}
                    onChange={(e) => setForm({ ...form, schedule_end: e.target.value })}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-sm mb-1.5">Calls/min</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.calls_per_minute}
                    onChange={(e) => setForm({ ...form, calls_per_minute: Number(e.target.value) })}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1.5">Max Retries</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={form.max_retries}
                    onChange={(e) => setForm({ ...form, max_retries: Number(e.target.value) })}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1.5">Retry (hrs)</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={form.retry_delay_hours}
                    onChange={(e) => setForm({ ...form, retry_delay_hours: Number(e.target.value) })}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg border border-navy-600 text-slate-400 text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
