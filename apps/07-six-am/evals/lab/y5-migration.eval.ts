// Y5 / guardrail: tracks saved before S5 (the 4 fixed lanes) still parse and schedule unchanged
// after the lane-model change. Old code = HEAD~1 copies in ./old (tracks, timeline, loop, schedule).
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import * as OLD_T from "./old/tracks";
import * as OLD_TL from "./old/timeline";
import * as OLD_L from "./old/loop";
import * as OLD_S from "./old/schedule";
import { parseDoc } from "@/lib/tracks";
import { LOOPS, registerSounds, silentLanes, type Doc } from "@/lib/timeline";
import { buildSoundIndex } from "@/lib/synths/schedule";
import { buildIndex } from "@/lib/schedule";
import { RECIPES } from "@/lib/recipes";
const recipeFor = (_d: unknown) => RECIPES;
import { legacyMix, laneMix, lanesOf, laneOfRegion, migrateDoc } from "@/lib/studio-lanes";
import { BASS_PATTERNS, CHORD_PATTERNS } from "@/lib/synths/patterns";
import { DRUM_PATTERNS } from "@/lib/synths/kits";
import { rng } from "./grade";

const TRACK_DB = [0, -3, -7, -9]; // audio.ts today
const KEYS = ["A", "C", "F#", "Bb", "G"];

function oldDoc(r: () => number, i: number): unknown {
  const bars = [undefined, 32, 64, 96, 128][i % 5];
  const total = bars ?? 64;
  const sounds: OLD_L.Sound[] = [];
  if (r() < 0.7) { const p = BASS_PATTERNS[Math.floor(r() * BASS_PATTERNS.length)]; const pr = p.presets[Math.floor(r() * p.presets.length)]; const s = OLD_L.makeSynthLoop(pr, p.id, { cutoff: 200 + r() * 2000 }, `sb${i}`); if (s) sounds.push(s); }
  if (r() < 0.6) { const p = CHORD_PATTERNS[Math.floor(r() * CHORD_PATTERNS.length)]; const pr = p.presets[Math.floor(r() * p.presets.length)]; const s = OLD_L.makeSynthLoop(pr, p.id, {}, `sc${i}`); if (s) sounds.push(s); }
  if (r() < 0.6) { const p = DRUM_PATTERNS[Math.floor(r() * DRUM_PATTERNS.length)]; const s = OLD_L.makeKitLoop(r() < 0.5 ? "909" : "808", p.id, `sk${i}`); if (s) sounds.push(s); }
  if (r() < 0.3) sounds.push({ id: `sa${i}`, source: "ai", name: "AI bass loop", bars: 4, lane: 1, aiId: "0f8fad5b-d9cb-469f-a165-70867728950e", bpm: 124, key: "A", scale: "minor", measured: { bpm: 124, key: "A", scale: "minor" }, checked: true, costUsd: 0.08, draws: 1 } as OLD_L.AiLoop);
  OLD_TL.registerSounds(sounds);
  const pool = [...LOOPS.map((l) => ({ id: l.id, track: l.track, bars: l.bars })), ...sounds.map((s) => ({ id: s.id, track: OLD_L.soundMeta(s).track, bars: s.bars }))];
  let regions: OLD_TL.Region[] = [];
  for (let k = 0; k < 4 + Math.floor(r() * 30); k++) {
    const l = pool[Math.floor(r() * pool.length)];
    const reps = 1 + Math.floor(r() * 4), length = l.bars * reps;
    const start = 1 + Math.floor(r() * Math.max(1, total - length));
    if (start + length - 1 > total) continue;
    regions = OLD_TL.place(regions, { id: `r${i}_${k}`, loopId: l.id, track: l.track, start, length });
  }
  const muted = [0, 1, 2, 3].map(() => r() < 0.15);
  const d: Record<string, unknown> = { regions, muted, ...(bars ? { bars } : {}), bpm: 118 + Math.round(r() * 120) / 10, key: { key: KEYS[i % 5], scale: i % 2 ? "minor" : "major" }, ...(sounds.length ? { sounds } : {}) };
  if (r() < 0.3) d.soloed = [0, 1, 2, 3].map(() => r() < 0.3);
  if (r() < 0.5) d.markers = [{ bar: 1, label: "intro" }, { bar: 17, label: "drop" }];
  return JSON.parse(JSON.stringify(d));
}

