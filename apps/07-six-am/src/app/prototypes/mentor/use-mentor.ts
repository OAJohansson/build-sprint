"use client";
// Shared prototype state for the three Mentor directions: the selected track (read from the real
// Analyse demo's selected row), scope, thread, cost and the 50/day warning. Throwaway.
import { useEffect, useState, type RefObject } from "react";
import type { EarsAnalysis } from "@/lib/ears/results";
import { canned, COST, COST_WARN, findTrack, JOBS, listenFor, explainFor, TEACH, type Answer, type Job } from "./data";

export type Scope = "track" | "general";
export type Preset = "explain" | "listen" | "general" | "warn" | "empty" | "jobs" | "closed";

export type Mentor = {
  track: EarsAnalysis | null;
  scope: Scope;
  setScope: (s: Scope) => void;
  thread: Answer[];
  ask: (job: Job) => void;
  send: (text: string) => void;
  warn: boolean;
  continueAnyway: () => void;
  stopToday: () => void;
  cost: { today: number; month: number; count: number };
  preset: Preset;
};

/** Follows the Analyse table's selected row (aria-selected) without touching production code. */
export function useSelectedTrack(root: RefObject<HTMLElement | null>): EarsAnalysis | null {
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const read = () => {
      const row = el.querySelector('[role="row"][aria-selected="true"]');
      setTitle(row?.querySelector("b")?.textContent ?? null);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    return () => mo.disconnect();
  }, [root]);
  return findTrack(title);
}

function initial(preset: Preset, track: EarsAnalysis | null): Answer[] {
  if (preset === "explain" && track) return [explainFor(track)];
  if (preset === "listen" && track) return [explainFor(track), listenFor(track)];
  if (preset === "general") return [TEACH];
  if (preset === "warn" && track) return [explainFor(track)];
  return [];
}

export function useMentor(track: EarsAnalysis | null, preset: Preset): Mentor {
  const [scope, setScope] = useState<Scope>(preset === "general" ? "general" : "track");
  const [threads, setThreads] = useState<Record<string, Answer[]>>({});
  const [warn, setWarn] = useState(preset === "warn");
  const [stopped, setStopped] = useState(false);
  const key = scope === "general" || !track ? "general" : track.id;
  const thread = threads[key] ?? (key === "general" ? (preset === "general" ? [TEACH] : []) : initial(preset, track));
  const base = preset === "warn" ? COST_WARN : COST;
  const cost = { ...base };
  const push = (a: Answer) => {
    if (stopped) return;
    setThreads((t) => ({ ...t, [key]: [...thread, a] }));
  };
  const t = key === "general" ? null : track;
  return {
    track: t, scope: t ? scope : "general", setScope, thread, warn, cost, preset,
    ask: (job) => {
      if (warn) return;
      const needs = JOBS.find((j) => j.id === job)?.needsTrack;
      push(canned(needs && !t ? ("x" as Job) : job, t));
    },
    send: (text) => { if (!warn && text.trim()) push(canned("chat", t, text.trim())); },
    continueAnyway: () => setWarn(false),
    stopToday: () => { setWarn(false); setStopped(true); },
  };
}
