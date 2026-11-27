#!/usr/bin/env node
// Sandbox seed (user test 12 Nov, "same setup for every grader and tester"; FX-S1 adds a minimal analysis
// per track and says whether the Mentor's key is set): PUTs the maps of the two
// eval tracks into the sandbox dev server, so every data-evals run and user test uses the same tempo,
// bar origin, key, bars and sections. Numbers only: no audio, nothing of the tracks themselves (C2).
//
//   Start the sandbox:  SUPABASE_URL= SUPABASE_SECRET_KEY= ACCESS_CODE=test-code pnpm -F 07-six-am exec next dev -p 3017
//   Then seed it:       node apps/07-six-am/evals/sandbox-seed.mjs [--base http://localhost:3017] [--code test-code] [--maps maps.json]
//
// It refuses to write unless the server says its store is the in-memory sandbox (never the owner's
// Supabase). `--maps` takes a JSON array of full maps (e.g. the real maps exported once from the
// owner's store, numbers only) and PUTs those instead of the built-in ones below.
//
// Built-in maps: tempo, origin, key, bars and length are the measured values the evals used
// (evals-runs/2026-10-26-lab-evals.md, 2026-10-28-drums-slice.md). The SECTION BOUNDS are
// approximations that contain every eval loop in the section the write-ups name (Mason 41–48 in
// Drop 2, 57–64 the breakdown; Lost 69–76 the build); the real maps' bounds were not kept in the repo.
// Swap them for an export with --maps when one exists.
//
// Phase 7 slice 3 (L273g): the layer and energy curves vary by section (they used to be flat 0.5,
// which the map draws as "maybe" everywhere, so a rebuild showed no hints). They are SANDBOX values
// shaped like a real house track (no kick in a breakdown, chords only from the first drop, vocals in
// some sections), not measurements of these tracks. A third map, "worst case", has many short
// sections and a long title (layout checks only; it has no playable original). The sandbox also
// gets saved parts in the library for every rebuild lane but vocals (--no-parts skips them), so the
// rebuild can be filled without making parts live in Make. Rebuild a map: /?rebuild=<its id>.

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []));
const BASE = args.base ?? "http://localhost:3017";
const CODE = args.code ?? "test-code";

const LAYERS = ["kick", "bass", "chords", "hats", "vocals"];
/** A small, fixed wobble so the curves don't look drawn with a ruler (no randomness: same seed every run). */
const wob = (i, k) => 0.06 * Math.sin(i * 1.7 + k * 2.3);
/**
 * A map from its facts; sections as [label, firstBar (1-based), lastBar, layers it has, energy 0–1]
 * in order. A layer a section has reads ~0.85 there (the map draws it solid), else ~0.1.
 */
function map({ id, title, uploader, bpm, originSec, key, scale, bars, durationSec, sections }) {
  const barS = (4 * 60) / bpm, sec = (bar) => Math.round((originSec + (bar - 1) * barS) * 1000) / 1000;
  const at = (i) => sections.find(([, a, b]) => i + 1 >= a && i + 1 <= b) ?? sections[sections.length - 1];
  const curve = (f) => Array.from({ length: bars }, (_, i) => Math.round(Math.min(1, Math.max(0, f(i))) * 100) / 100);
  return {
    id, title, uploader, durationSec, bpm, key, scale, originSec, bars,
    tempo: { earsBpm: bpm, refined: true, coherence: 1 },
    energy: curve((i) => at(i)[4] + wob(i, 0)),
    layers: { kind: "estimate", method: "sandbox seed (per-section placeholder curves)", ...Object.fromEntries(LAYERS.map((l, k) => [l, curve((i) => (at(i)[3].includes(l) ? 0.85 : 0.1) + wob(i, k + 1))])) },
    sections: sections.map(([label, a, b]) => ({ label, startBar: a - 1, endBar: b, startSec: sec(a), endSec: sec(b + 1) })),
  };
}
const ALL = ["kick", "hats", "bass", "chords", "vocals"];

