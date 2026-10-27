// The track's own sounds on the Studio's 16th grid (S3/S4): like schedule.ts's buildIndex for crate
// loops, every note of every region that plays a sound, keyed by the step it starts on, rendered in
// the track's key. Pure.
import type { Region } from "@/lib/timeline";
import { drumPatternById, type DrumHit } from "./kits";
import type { Sound } from "./loop";
import { patternById, renderPattern, type SynthNote } from "./patterns";
import type { Scale } from "./theory";

export type SoundHit =
  | { track: number; soundId: string; kind: "synth"; note: SynthNote }
  | { track: number; soundId: string; kind: "kit"; hit: DrumHit }
  /** An AI loop: one pass of its audio starts here and lasts `dur` 16ths (cut at the region's end). */
  | { track: number; soundId: string; kind: "ai"; dur: number }
  /** A library sound (S5): one rendered pass starts here and lasts `dur` 16ths (cut at the region's end). */
  | { track: number; soundId: string; kind: "lib"; dur: number };

/** One pass of a sound as hits from its own start, or null when its pattern or the key is unknown. */
export function soundPass(sound: Sound, key: string, scale: Scale): { step: number; make: (dur?: number) => Omit<SoundHit, "track" | "soundId">; dur: number }[] | null {
  if (sound.source === "ai") return [{ step: 0, dur: sound.bars * 16, make: (dur = sound.bars * 16) => ({ kind: "ai", dur }) }];
  if (sound.source === "lib") return [{ step: 0, dur: sound.bars * 16, make: (dur = sound.bars * 16) => ({ kind: "lib", dur }) }];
  if (sound.source === "kit") {
    const p = drumPatternById(sound.pattern);
    return p ? p.hits.map((hit) => ({ step: hit.step, dur: 1, make: () => ({ kind: "kit", hit }) })) : null;
  }
  const p = patternById(sound.pattern);
  const notes = p && renderPattern(p, key, scale);
  return notes ? notes.map((note) => ({ step: note.step, dur: note.dur, make: (dur = note.dur) => ({ kind: "synth", note: { ...note, dur } }) })) : null;
}

export function buildSoundIndex(regions: Region[], sounds: Sound[], key: string, scale: Scale, steps: number): Map<number, SoundHit[]> {
  const byId = new Map(sounds.map((s) => [s.id, s]));
  const index = new Map<number, SoundHit[]>();
  for (const r of regions) {
    const sound = byId.get(r.loopId);
    const pass = sound && soundPass(sound, key, scale);
    if (!sound || !pass) continue;
    const loopSteps = sound.bars * 16;
    const start = (r.start - 1) * 16, end = start + r.length * 16;
    for (let rep = start; rep < end; rep += loopSteps) {
      for (const p of pass) {
        const step = rep + p.step;
        if (step >= end || step >= steps) continue;
        // Nothing rings past its region, so a cut-short loop stays clean.
        const hit = { track: r.track, soundId: sound.id, ...p.make(Math.min(p.dur, end - step)) } as SoundHit;
        const list = index.get(step) ?? [];
        list.push(hit);
        index.set(step, list);
      }
    }
  }
  return index;
}

/** Hits of one sound on step k when previewing it alone in the drawer: it simply loops. */
export function previewSoundHits(sound: Sound, key: string, scale: Scale, k: number): SoundHit[] {
  const pass = soundPass(sound, key, scale) ?? [];
  const at = k % (sound.bars * 16);
  return pass.filter((p) => p.step === at).map((p) => ({ track: sound.lane, soundId: sound.id, ...p.make() }) as SoundHit);
}
