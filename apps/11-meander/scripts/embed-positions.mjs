// Finds a fixed place on a unit sphere for every school, so linked schools sit close together and all
// schools spread evenly (lifted from the design's _src/embed.mjs). Re-run after adding a school or a link:
//   pnpm -F 11-meander positions            (philosophy)
//   pnpm -F 11-meander positions music      (or FIELD=music)
// Reads src/content/<field>/schools.json and links.json, writes src/content/<field>/positions.json ([latitude, longitude]).
// Deterministic: the same schools and links in the same order always give the same positions.
import fs from "node:fs";

const FIELD = process.argv[2] ?? process.env.FIELD ?? "philosophy";
if (!/^[a-z-]+$/.test(FIELD)) throw new Error(`positions: bad field "${FIELD}"`);
const dir = new URL(`../src/content/${FIELD}/`, import.meta.url);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), "utf8"));
const schools = read("schools.json").schools;
const links = read("links.json").links;

let seed = Number(process.env.SEED ?? 11);
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const ang = (a, b) => (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180) / Math.PI;

const ids = schools.map((s) => s.id);
const L = links.map((l) => {
  const pair = [ids.indexOf(l.from), ids.indexOf(l.to)];
  if (pair.includes(-1)) throw new Error(`link ${l.from} → ${l.to} names a school that is not in schools.json`);
  return pair;
});
// Link length to aim for and the closest two schools may sit, in degrees, plus the random seed. The design used
// 47 / 38 for 24 schools and 37 links. For the sourced content (23 schools, 56 links) a grid of 55-65 / 40-44 and
// seeds 11 and 23 was checked over all 23 focuses; 65 / 44, seed 11 was one of only four settings with no
// label overlaps, no label over a dot and no neighbour name nearer another neighbour's dot, and had the fewest
// rim pokes (7). Re-check (every focus) after the links change. Override: TARGET=60 MINSEP=42 SEED=23.
// 27 Nov (#42, four Eastern schools added): 27 schools don't fit at 44°, so MINSEP is 42; with ANCHOR 1 and
// COHESION 50 the 23 kept schools moved 18° on average and every focus re-checked clean (0 past the rim, 0 overlaps,
// 0 over dots, 0 threads through the title), and each Eastern school's nearest neighbour is another Eastern one.
// Music (phase 4): its own defaults, so tuning it never touches philosophy's.
const DEFAULTS = { philosophy: { target: 65, minsep: 42, cohesion: 50 }, music: { target: 60, minsep: 38, cohesion: 55 } }[FIELD] ?? { target: 65, minsep: 42, cohesion: 50 };
const TARGET = Number(process.env.TARGET ?? DEFAULTS.target), MINSEP = Number(process.env.MINSEP ?? DEFAULTS.minsep);
let energy = function (P) {
  let e = 0;
  for (const [a, b] of L) { const d = ang(P[a], P[b]); e += Math.max(0, d - TARGET) ** 2 * 2.5; }
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const d = ang(P[i], P[j]); if (d < MINSEP) e += (MINSEP - d) ** 2 * 30; e += 60000 / (d * d);
  }
  return e;
}
// Schools that already have a place start there and are held near it by a spring (ANCHOR), so adding schools
// makes room without reshuffling the globe (the Western layout was checked over every focus). New schools start
// at random. FRESH=1 re-embeds everything from scratch.
const toVec = ([lat, lon]) => { const a = (lat * Math.PI) / 180, o = (lon * Math.PI) / 180; return [Math.cos(a) * Math.sin(o), Math.sin(a), Math.cos(a) * Math.cos(o)]; };
let prev = {};
try { prev = process.env.FRESH ? {} : read("positions.json"); } catch {}
const fixed = ids.map((id) => (prev[id] ? toVec(prev[id]) : null));
const free = ids.map((_, i) => i);
const ANCHOR = Number(process.env.ANCHOR ?? 1);
// Nothing new to place: keep the checked layout as it is (a content re-import must not move the globe).
if (!process.env.FRESH && fixed.every(Boolean)) {
  console.log(`${FIELD}/positions.json: all ${ids.length} placed; unchanged (FRESH=1 to re-embed)`);
  process.exit(0);
}
// A tradition other than the default (the Eastern schools, #42) reads as its own region: its schools are pulled
// within COHESION degrees of each other, on top of the link and spacing terms. Music clusters every genre by its
// `family` (roots, rock, soul, caribbean-latin-african, hiphop, electronic) the same way.
const tradition = schools.map((s) => s.family ?? s.tradition ?? null);
const COHESION = Number(process.env.COHESION ?? DEFAULTS.cohesion);
const baseEnergy = energy;
energy = (P) => {
  let e = baseEnergy(P);
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    if (!tradition[i] || tradition[i] !== tradition[j]) continue;
    const d = ang(P[i], P[j]); if (d > COHESION) e += (d - COHESION) ** 2 * 6;
  }
  for (let i = 0; i < P.length; i++) if (fixed[i]) e += ANCHOR * ang(P[i], fixed[i]) ** 2;
  return e;
};
let best = null, bestE = Infinity;
const fresh = fixed.every((f) => !f);
for (let run = 0; run < (fresh ? 70 : 24); run++) {
  const P = ids.map((_, i) => fixed[i] ?? norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]));
  let e = energy(P), T = 1;
  for (let it = 0; it < 70000; it++) {
    const i = free[Math.floor(rnd() * free.length)], old = P[i], s = (fixed[i] ? 0.08 : 0.35) * T + 0.01;
    P[i] = norm(old.map((x) => x + (rnd() - 0.5) * s));
    const e2 = energy(P);
    if (e2 < e || rnd() < Math.exp((e - e2) / (40 * T + 0.01))) e = e2; else P[i] = old;
    T *= 0.99991;
  }
  if (e < bestE) { bestE = e; best = P.map((p) => p.slice()); }
}
const moved = ids.map((_, i) => (fixed[i] ? ang(best[i], fixed[i]) : 0)).filter((_, i) => fixed[i]);
if (moved.length) console.log(`kept schools moved: mean ${(moved.reduce((a, b) => a + b, 0) / moved.length).toFixed(1)}°, max ${Math.max(...moved).toFixed(1)}°`);
const out = {};
ids.forEach((id, i) => {
  const [x, y, z] = best[i];
  out[id] = [+((Math.asin(y) * 180) / Math.PI).toFixed(1), +((Math.atan2(x, z) * 180) / Math.PI).toFixed(1)];
});
fs.writeFileSync(new URL("positions.json", dir), JSON.stringify(out, null, 2) + "\n");
const longest = Math.max(...L.map(([a, b]) => ang(best[a], best[b])));
const closest = Math.min(...best.flatMap((p, i) => best.slice(i + 1).map((q) => ang(p, q))));
console.log(`${FIELD}/positions.json: ${ids.length} schools, ${L.length} links, longest link ${longest.toFixed(1)}°, closest pair ${closest.toFixed(1)}°`);