export const MAPS = [
  map({
    id: "https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix",
    title: "Tim Deluxe [Feat.] Sam Obernik - It Just Won't Do (Mason Flint Remix)", uploader: "Mason Flint",
    bpm: 126.05, originSec: 0.11, key: "G", scale: "minor", bars: 108, durationSec: 206,
    // Eval loops: 17–24 and 81–88 (drops), 41–48 (Drop 2), 57–64 (breakdown into a build).
    sections: [["intro", 1, 16, ["kick", "hats"], 0.45], ["drop", 17, 32, ALL, 0.85], ["section", 33, 40, ["kick", "hats", "bass"], 0.6], ["drop", 41, 56, ALL, 0.9],
      ["breakdown", 57, 64, ["chords", "vocals"], 0.3], ["build", 65, 72, ["hats", "chords"], 0.55], ["drop", 73, 96, ALL, 0.9], ["outro", 97, 108, ["kick", "hats"], 0.4]],
  }),
  map({
    id: "https://soundcloud.com/carbune/lost-in-the-loop-o-deibys",
    title: "Lost in the Loop (O Deibys)", uploader: "Cărbune Adrian",
    bpm: 123.02, originSec: 1.407, key: "G", scale: "major", bars: 101, durationSec: 199.5,
    // Sections in the order the Phase 4 listen found them (intro/drop/section/build/drop/outro);
    // eval loops: 21–28 and 29–36 (first drop), 69–76 (build), 77–84 and 85–92 (second drop).
    sections: [["intro", 1, 16, ["kick", "hats"], 0.45], ["drop", 17, 40, ["kick", "hats", "bass", "chords", "vocals"], 0.85], ["section", 41, 64, ["chords", "vocals"], 0.3],
      ["build", 65, 76, ["kick", "hats", "chords"], 0.6], ["drop", 77, 92, ["kick", "hats", "bass", "chords"], 0.9], ["outro", 93, 101, ["kick"], 0.4]],
  }),
  // Layout only (no playable original): many short sections, a long title; 128 bars at 124 BPM.
  map({
    id: "https://soundcloud.com/six-am-sandbox/worst-case-many-short-sections",
    title: "Hold On To Your Love (Dennis Ferrer's Unreleased Dub, 2009 Remaster) [Worst-case layout check]", uploader: "Six AM sandbox",
    bpm: 124, originSec: 0.2, key: "A", scale: "minor", bars: 128, durationSec: 248,
    sections: [["intro", 1, 16, ["kick", "hats"], 0.4], ["build", 17, 24, ["kick", "hats", "chords"], 0.55], ["section", 25, 28, ["hats"], 0.5], ["drop", 29, 60, ALL, 0.9],
      ["breakdown", 61, 76, ["chords", "vocals"], 0.3], ["build", 77, 80, ["kick", "chords"], 0.6], ["section", 81, 84, ["hats"], 0.5], ["drop", 85, 112, ALL, 0.9],
      ["breakdown", 113, 116, ["chords"], 0.3], ["outro", 117, 128, ["kick"], 0.4]],
  }),
];

/** Saved parts for the library (Phase 7 slice 3, L273g): every rebuild lane but vocals, in G major at
 *  123 BPM (Lost in the Loop's), made the way Make saves them (settings and notes only, C2). */
const hits = (steps, midi, bars = 1, vel = 1) => Array.from({ length: bars }, (_, b) => steps.map((st) => ({ step: b * 16 + st, midi, dur: 1, vel }))).flat();
const chord = (bar, midis, dur = 6) => midis.map((midi) => ({ step: bar * 16, midi, dur, vel: 0.8 }));
const SRC = { title: "Lost in the Loop (O Deibys)", url: "https://soundcloud.com/carbune/lost-in-the-loop-o-deibys" };
const base = { key: "G", scale: "major", bpm: 123.02, source: SRC, tags: ["sandbox"] };
export const PARTS = [
  { ...base, name: "909 round kick, four on the floor", part: "drums", preset: "kick-909-round", macros: {}, pattern: { bars: 1, notes: hits([0, 4, 8, 12], 36) } },
  { ...base, name: "House bounce kick", part: "drums", preset: "kick-house-bounce", macros: {}, pattern: { bars: 1, notes: hits([0, 4, 8, 12, 14], 36) } },
  { ...base, name: "909 clap on 2 and 4", part: "drums", preset: "clap-909-clap", macros: {}, pattern: { bars: 1, notes: hits([4, 12], 39) } },
  { ...base, name: "Offbeat hats", part: "drums", preset: "hat-909-closed", macros: {}, pattern: { bars: 1, notes: hits([2, 6, 10, 14], 42) } },
  { ...base, name: "Sixteenth hats, 2 bars", part: "drums", preset: "hat-808-closed", macros: {}, pattern: { bars: 2, notes: hits([0, 2, 4, 6, 8, 10, 12, 14], 42, 2, 0.7) } },
  { ...base, name: "Egg shaker 16ths", part: "drums", preset: "perc-egg-shaker", macros: {}, pattern: { bars: 1, notes: hits([1, 3, 5, 7, 9, 11, 13, 15], 70, 1, 0.6) } },
  { ...base, name: "Rubber sub", part: "bass", preset: "rubber-pluck", macros: {}, pattern: { bars: 2, notes: [{ step: 2, midi: 31, dur: 2, vel: 0.9 }, { step: 6, midi: 31, dur: 2, vel: 0.8 }, { step: 10, midi: 34, dur: 2, vel: 0.9 }, { step: 18, midi: 28, dur: 2, vel: 0.9 }, { step: 22, midi: 30, dur: 2, vel: 0.8 }, { step: 26, midi: 31, dur: 2, vel: 0.9 }] } },
  { ...base, name: "Drop bassline", part: "bass", preset: "round-sub", macros: {}, pattern: { bars: 4, notes: [0, 1, 2, 3].flatMap((b) => [{ step: b * 16 + 2, midi: [31, 28, 24, 26][b], dur: 3, vel: 0.9 }, { step: b * 16 + 10, midi: [31, 28, 24, 26][b], dur: 3, vel: 0.85 }]) } },
  { ...base, name: "G stabs, 8 bars", part: "other", preset: "chords-stab", macros: {}, pattern: { bars: 8, notes: [0, 1, 2, 3, 4, 5, 6, 7].flatMap((b) => chord(b, [[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]][b % 4], 4)), chords: [0, 1, 2, 3, 4, 5, 6, 7].map((b) => ({ step: b * 16, steps: 16, name: ["G", "Em", "C", "D"][b % 4] })) } },
  { ...base, name: "Warm pad", part: "other", preset: "chords-pad", macros: {}, pattern: { bars: 4, notes: [0, 1, 2, 3].flatMap((b) => chord(b, [[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]][b], 16)) } },
  { ...base, name: "Bright noise riser", part: "other", preset: "fx-riser-noise", macros: {}, pattern: { bars: 4, notes: [{ step: 0, midi: 43, dur: 64, vel: 0.8 }] } },
];

