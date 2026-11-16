"use client";

import { useCallback, useEffect, useState } from "react";

export type TimerState = {
  clientId: string | null;
  clientName: string | null;
  elapsed: number;
  running: boolean;
  startedAt: number | null;
};

const EMPTY: TimerState = {
  clientId: null,
  clientName: null,
  elapsed: 0,
  running: false,
  startedAt: null,
};

export function formatClock(total: number): string {
  const safe = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function storageKey(workspaceId: string): string {
  return `lm_timer_${workspaceId}`;
}

export function useClientTimer(workspaceId: string) {
  const [state, setState] = useState<TimerState>(EMPTY);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!workspaceId) {
      setState(EMPTY);
      setHydratedFor("");
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey(workspaceId));
      setState(raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<TimerState>) } : EMPTY);
    } catch {
      setState(EMPTY);
    }
    setHydratedFor(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || hydratedFor !== workspaceId) return;
    try {
      window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(state));
    } catch {
      /* storage can be unavailable; the timer still works for this session */
    }
  }, [state, hydratedFor, workspaceId]);

  useEffect(() => {
    if (!state.running || state.startedAt === null) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [state.running, state.startedAt]);

  const elapsed =
    state.running && state.startedAt !== null
      ? state.elapsed + Math.max(0, Math.floor((now - state.startedAt) / 1000))
      : state.elapsed;

  const toggle = useCallback(() => {
    setState((current) => {
      if (current.running && current.startedAt !== null) {
        const extra = Math.max(
          0,
          Math.floor((Date.now() - current.startedAt) / 1000),
        );
        return {
          ...current,
          elapsed: current.elapsed + extra,
          running: false,
          startedAt: null,
        };
      }
      return { ...current, running: true, startedAt: Date.now() };
    });
  }, []);

  const reset = useCallback(() => {
    setState((current) => ({
      ...current,
      elapsed: 0,
      running: false,
      startedAt: null,
    }));
  }, []);

  const selectClient = useCallback(
    (clientId: string | null, clientName: string | null) => {
      setState((current) =>
        current.clientId === clientId
          ? current
          : {
              clientId,
              clientName,
              elapsed: 0,
              running: false,
              startedAt: null,
            },
      );
    },
    [],
  );

  return {
    ...state,
    elapsed,
    formatted: formatClock(elapsed),
    toggle,
    reset,
    selectClient,
  };
}
