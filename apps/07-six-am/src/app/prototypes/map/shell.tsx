"use client";
// Shared chrome for the map prototypes: the app bar, the facts, the Mentor and the one action.
import { useState } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { MENTOR, SECTIONS, TRACK, barTime } from "./data";
import m from "./map.module.css";

export type VariantProps = { heard: number };

export function AppBar() {
  return (
    <header className={m.appBar}>
      <div className={m.logo}><Logo className={m.mark} />Six AM</div>
      <ViewsNav current="analyse" />
      <div className={m.appRight}><SettingsLink /></div>
    </header>
  );
}

export function Facts({ heard, sep = " · " }: { heard: number; sep?: string }) {
  const parts = [`${TRACK.bpm} BPM`, TRACK.key, heard < TRACK.bars ? `${barTime(heard + 1)} of 7:44` : "7:44", `${TRACK.bars} bars`];
  return <span className={m.facts}>{parts.join(sep)}</span>;
}

export function useMentor() {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen((o) => !o) };
}

export function ExplainBtn({ mentor, disabled }: { mentor: ReturnType<typeof useMentor>; disabled?: boolean }) {
  return (
    <button className={m.textBtn} onClick={mentor.toggle} aria-expanded={mentor.open} disabled={disabled}>
      {mentor.open ? "Hide explanation" : "Explain the structure"}
    </button>
  );
}

export function MentorAnswer({ compact }: { compact?: boolean }) {
  const [more, setMore] = useState(false);
  return (
    <div className={compact ? `${m.mentor} ${m.mentorCompact}` : m.mentor} role="region" aria-label="Mentor">
      <span className={m.mentorWho}>Mentor</span>
      <p>{MENTOR.join(" ")}</p>
      {more ? (
        <p>A build adds one layer at a time so you feel the drop coming; a breakdown takes the low end away so its return feels big. Try copying the 16-bar steps first.</p>
      ) : (
        <button className={m.textBtn} onClick={() => setMore(true)}>Tell me more</button>
      )}
    </div>
  );
}

export function StartBtn({ heard }: { heard: number }) {
  const [done, setDone] = useState(false);
  const ready = heard >= TRACK.bars;
  if (done) return <span className={m.started}>New track: {TRACK.bpm} BPM, {TRACK.key}, {TRACK.bars} bars, {SECTIONS.length} markers</span>;
  return (
    <button className={m.start} onClick={() => setDone(true)} disabled={!ready} title={ready ? undefined : "Ready when the whole track has played"}>
      Start a track from this
    </button>
  );
}

export const EST_NOTE = "Layers are estimates from the sound, not stems.";

export function Listening({ heard }: { heard: number }) {
  if (heard >= TRACK.bars) return null;
  const left = Math.round(((TRACK.bars - heard) * 4 * 60) / TRACK.bpm);
  return (
    <div className={m.prog}>
      <div className={m.progText}>
        <span>Listening through tab capture · bar {heard} of {TRACK.bars}</span>
        <span>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} left</span>
      </div>
      <div className={m.progBar}><i style={{ width: `${(heard / TRACK.bars) * 100}%` }} /></div>
    </div>
  );
}

/** Percent position of a bar on a 1..241 axis. */
export const pct = (bar: number) => `${((bar - 1) / TRACK.bars) * 100}%`;
export const wpct = (from: number, to: number) => `${((to - from) / TRACK.bars) * 100}%`;
