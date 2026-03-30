"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, Plus, Phone, Trash2, Upload, X, ChevronDown,
  UserCheck, Download, RefreshCw
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { formatPhone } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/15 text-blue-400",
  called: "bg-slate-500/15 text-slate-400",
  interested: "bg-emerald-500/15 text-emerald-400",
  not_interested: "bg-red-500/15 text-red-400",
  no_answer: "bg-yellow-500/15 text-yellow-400",
  callback: "bg-purple-500/15 text-purple-400",
  dnc: "bg-red-900/30 text-red-500",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  called: "Called",
  interested: "Interested",
  not_interested: "Not Interested",
  no_answer: "No Answer",
  callback: "Callback",
  dnc: "DNC",
};

type ImportTab = "csv" | "paste" | "manual";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [calling, setCalling] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState<ImportTab>("csv");
  const [pasteText, setPasteText] = useState("");
  const [csvPreview, setCsvPreview] = useState<Partial<Lead>[]>([]);
  const [manualForm, setManualForm] = useState({ phone: "", name: "", company: "", notes: "" });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchLeads = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/call-leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleCallNow = async (lead: Lead) => {
    setCalling(lead.id);
    try {
      await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: lead.phone }),
      });
      await fetch(`/api/call-leads?id=${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "called", last_called_at: new Date().toISOString(), call_count: lead.call_count + 1 }),
      });
      fetchLeads();
    } finally {
      setCalling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/call-leads?id=${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setTotal((t) => t - 1);
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    await fetch(`/api/call-leads?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  // CSV parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n").filter(Boolean);
      if (lines.length === 0) return;
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
        return {
          phone: row["phone"] || row["phone number"] || row["mobile"] || row["cell"] || "",
          name: row["name"] || row["full name"] || row["first name"] ? `${row["first name"] ?? ""} ${row["last name"] ?? ""}`.trim() : "",
          company: row["company"] || row["business"] || "",
          email: row["email"] || row["email address"] || "",
        } as Partial<Lead>;
      }).filter((r) => r.phone);
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResult("");
    let leads: Partial<Lead>[] = [];

    if (importTab === "csv") {
      leads = csvPreview;
    } else if (importTab === "paste") {
      leads = pasteText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((phone) => ({ phone }));
    } else {
      leads = [manualForm];
    }

    const res = await fetch("/api/call-leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads, source: importTab === "manual" ? "manual" : importTab }),
    });
    const data = await res.json();
    if (res.ok) {
      setImportResult(`Successfully imported ${data.imported} leads`);
      fetchLeads();
      setTimeout(() => {
        setShowImport(false);
        setImportResult("");
        setCsvPreview([]);
        setPasteText("");
        setManualForm({ phone: "", name: "", company: "", notes: "" });
      }, 1500);
    } else {
      setImportResult(`Error: ${data.error}`);
    }
    setImporting(false);
  };

  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-in">
      <Header title="Leads" subtitle={`${total.toLocaleString()} total leads`} />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, company..."
              className="bg-transparent text-white text-sm placeholder:text-slate-500 outline-none flex-1"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <button
            onClick={fetchLeads}
            className="p-2 rounded-lg bg-navy-800 border border-navy-600 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700 border border-navy-600 hover:bg-navy-600 text-slate-300 text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button
            onClick={() => { setImportTab("manual"); setShowImport(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>

        {/* Table */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700 text-left">
                  <th className="px-4 py-3 text-slate-400 font-medium">Name / Phone</th>
                  <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Company</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Calls</th>
                  <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Last Called</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-navy-700/50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 bg-navy-700 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                      <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No leads found. Import some to get started.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{lead.name || "—"}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{formatPhone(lead.phone)}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{lead.company || "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer border-0 outline-none ${STATUS_COLORS[lead.status]} bg-transparent`}
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val} className="bg-navy-800 text-white">{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{lead.call_count}</td>
                      <td className="px-4 py-3 text-slate-400 hidden lg:table-cell text-xs">
                        {lead.last_called_at
                          ? new Date(lead.last_called_at).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCallNow(lead)}
                            disabled={calling === lead.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Phone className="w-3 h-3" />
                            {calling === lead.id ? "Calling..." : "Call"}
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-navy-700">
              <span className="text-slate-500 text-sm">
                {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg bg-navy-700 text-slate-300 text-sm disabled:opacity-40 hover:bg-navy-600 transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-navy-700 text-slate-300 text-sm disabled:opacity-40 hover:bg-navy-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 rounded-2xl border border-navy-600 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
              <h2 className="text-white font-semibold">Import Leads</h2>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-navy-700">
              {(["csv", "paste", "manual"] as ImportTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setImportTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    importTab === tab
                      ? "text-accent border-b-2 border-accent"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "csv" ? "CSV Upload" : tab === "paste" ? "Paste Numbers" : "Manual Add"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              {importTab === "csv" && (
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm">Upload a CSV with columns: phone, name, company, email</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-navy-600 rounded-xl text-slate-400 hover:border-accent/50 hover:text-accent transition-colors flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="text-sm">Click to upload CSV</span>
                  </button>
                  {csvPreview.length > 0 && (
                    <div className="bg-navy-900 rounded-lg p-3 text-xs text-slate-400">
                      <p className="text-emerald-400 mb-2">{csvPreview.length} rows detected</p>
                      {csvPreview.slice(0, 3).map((r, i) => (
                        <div key={i}>{r.phone} — {r.name || "no name"}</div>
                      ))}
                      {csvPreview.length > 3 && <div className="text-slate-500">...and {csvPreview.length - 3} more</div>}
                    </div>
                  )}
                </div>
              )}

              {importTab === "paste" && (
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm">Paste one phone number per line</p>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={"+19125551234\n+19125554567\n+19125558901"}
                    rows={8}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors font-mono resize-none"
                  />
                  {pasteText && (
                    <p className="text-slate-500 text-xs">
                      {pasteText.split("\n").filter((l) => l.trim()).length} numbers detected
                    </p>
                  )}
                </div>
              )}

              {importTab === "manual" && (
                <div className="space-y-3">
                  {[
                    { key: "phone", label: "Phone Number *", placeholder: "+1 (912) 555-0000" },
                    { key: "name", label: "Full Name", placeholder: "John Doe" },
                    { key: "company", label: "Company", placeholder: "Acme Inc." },
                    { key: "notes", label: "Notes", placeholder: "Any notes..." },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-slate-400 text-sm mb-1.5">{label}</label>
                      <input
                        type="text"
                        value={manualForm[key as keyof typeof manualForm]}
                        onChange={(e) => setManualForm({ ...manualForm, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  ))}
                </div>
              )}

              {importResult && (
                <p className={`text-sm ${importResult.startsWith("Error") ? "text-danger" : "text-emerald-400"}`}>
                  {importResult}
                </p>
              )}

              <div className="flex gap-3 pt-2">
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
                  {importing ? "Importing..." : "Import Leads"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
