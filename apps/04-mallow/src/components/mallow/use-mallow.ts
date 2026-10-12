"use client";

import { useCallback, useSyncExternalStore } from "react";
import { demoStore } from "@/lib/mallow/demo";
import { rollAppointments, type Store } from "@/lib/mallow/store";
import { useLocalStorage } from "@/lib/use-local-storage";

// Real entries and the demo live under separate keys, so trying the demo never touches real data.
type Mode = "real" | "demo";

export function useMallow() {
  const [mode, setMode] = useLocalStorage<Mode>("04-mallow:mode", "real");
  const [real, setReal] = useLocalStorage<Store | null>("04-mallow:data", null);
  const [demo, setDemo] = useLocalStorage<Store | null>("04-mallow:demo", null);
  const raw = mode === "demo" ? demo : real;
  const store = raw ? rollAppointments(raw) : null;

  const setStore = useCallback(
    (fn: (s: Store) => Store) => (mode === "demo" ? setDemo : setReal)((s) => (s ? fn(rollAppointments(s)) : s)),
    [mode, setDemo, setReal],
  );

  return {
    store,
    mode,
    setStore,
    createStore: (s: Store) => {
      setReal(s);
      setMode("real");
    },
    startDemo: () => {
      setDemo(demoStore());
      setMode("demo");
    },
    leaveDemo: () => setMode("real"),
    eraseReal: () => setReal(null),
  };
}

// localStorage only exists in the browser: render nothing until hydrated, so the server's
// "no data yet" never flashes the setup screen.
export const useHydrated = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
