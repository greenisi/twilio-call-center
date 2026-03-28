"use client";

import { useState, useEffect } from "react";
import { Phone, PhoneIncoming, PhoneOff, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useTwilioDevice } from "@/hooks/useTwilioDevice";
import { Dialpad } from "./Dialpad";
import { CallControls } from "./CallControls";
import { cn } from "@/lib/utils";

export function Softphone() {
  const {
    deviceState,
    activeCall,
    incomingCall,
    error,
    initDevice,
    makeCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleHold,
  } = useTwilioDevice();

  const [dialValue, setDialValue] = useState("");
  const [calling, setCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    initDevice();
  }, [initDevice]);

  const handleCall = async () => {
    if (!dialValue.trim()) return;
    setCalling(true);
    setCallError(null);
    try {
      await makeCall(dialValue.trim());
      setDialValue("");
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Call failed");
    } finally {
      setCalling(false);
    }
  };

  const statusConfig = {
    offline: { color: "text-slate-500", bg: "bg-slate-700", label: "Offline", icon: WifiOff },
    registering: { color: "text-warning", bg: "bg-warning", label: "Connecting...", icon: Wifi },
    registered: { color: "text-success", bg: "bg-success", label: "Ready", icon: Wifi },
    busy: { color: "text-accent", bg: "bg-accent", label: "In Call", icon: Phone },
    error: { color: "text-danger", bg: "bg-danger", label: "Error", icon: AlertCircle },
  };

  const status = statusConfig[deviceState];
  const StatusIcon = status.icon;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Phone className="w-4 h-4 text-accent" />
            </div>
            <span className="text-white font-semibold text-sm">Softphone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", status.bg)} />
            <span className={cn("text-xs font-medium", status.color)}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="p-5">
          {/* Error */}
          {(error || callError) && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-danger/15 border border-danger/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <p className="text-danger text-xs">{error || callError}</p>
            </div>
          )}

          {/* Incoming call overlay */}
          {incomingCall && (
            <div className="mb-4 p-4 rounded-xl bg-accent/10 border border-accent/30 animate-slide-in">
              <p className="text-center text-slate-400 text-xs mb-1">Incoming Call</p>
              <p className="text-center text-white font-semibold">
                {incomingCall.parameters?.From ?? "Unknown Caller"}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={rejectCall}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-danger hover:bg-danger/90 text-white text-sm font-medium transition-colors"
                >
                  <PhoneOff className="w-4 h-4" />
                  Decline
                </button>
                <button
                  onClick={answerCall}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success hover:bg-success/90 text-white text-sm font-medium transition-colors"
                >
                  <PhoneIncoming className="w-4 h-4" />
                  Answer
                </button>
              </div>
            </div>
          )}

          {/* Active call controls */}
          {activeCall ? (
            <CallControls
              call={activeCall}
              onMute={toggleMute}
              onHold={toggleHold}
              onHangUp={hangUp}
            />
          ) : (
            <>
              {/* Dialpad */}
              <Dialpad value={dialValue} onChange={setDialValue} />

              {/* Call button */}
              <button
                onClick={handleCall}
                disabled={!dialValue.trim() || deviceState !== "registered" || calling}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all duration-150 shadow-lg shadow-accent/20"
              >
                <Phone className="w-5 h-5" />
                {calling ? "Calling..." : "Call"}
              </button>

              {deviceState === "offline" && (
                <button
                  onClick={() => initDevice()}
                  className="w-full mt-2 py-2 rounded-lg border border-navy-600 text-slate-400 text-sm hover:border-accent/30 hover:text-white transition-colors"
                >
                  Reconnect Device
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
