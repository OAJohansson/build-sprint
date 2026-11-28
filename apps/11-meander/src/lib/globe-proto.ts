"use client";

// Phase 5 prototype switch (L62): today's flattened globe, or a real globe you spin, with a light overview (A) or
// without (B). `?globe=flat|a|b` in the URL sets it (for screenshots); otherwise the last choice in localStorage.
// shortcut: a prototype-only switch; remove it once the owner has picked a globe.
import { useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";

export type GlobeMode = "flat" | "a" | "b";
const KEY = "11-meander:globe-proto";
const isMode = (v: unknown): v is GlobeMode => v === "flat" || v === "a" || v === "b";

export function useGlobeMode(): [GlobeMode, (m: GlobeMode) => void] {
  const [stored, setStored] = useLocalStorage<string>(KEY, "flat");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("globe");
    if (isMode(q) && q !== stored) setStored(q);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- the URL is read once, on load
  return [isMode(stored) ? stored : "flat", setStored];
}
