"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, Upload, Phone, Trash2, RefreshCw, X, Download } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { formatPhone } from "@/lib/utils";
import type { Campaign, Lead, LeadStatus } from "@/lib/types";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/15 text-blue-400",
  called: "bg-slate-500/15 text-slate-400",
  interested: "bg-emerald-500/15 text-emerald-400",
  not_interested: "bg-red-500/15 text-red-400",
  no_answer: "bg-yellow-500/15 text-yellow-400",
  callback: "bg-purple-500/15 text-purple-400",
  dnc: "bg-red-900/30 text-red-500",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMEZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix"];

type Tab = "overview" | "leads" | "settings";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<Campaign>>({});

  const fetchCampaign = async () => {
    const res = await fetch(`/api/campaigns/${id}`);
    const data = await res.json();
    if (data.campaign) {
      setCampaign(data.campaign);
      setSettings(data.campaign);
    }
  };

  const fetchLeads = async () => {
    const res = await fetch(`/api/call-leads?campaign_id=${id}&limit=100`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLeadsTotal(data.total ?? 0);
  };

  useEffect(() => {
    Promise.all([fetchCampaign(), fetchLeads()]).finally(() => setLoading(false));
  }, [id]);

  const handleStart = async () => {
    await fetch(`/api/campaigns/${id}/start`, { method: "POST" });
    fetchCampaign();
  };

  const handlePause = async () => {
    await fetch(`/api/campaigns/${id}/pause`, { method: "POST" });
    fetchCampaign();
  };

  const handleCallNow = async (lead: Lead) => {
    setCalling(lead.id);
    try {
      await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: lead.phone }),
      });
    } finally {
      setCalling(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Remove this lead?")) return;
    await fetch(`/api/call-leads?id=${leadId}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setLeadsTotal((t) => t - 1);
  };

  const handleImport = async () => {
    setImporting(true);
    const leads = pasteText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((phone) => ({ phone }));

    const res = await fetch("/api/call-leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads, campaign_id: id, source: "paste" }),
    });
    if (res.ok) {
      setShowImport(false);
      setPasteText("");
      fetchLeads();
      fetchCampaign();
    }
    setImporting(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    await fetchCampaign();
    setSaving(false);
  };

  const toggleDay = (day: string) => {
    setSettings((s) => ({
      ...s,
      schedule_days: (s.schedule_days ?? []).includes(day)
        ? (s.schedule_days ?? []).filter((d) => d !== day)
        : [...(s.schedule_days ?? []), day],
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-navy-700 rounded animate-pulse mb-4" />
        <div className="h-48 bg-navy-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!campaign) return <div className="p-6 text-slate-400">Campaign not found.</div>;

  const pct = campaign.total_leads > 0 ? Math.round((campaign.leads_called / campaign.total_leads) * 100) : 0;

  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="animate-fade-in">
      <Header
        title={campaign.name}
        subtitle={`Campaign · ${campaign.status}`}
      />

      <div className="p-6 space-y-4">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/campaigns")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Campaigns
          </button>
          <div className="flex gap-2">
            {campaign.status === "active" ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-medium hover:bg-yellow-500/25 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            ) : campaign.status !== "completed" ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Campaign
              </button>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-navy-700">
          {(["overview", "leads", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "text-accent border-b-2 border-accent"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Leads", value: campaign.total_leads, color: "text-white" },
                { label: "Called", value: campaign.leads_called, color: "text-accent" },
                { label: "Remaining", value: campaign.leads_remaining, color: "text-yellow-400" },
                { label: "Progress", value: `${pct}%`, color: "text-emerald-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-navy-800 rounded-xl border border-navy-700 p-4">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-slate-500 text-sm mt-1">{label}</div>
                </div>
              ))}
            </div>

            {campaign.total_leads > 0 && (
              <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
                <h3 className="text-white font-semibold mb-3">Progress</h3>
                <div className="h-3 bg-navy-700 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>{campaign.leads_called} called</span>
                  <span>{campaign.leads_remaining} remaining</span>
                </div>
              </div>
            )}

            <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
              <h3 className="text-white font-semibold mb-3">Lead Outcomes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between bg-navy-900 rounded-lg px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status as LeadStatus] ?? "bg-slate-500/15 text-slate-400"}`}>
                      {status.replace("_", " ")}
                    </span>
                    <span className="text-white font-semibold text-sm">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {tab === "leads" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">{leadsTotal} leads in this campaign</span>
              <div className="flex gap-2">
                <button
                  onClick={fetchLeads}
                  className="p-2 rounded-lg bg-navy-800 border border-navy-600 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add Leads
                </button>
              </div>
            </div>

            <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700">
                    <th className="px-4 py-3 text-slate-400 font-medium text-left">Name / Phone</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-left">Status</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-left hidden md:table-cell">Calls</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-500 text-sm">
                        No leads yet. Click "Add Leads" to import some.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{lead.name || "—"}</div>
                          <div className="text-slate-400 text-xs">{formatPhone(lead.phone)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                            {lead.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{lead.call_count}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCallNow(lead)}
                              disabled={calling === lead.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-xs font-medium transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              {calling === lead.id ? "..." : "Call"}
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-danger hover:bg-danger/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Campaign Name</label>
              <input
                type="text"
                value={settings.name ?? ""}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Timezone</label>
              <select
                value={settings.timezone ?? "America/New_York"}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
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
                      (settings.schedule_days ?? []).includes(day)
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
                  value={settings.schedule_start ?? "09:00"}
                  onChange={(e) => setSettings({ ...settings, schedule_start: e.target.value })}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">End Time</label>
                <input
                  type="time"
                  value={settings.schedule_end ?? "17:00"}
                  onChange={(e) => setSettings({ ...settings, schedule_end: e.target.value })}
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
                  value={settings.calls_per_minute ?? 1}
                  onChange={(e) => setSettings({ ...settings, calls_per_minute: Number(e.target.value) })}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Max Retries</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={settings.max_retries ?? 2}
                  onChange={(e) => setSettings({ ...settings, max_retries: Number(e.target.value) })}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Retry (hrs)</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={settings.retry_delay_hours ?? 2}
                  onChange={(e) => setSettings({ ...settings, retry_delay_hours: Number(e.target.value) })}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 rounded-2xl border border-navy-600 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
              <h2 className="text-white font-semibold">Add Leads to Campaign</h2>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-400 text-sm">Paste phone numbers, one per line:</p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"+19125551234\n+19125554567"}
                rows={8}
                className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors font-mono resize-none"
              />
              <p className="text-slate-500 text-xs">
                {pasteText.split("\n").filter((l) => l.trim()).length} numbers detected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-2.5 rounded-lg border border-navy-600 text-slate-400 text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {importing ? "Adding..." : "Add Leads"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
