"use client";

import { useState } from "react";
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function SettingsPage() {
  const [form, setForm] = useState({
    twilio_account_sid: "",
    twilio_auth_token: "",
    twilio_phone_number: "",
    twilio_twiml_app_sid: "",
  });
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    hint?: string,
    isSecret?: boolean
  ) => (
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={isSecret && !showToken ? "password" : "text"}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder:text-slate-600 placeholder:font-sans focus:outline-none focus:border-accent transition-colors pr-10"
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-slate-600 text-xs mt-1">{hint}</p>}
    </div>
  );

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://yourapp.vercel.app";

  return (
    <div className="animate-fade-in">
      <Header title="Settings" subtitle="Configure your Twilio integration" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Twilio Credentials */}
        <form onSubmit={handleSave}>
          <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-navy-700">
              <h2 className="text-white font-semibold">Twilio Credentials</h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Find these in your{" "}
                <a
                  href="https://console.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline inline-flex items-center gap-0.5"
                >
                  Twilio Console <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <div className="p-6 space-y-4">
              {field(
                "twilio_account_sid",
                "Account SID",
                "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                "Starts with AC"
              )}
              {field(
                "twilio_auth_token",
                "Auth Token",
                "your_auth_token",
                "Keep this secret",
                true
              )}
              {field(
                "twilio_phone_number",
                "Twilio Phone Number",
                "+15551234567",
                "Your purchased Twilio number in E.164 format"
              )}
              {field(
                "twilio_twiml_app_sid",
                "TwiML App SID",
                "APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                "Create a TwiML App with Voice URL below"
              )}
            </div>

            {(saved || error) && (
              <div className="mx-6 mb-4">
                {saved && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success/15 border border-success/30 text-success text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Settings saved successfully
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>

        {/* Webhook URLs */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-700">
            <h2 className="text-white font-semibold">Webhook Configuration</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Configure these URLs in your Twilio Console
            </p>
          </div>

          <div className="p-6 space-y-4">
            {[
              {
                label: "Incoming Call Webhook",
                url: `${appUrl}/api/calls/incoming`,
                hint: "Set on your Twilio phone number → Voice → A call comes in (POST)",
              },
              {
                label: "TwiML App Voice URL",
                url: `${appUrl}/api/calls/voice`,
                hint: "Set on your TwiML App → Voice Request URL (POST)",
              },
              {
                label: "Call Status Callback",
                url: `${appUrl}/api/calls/status`,
                hint: "Automatically used — logs call status updates",
              },
              {
                label: "Recording Callback",
                url: `${appUrl}/api/calls/recording-callback`,
                hint: "Automatically used — stores recording URLs",
              },
            ].map(({ label, url, hint }) => (
              <div key={label}>
                <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
                <div className="flex items-center gap-2 bg-navy-900 rounded-lg px-3 py-2 border border-navy-600">
                  <code className="text-accent text-sm font-mono flex-1 break-all">{url}</code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(url)}
                    className="text-slate-500 hover:text-white transition-colors text-xs whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-slate-600 text-xs mt-1">{hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-700">
            <h2 className="text-white font-semibold">Environment Variables</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Add these to your <code className="text-accent">.env.local</code> file or Vercel dashboard
            </p>
          </div>
          <div className="p-6">
            <pre className="bg-navy-950 rounded-lg p-4 text-sm text-slate-300 font-mono overflow-x-auto border border-navy-700">
{`TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=${appUrl}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