async function main() {
  const head = { "content-type": "application/json", "x-access-code": CODE };
  const probe = await fetch(`${BASE}/api/analyses`, { headers: head }).catch((e) => ({ ok: false, status: String(e) }));
  const status = probe.ok ? await probe.json() : null, store = status?.store ?? null;
  if (store !== "memory") {
    console.error(`Refusing: ${BASE} is not the in-memory sandbox (store: ${store ?? `unreachable, ${probe.status}`}). Start it with SUPABASE_URL= SUPABASE_SECRET_KEY= ACCESS_CODE=test-code.`);
    process.exit(1);
  }
  const maps = args.maps ? JSON.parse(await (await import("node:fs/promises")).readFile(args.maps, "utf8")) : MAPS;
  // FX-S1, FN6: the Mentor answers only with its key set on the server: ask the server (a yes/no from the
  // sandbox, never the value), not this shell.
  console.log(`ANTHROPIC_API_KEY on the server: ${status?.mentorKey ? "set" : "NOT set: Mentor questions will fail; restart the server with it in its env"} (the value is never printed)`);
  for (const m of maps) {
    const r = await fetch(`${BASE}/api/maps?id=${encodeURIComponent(m.id)}`, { method: "PUT", headers: head, body: JSON.stringify({ map: m }) });
    console.log(`${r.ok ? "seeded" : `FAILED ${r.status}`}  ${m.title}: ${m.bpm} BPM, origin ${m.originSec} s, ${m.key} ${m.scale}, ${m.bars} bars, ${m.sections.length} sections`);
    if (!r.ok) { console.error(await r.text()); process.exit(1); }
    // FX-S1: a minimal analysis too (title, uploader, tempo, key, a placeholder genre), so the Lab and
    // the Mentor have the track's facts as they do for a real, analysed track. Demo rows: memory store only.
    const analysis = { id: m.id, soundcloudUrl: m.id, title: m.title, uploader: m.uploader, bpm: m.bpm, bpmConfidence: 1, key: m.key, scale: m.scale, keyStrength: 1, durationMs: Math.round(m.durationSec * 1000), analysedSeconds: m.durationSec, genres: [{ style: "Electronic---House", p: 0.5 }], analysedAt: new Date().toISOString() };
    const a = await fetch(`${BASE}/api/analyses?id=${encodeURIComponent(m.id)}`, { method: "PUT", headers: { ...head, "x-six-am-demo": "1" }, body: JSON.stringify({ analysis }) });
    console.log(`  analysis ${a.ok ? "seeded" : `FAILED ${a.status}`} (placeholder genre: House)`);
    console.log(`  open: ${BASE}/map?id=${encodeURIComponent(m.id)}&mode=make&make=drums`);
    console.log(`  rebuild: ${BASE}/?rebuild=${encodeURIComponent(m.id)}`);
  }
  if (process.argv.includes("--no-parts")) return;
  // Saved parts, once: a part whose name is already in the library is skipped.
  const have = new Set(((await (await fetch(`${BASE}/api/sounds`, { headers: head })).json()).sounds ?? []).map((x) => x.name));
  for (const p of PARTS) {
    if (have.has(p.name)) { console.log(`part already there  ${p.name}`); continue; }
    const r = await fetch(`${BASE}/api/sounds`, { method: "POST", headers: head, body: JSON.stringify({ sound: p }) });
    console.log(`${r.ok ? "part seeded" : `part FAILED ${r.status}`}  ${p.name} (${p.preset}, ${p.pattern.bars} bar${p.pattern.bars > 1 ? "s" : ""})`);
    if (!r.ok) { console.error(await r.text()); process.exit(1); }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
