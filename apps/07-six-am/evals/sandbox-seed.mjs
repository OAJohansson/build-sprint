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
// Swap them for an export with --maps when one exists. Layer and energy curves are flat placeholders
// (the Lab measures the parts live; the curves only shade the map).

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []));
const BASE = args.base ?? "http://localhost:3017";
const CODE = args.code ?? "test-code";

const flat = (n, v = 0.5) => Array.from({ length: n }, () => v);
/** A map from its facts; sections as [label, firstBar (1-based), lastBar] in order. */
function map({ id, title, uploader, bpm, originSec, key, scale, bars, durationSec, sections }) {
  const barS = (4 * 60) / bpm, sec = (bar) => Math.round((originSec + (bar - 1) * barS) * 1000) / 1000;
  return {
    id, title, uploader, durationSec, bpm, key, scale, originSec, bars,
    tempo: { earsBpm: bpm, refined: true, coherence: 1 },
    energy: flat(bars), layers: { kick: flat(bars), bass: flat(bars), chords: flat(bars), hats: flat(bars), vocals: flat(bars) },
    sections: sections.map(([label, a, b]) => ({ label, startBar: a - 1, endBar: b, startSec: sec(a), endSec: sec(b + 1) })),
  };
}

export const MAPS = [
  map({
    id: "https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix",
    title: "Tim Deluxe [Feat.] Sam Obernik - It Just Won't Do (Mason Flint Remix)", uploader: "Mason Flint",
    bpm: 126.05, originSec: 0.11, key: "G", scale: "minor", bars: 108, durationSec: 206,
    // Eval loops: 17–24 and 81–88 (drops), 41–48 (Drop 2), 57–64 (breakdown into a build).
    sections: [["intro", 1, 16], ["drop", 17, 32], ["section", 33, 40], ["drop", 41, 56], ["breakdown", 57, 64], ["build", 65, 72], ["drop", 73, 96], ["outro", 97, 108]],
  }),
  map({
    id: "https://soundcloud.com/carbune/lost-in-the-loop-o-deibys",
    title: "Lost in the Loop (O Deibys)", uploader: "Cărbune Adrian",
    bpm: 123.02, originSec: 1.407, key: "G", scale: "major", bars: 101, durationSec: 199.5,
    // Sections in the order the Phase 4 listen found them (intro/drop/section/build/drop/outro);
    // eval loops: 21–28 and 29–36 (first drop), 69–76 (build), 77–84 and 85–92 (second drop).
    sections: [["intro", 1, 16], ["drop", 17, 40], ["section", 41, 64], ["build", 65, 76], ["drop", 77, 92], ["outro", 93, 101]],
  }),
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
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
