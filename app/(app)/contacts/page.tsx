"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Phone, Trash2, Building2, StickyNote, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import type { Contact } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", company: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchContacts = async (q?: string) => {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : "";
    const res = await fetch(`/api/contacts${params}`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts(search);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", phone: "", company: "", notes: "" });
      fetchContacts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="animate-fade-in">
      <Header title="Contacts" subtitle={`${contacts.length} contacts`} />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="bg-transparent text-white text-sm placeholder:text-slate-500 outline-none flex-1"
            />
          </form>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>

        {/* Add form modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-navy-800 rounded-2xl border border-navy-600 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
                <h2 className="text-white font-semibold">Add Contact</h2>
                <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                {[
                  { key: "name", label: "Full Name", placeholder: "John Doe", required: true },
                  { key: "phone", label: "Phone Number", placeholder: "+1 (555) 000-0000", required: true },
                  { key: "company", label: "Company", placeholder: "Acme Inc.", required: false },
                  { key: "notes", label: "Notes", placeholder: "Any notes...", required: false },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-slate-400 text-sm mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      required={required}
                      className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-2.5 rounded-lg border border-navy-600 text-slate-400 text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Contact"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contacts grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-navy-800 rounded-xl border border-navy-700 animate-pulse" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-navy-800 rounded-xl border border-navy-700 p-16 text-center">
            <p className="text-slate-500 text-sm">No contacts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-navy-800 rounded-xl border border-navy-700 p-5 hover:border-navy-600 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-danger hover:bg-danger/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-white font-semibold">{contact.name}</h3>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <a
                      href={`tel:${contact.phone}`}
                      className="hover:text-accent transition-colors"
                    >
                      {formatPhone(contact.phone)}
                    </a>
                  </div>
                  {contact.company && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      {contact.company}
                    </div>
                  )}
                  {contact.notes && (
                    <div className="flex items-start gap-1.5 text-slate-500 text-sm">
                      <StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{contact.notes}</span>
                    </div>
                  )}
                </div>

                <a
                  href={`/softphone?to=${encodeURIComponent(contact.phone)}`}
                  className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-xs font-medium transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