const hitsKey = (m: Map<number, unknown[]>) => JSON.stringify([...m.entries()].sort((a, b) => a[0] - b[0]));

describe("Y5 migration: pre-S5 tracks unchanged", () => {
  const r = rng(26);
  const docs: unknown[] = [JSON.parse(JSON.stringify(OLD_TL.demoDoc()))];
  for (let i = 0; i < 300; i++) docs.push(oldDoc(r, i));
  const res = { docs: docs.length, oldAccepts: 0, newEqualsOld: 0, soundIndexSame: 0, crateIndexSame: 0, migratedLanes4: 0, everyRegionLaned: 0, laneTrackSame: 0, gainsSameAsToday: 0, audibleSame: 0, legacyMixRoundTrip: 0, migratedReparses: 0, migratedIndexSame: 0, regions: 0, hits: 0 };
  it("runs", () => {
    for (const raw of docs) {
      const o = OLD_T.parseDoc(raw);
      if (!o) continue;
      res.oldAccepts++;
      const n = parseDoc(raw) as Doc;
      if (JSON.stringify(n) === JSON.stringify(o)) res.newEqualsOld++;
      registerSounds(n.sounds);
      const steps = (n.bars ?? 64) * 16;
      const key = n.key?.key ?? "A", sc = n.key?.scale ?? "minor";
      const oi = OLD_S.buildSoundIndex(o.regions, o.sounds ?? [], key, sc, steps);
      const ni = buildSoundIndex(n.regions, n.sounds ?? [], key, sc, steps);
      if (hitsKey(oi) === hitsKey(ni)) res.soundIndexSame++;
      res.hits += [...ni.values()].reduce((a, x) => a + x.length, 0);
      const ci = buildIndex(n.regions, recipeFor(n), steps), co = buildIndex(o.regions as never, recipeFor(n), steps);
      if (hitsKey(ci) === hitsKey(co)) res.crateIndexSame++;
      const m = migrateDoc(n);
      res.regions += m.regions.length;
      if (m.lanes!.length === 4) res.migratedLanes4++;
      if (m.regions.every((x) => typeof x.lane === "string")) res.everyRegionLaned++;
      if (m.regions.every((x, i) => x.track === n.regions[i].track && laneOfRegion(x, m.lanes!) && ["drums", "bass", "chords", "top"][x.track] === x.lane)) res.laneTrackSame++;
      const mix = laneMix(lanesOf(m));
      if (mix.every((x, i) => x.gainDb === TRACK_DB[i] && x.pan === 0)) res.gainsSameAsToday++;
      const silent = silentLanes(n);
      if (mix.every((x, i) => x.audible === !silent[i])) res.audibleSame++;
      const lm = legacyMix(lanesOf(m));
      if (JSON.stringify(lm.muted) === JSON.stringify(n.muted) && JSON.stringify(lm.soloed) === JSON.stringify(n.soloed ?? [false, false, false, false])) res.legacyMixRoundTrip++;
      const back = parseDoc(JSON.parse(JSON.stringify(m)));
      if (back && JSON.stringify(back.regions) === JSON.stringify(m.regions)) res.migratedReparses++;
      if (back && hitsKey(buildSoundIndex(back.regions, back.sounds ?? [], key, sc, steps)) === hitsKey(ni)) res.migratedIndexSame++;
    }
    fs.writeFileSync(new URL("./y5-migration-results.json", import.meta.url), JSON.stringify(res, null, 1));
    console.log(res);
    expect(res.oldAccepts).toBeGreaterThan(200);
  });
});
