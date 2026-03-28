"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type DeviceState =
  | "offline"
  | "registering"
  | "registered"
  | "busy"
  | "error";

export type ActiveCallState = {
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  startTime: Date | null;
  muted: boolean;
  onHold: boolean;
};

type TwilioDeviceType = import("@twilio/voice-sdk").Device;
type TwilioCallType = import("@twilio/voice-sdk").Call;

export function useTwilioDevice() {
  const deviceRef = useRef<TwilioDeviceType | null>(null);
  const callRef = useRef<TwilioCallType | null>(null);

  const [deviceState, setDeviceState] = useState<DeviceState>("offline");
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<TwilioCallType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initDevice = useCallback(async (identity = "agent") => {
    try {
      setDeviceState("registering");
      setError(null);

      const res = await fetch("/api/calls/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get token");
      }

      const { token } = await res.json();

      // Dynamic import to avoid SSR issues
      const { Device } = await import("@twilio/voice-sdk");

      if (deviceRef.current) {
        deviceRef.current.destroy();
      }

      const device = new Device(token, {
        logLevel: "warn",
        codecPreferences: ["opus", "pcmu"] as unknown as Parameters<
          typeof Device
        >[1]["codecPreferences"],
      });

      device.on("registered", () => setDeviceState("registered"));
      device.on("unregistered", () => setDeviceState("offline"));
      device.on("error", (err: Error) => {
        setError(err.message);
        setDeviceState("error");
      });

      device.on("incoming", (call: TwilioCallType) => {
        setIncomingCall(call);
        call.on("cancel", () => setIncomingCall(null));
        call.on("disconnect", () => {
          setIncomingCall(null);
          setActiveCall(null);
          callRef.current = null;
          setDeviceState("registered");
        });
      });

      deviceRef.current = device;
      await device.register();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Device init failed";
      setError(msg);
      setDeviceState("error");
    }
  }, []);

  const makeCall = useCallback(async (to: string) => {
    if (!deviceRef.current || deviceState !== "registered") {
      throw new Error("Device not ready");
    }

    const call = await deviceRef.current.connect({
      params: { To: to },
    });

    callRef.current = call;
    setDeviceState("busy");
    setActiveCall({
      direction: "outbound",
      from: "You",
      to,
      startTime: new Date(),
      muted: false,
      onHold: false,
    });

    call.on("disconnect", () => {
      callRef.current = null;
      setActiveCall(null);
      setDeviceState("registered");
    });

    call.on("error", (err: Error) => {
      setError(err.message);
      callRef.current = null;
      setActiveCall(null);
      setDeviceState("registered");
    });

    return call;
  }, [deviceState]);

  const answerCall = useCallback(() => {
    if (!incomingCall) return;
    incomingCall.accept();
    callRef.current = incomingCall;
    setDeviceState("busy");
    setActiveCall({
      direction: "inbound",
      from: incomingCall.parameters?.From ?? "Unknown",
      to: "You",
      startTime: new Date(),
      muted: false,
      onHold: false,
    });
    setIncomingCall(null);
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    incomingCall?.reject();
    setIncomingCall(null);
  }, [incomingCall]);

  const hangUp = useCallback(() => {
    callRef.current?.disconnect();
    callRef.current = null;
    setActiveCall(null);
    setDeviceState(deviceRef.current ? "registered" : "offline");
  }, []);

  const toggleMute = useCallback(() => {
    if (!callRef.current || !activeCall) return;
    const muted = !activeCall.muted;
    callRef.current.mute(muted);
    setActiveCall((prev) => prev && { ...prev, muted });
  }, [activeCall]);

  const toggleHold = useCallback(() => {
    // Hold is simulated client-side for MVP (requires Twilio REST to truly hold)
    setActiveCall((prev) => prev && { ...prev, onHold: !prev.onHold });
  }, []);

  const destroyDevice = useCallback(() => {
    deviceRef.current?.destroy();
    deviceRef.current = null;
    setDeviceState("offline");
    setActiveCall(null);
    setIncomingCall(null);
  }, []);

  useEffect(() => {
    return () => {
      deviceRef.current?.destroy();
    };
  }, []);

  return {
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
    destroyDevice,
  };
}
