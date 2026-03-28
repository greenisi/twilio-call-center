"use client";

import { useState, useEffect, useCallback } from "react";
import type { Call, CallStats } from "@/lib/types";

export function useCalls(filters?: {
  direction?: string;
  status?: string;
  search?: string;
}) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.direction) params.set("direction", filters.direction);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);

      const res = await fetch(`/api/calls?${params}`);
      if (!res.ok) throw new Error("Failed to fetch calls");
      const data = await res.json();
      setCalls(data.calls ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters?.direction, filters?.status, filters?.search]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  return { calls, loading, error, refetch: fetchCalls };
}

export function useCallStats(): {
  stats: CallStats;
  loading: boolean;
} {
  const { calls, loading } = useCalls();

  const stats: CallStats = {
    total: calls.length,
    inbound: calls.filter((c) => c.direction === "inbound").length,
    outbound: calls.filter((c) => c.direction === "outbound").length,
    missed: calls.filter(
      (c) => c.status === "no-answer" || c.status === "busy"
    ).length,
    avgDuration: (() => {
      const completed = calls.filter((c) => c.duration);
      if (!completed.length) return 0;
      return Math.round(
        completed.reduce((sum, c) => sum + (c.duration ?? 0), 0) /
          completed.length
      );
    })(),
    activeNow: calls.filter((c) => c.status === "in-progress").length,
  };

  return { stats, loading };
}
