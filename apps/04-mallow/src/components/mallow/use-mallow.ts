"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { demoStore, type Persona } from "@/lib/mallow/demo";
import { migrate, type Store } from "@/lib/mallow/store";
import { useLocalStorage } from "@/lib/use-local-storage";

// Real entries and the demo live under separate keys, so trying the demo never touches real data.
type Mode = "real" | "demo";

export function useMallow() {
  const [mode, setMode] = useLocalStorage<Mode>("04-mallow:mode", "real");
  const [real, setReal] = useLocalStorage<Store | null>("04-mallow:data", null);
  const [demo, setDemo] = useLocalStorage<Store | null>("04-mallow:demo", null);
  const [persona, setPersona] = useLocalStorage<Persona>("04-mallow:demo-persona", "sam");
  const raw = mode === "demo" ? demo : real;
  // v1 data is upgraded when read; it's written back in the new shape on the next change.
  const store = useMemo(() => (raw ? migrate(raw) : raw), [raw]);

  const setStore = useCallback(
    (fn: (s: Store) => Store) => (mode === "demo" ? setDemo : setReal)((s) => (s ? fn(migrate(s)) : s)),
    [mode, setDemo, setReal],
  );

  return {
    store,
    mode,
    persona,
    setStore,
    createStore: (s: Store) => {
      setReal(s);
      setMode("real");
    },
    // Starting (or switching) the demo rebuilds it from today, so its dates are always current.
    startDemo: (who: Persona = persona) => {
      setPersona(who);
      setDemo(demoStore(who));
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
