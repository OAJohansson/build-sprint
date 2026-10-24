// A loop in a track's key and tempo → the timed events it should sound: what the engine schedules
// and what a grader compares a render against (X3). Pure, unit tested.
import { clampBpm, secondsPerStep } from "@/lib/tempo";
import { drumPatternById, type DrumSound } from "./kits";
import type { PlayableLoop } from "./loop";
import { patternById, renderPattern } from "./patterns";
import { midiToHz, type Scale } from "./theory";

export type TimedEvent = {
  /** Seconds from the loop's start (the first repeat starts at 0). */
  time: number;
  /** The 16th on the grid, counted from the start of the first repeat. */
  step: number;
  dur: number;
  vel: number;
  midi?: number;
  hz?: number;
  name?: string;
  sound?: DrumSound;
};

/** Every event of `repeats` passes of the loop at `bpm`; null if the loop's pattern or the key is unknown. */
export function loopEvents(loop: PlayableLoop, key: string, scale: Scale, bpm: number, repeats = 1): TimedEvent[] | null {
  const sps = secondsPerStep(clampBpm(bpm)), len = loop.bars * 16;
  const one: Omit<TimedEvent, "time">[] | null = (() => {
    if (loop.source === "kit") {
      const p = drumPatternById(loop.pattern);
      return p ? p.hits.map((x) => ({ step: x.step, dur: 1, vel: x.vel, sound: x.sound })) : null;
    }
    const p = patternById(loop.pattern);
    const notes = p && renderPattern(p, key, scale);
    return notes ? notes.map((n) => ({ step: n.step, dur: n.dur, vel: n.vel, midi: n.midi, hz: midiToHz(n.midi), name: n.name })) : null;
  })();
  if (!one) return null;
  return Array.from({ length: Math.max(1, Math.floor(repeats)) }, (_, r) =>
    one.map((e) => ({ ...e, step: r * len + e.step, time: (r * len + e.step) * sps })),
  ).flat();
}

/** Seconds of `repeats` passes of the loop at `bpm` (without any release tail). */
export function loopSeconds(loop: PlayableLoop, bpm: number, repeats = 1): number {
  return loop.bars * 16 * Math.max(1, Math.floor(repeats)) * secondsPerStep(clampBpm(bpm));
}
