"use client";

// Phase 5 prototype switch (L62): today's flattened globe, or a real globe you spin, in two families of three: with a
// light overview (a1–a3) or pure spin (b1–b3). `?globe=flat|a1|…|b3` in the URL sets it (for screenshots); otherwise the last choice in localStorage.
// shortcut: a prototype-only switch; remove it once the owner has picked a globe.
import { useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";

export type GlobeMode = "flat" | "a1" | "a2" | "a3" | "a4" | "b1" | "b2" | "b3";
const MODES: GlobeMode[] = ["flat", "a1", "a2", "a3", "a4", "b1", "b2", "b3"];
const KEY = "11-meander:globe-proto";
const isMode = (v: unknown): v is GlobeMode => MODES.includes(v as GlobeMode);

export function useGlobeMode(): [GlobeMode, (m: GlobeMode) => void] {
  const [stored, setStored] = useLocalStorage<string>(KEY, "flat");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("globe");
    if (isMode(q) && q !== stored) setStored(q);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- the URL is read once, on load
  return [isMode(stored) ? stored : "flat", setStored];
}
