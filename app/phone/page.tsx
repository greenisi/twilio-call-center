"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MY_NUMBER = "+1 (912) 312-8862";
const BUSINESS_NAME = "Cash Annuity Solutions";

interface Message {
  id: string;
  created_at: string;
  body: string;
  direction: "inbound" | "outbound";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function PhonePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetch("/api/sms")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setTimeout(scrollToBottom, 50);
      });

    const channel = supabase
      .channel("demo_messages_phone")
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

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const body = input.trim();
    setInput("");
    setSending(true);
    await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, direction: "inbound" }),
    });
    setSending(false);
  };

  return (
    <div
      className="flex flex-col bg-black"
      style={{ height: "100dvh", maxWidth: 430, margin: "0 auto" }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-black">
        <span className="text-white text-sm font-semibold">
          {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-3 fill-white" viewBox="0 0 17 12">
            <rect x="0" y="3" width="3" height="9" rx="1" />
            <rect x="4.5" y="2" width="3" height="10" rx="1" />
            <rect x="9" y="1" width="3" height="11" rx="1" />
            <rect x="13.5" y="0" width="3" height="12" rx="1" />
          </svg>
          <svg className="w-4 h-3 fill-white" viewBox="0 0 16 12">
            <path d="M8 2.4C10.6 2.4 12.9 3.5 14.5 5.3L16 3.8C14 1.4 11.2 0 8 0C4.8 0 2 1.4 0 3.8L1.5 5.3C3.1 3.5 5.4 2.4 8 2.4Z"/>
            <path d="M8 5.6C9.8 5.6 11.4 6.4 12.5 7.6L14 6.1C12.5 4.6 10.4 3.6 8 3.6C5.6 3.6 3.5 4.6 2 6.1L3.5 7.6C4.6 6.4 6.2 5.6 8 5.6Z"/>
            <circle cx="8" cy="10" r="2" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-3 rounded-sm border border-white/60 p-px flex">
              <div className="w-4/5 bg-white rounded-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* iMessage header */}
      <div className="bg-[#1c1c1e] flex flex-col items-center py-3 border-b border-[#2c2c2e]">
        <div className="w-14 h-14 rounded-full bg-[#48484a] flex items-center justify-center mb-2">
          <span className="text-white text-xl font-semibold">
            {BUSINESS_NAME.charAt(0)}
          </span>
        </div>
        <p className="text-white font-semibold text-sm">{BUSINESS_NAME}</p>
        <p className="text-[#8e8e93] text-xs mt-0.5">{MY_NUMBER} · Text Message</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 bg-black">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-[#48484a] text-sm">No messages yet</p>
            <p className="text-[#48484a] text-xs">Send a message to get started</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.direction === "inbound"; // "inbound" = sent from this phone
          const showTime =
            i === 0 ||
            new Date(msg.created_at).getTime() -
              new Date(messages[i - 1].created_at).getTime() >
              5 * 60 * 1000;

          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[#8e8e93] text-xs my-3">
                  {formatTime(msg.created_at)}
                </p>
              )}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-0.5`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-[18px] text-sm leading-snug ${
                    isMe
                      ? "bg-[#0a7aff] text-white rounded-br-[4px]"
                      : "bg-[#2c2c2e] text-white rounded-bl-[4px]"
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={send}
        className="bg-[#1c1c1e] border-t border-[#2c2c2e] px-3 py-3 flex items-end gap-2"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex-1 bg-[#2c2c2e] rounded-full px-4 py-2.5 flex items-center min-h-[36px]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="iMessage"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#48484a]"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            input.trim()
              ? "bg-[#0a7aff]"
              : "bg-[#2c2c2e]"
          }`}
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
