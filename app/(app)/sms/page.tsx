"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Send, Trash2, Smartphone, RefreshCw } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  created_at: string;
  body: string;
  direction: "inbound" | "outbound";
  phone_number: string;
  read: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function SMSPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    const res = await fetch("/api/sms");
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoading(false);
    setTimeout(scrollToBottom, 50);
    // Mark inbound as read
    fetch("/api/sms", { method: "PATCH" });
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("demo_messages_callcenter")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "demo_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    const body = reply.trim();
    setReply("");
    setSending(true);
    await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, direction: "outbound" }),
    });
    setSending(false);
  };

  const clearConversation = async () => {
    if (!confirm("Clear all messages? This resets the demo.")) return;
    setClearing(true);
    await fetch("/api/sms", { method: "DELETE" });
    setMessages([]);
    setClearing(false);
  };

  const unread = messages.filter((m) => m.direction === "inbound" && !m.read).length;
  const phone = messages[0]?.phone_number ?? "+19123128862";

  return (
    <div className="animate-fade-in flex flex-col h-screen">
      <Header
        title="SMS Demo"
        subtitle="Live demo conversation"
      />

      <div className="flex-1 flex flex-col overflow-hidden px-6 pb-6 gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">{phone}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs">Live · AI Auto-Reply On</span>
              </div>
            </div>
            {unread > 0 && (
              <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMessages}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={clearConversation}
              disabled={clearing || messages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-danger hover:bg-danger/10 text-xs font-medium transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 bg-navy-800 rounded-xl border border-navy-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Smartphone className="w-10 h-10 text-slate-600" />
                <p className="text-slate-400 font-medium">No messages yet</p>
                <p className="text-slate-500 text-sm text-center">
                  Open <span className="text-accent font-mono">/phone</span> on your device and send a message
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => {
                  const isInbound = msg.direction === "inbound"; // from the "customer" phone
                  const showTime =
                    i === 0 ||
                    new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 5 * 60 * 1000;

                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <p className="text-center text-slate-500 text-xs my-3">
                          {formatTime(msg.created_at)}
                        </p>
                      )}
                      <div className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-0.5`}>
                        <div className="flex flex-col gap-0.5 max-w-[70%]">
                          {i === 0 || messages[i - 1].direction !== msg.direction ? (
                            <span className={`text-xs ${isInbound ? "text-slate-500 ml-1" : "text-slate-500 mr-1 text-right"}`}>
                              {isInbound ? "Customer" : "Sarah (AI)"}
                            </span>
                          ) : null}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-snug ${
                              isInbound
                                ? "bg-navy-600 text-white rounded-bl-sm"
                                : "bg-accent text-white rounded-br-sm"
                            }`}
                          >
                            {msg.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Reply input */}
          <div className="border-t border-navy-700 p-3">
            <form onSubmit={sendReply} className="flex items-end gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Override AI — type a manual reply..."
                rows={1}
                className="flex-1 bg-navy-900 border border-navy-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={!reply.trim() || sending}
                className="p-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-slate-600 text-xs mt-1.5 ml-1">
              AI replies automatically · Press Enter or use the button to send a manual reply
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
