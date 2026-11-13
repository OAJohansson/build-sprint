// Finds a fixed place on a unit sphere for every school, so linked schools sit close together and all
// schools spread evenly (lifted from the design's _src/embed.mjs). Re-run after adding a school or a link:
//   pnpm -F 11-meander positions
// Reads src/content/schools.json and links.json, writes src/content/positions.json ([latitude, longitude]).
// Deterministic: the same schools and links in the same order always give the same positions.
import fs from "node:fs";

const dir = new URL("../src/content/", import.meta.url);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), "utf8"));
const schools = read("schools.json").schools;
const links = read("links.json").links;

let seed = 11;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const ang = (a, b) => (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180) / Math.PI;

const ids = schools.map((s) => s.id);
const L = links.map((l) => {
  const pair = [ids.indexOf(l.from), ids.indexOf(l.to)];
  if (pair.includes(-1)) throw new Error(`link ${l.from} → ${l.to} names a school that is not in schools.json`);
  return pair;
});
const TARGET = 47, MINSEP = 38;
function energy(P) {
  let e = 0;
  for (const [a, b] of L) { const d = ang(P[a], P[b]); e += Math.max(0, d - TARGET) ** 2 * 2.5; }
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const d = ang(P[i], P[j]); if (d < MINSEP) e += (MINSEP - d) ** 2 * 30; e += 60000 / (d * d);
  }
  return e;
}
let best = null, bestE = Infinity;
for (let run = 0; run < 70; run++) {
  const P = ids.map(() => norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]));
  let e = energy(P), T = 1;
  for (let it = 0; it < 70000; it++) {
    const i = Math.floor(rnd() * P.length), old = P[i], s = 0.35 * T + 0.01;
    P[i] = norm(old.map((x) => x + (rnd() - 0.5) * s));
    const e2 = energy(P);
    if (e2 < e || rnd() < Math.exp((e - e2) / (40 * T + 0.01))) e = e2; else P[i] = old;
    T *= 0.99991;
  }
  if (e < bestE) { bestE = e; best = P.map((p) => p.slice()); }
}
const out = {};
ids.forEach((id, i) => {
  const [x, y, z] = best[i];
  out[id] = [+((Math.asin(y) * 180) / Math.PI).toFixed(1), +((Math.atan2(x, z) * 180) / Math.PI).toFixed(1)];
});
fs.writeFileSync(new URL("positions.json", dir), JSON.stringify(out, null, 2) + "\n");
const longest = Math.max(...L.map(([a, b]) => ang(best[a], best[b])));
const closest = Math.min(...best.flatMap((p, i) => best.slice(i + 1).map((q) => ang(p, q))));
console.log(`positions.json: ${ids.length} schools, ${L.length} links, longest link ${longest.toFixed(1)}°, closest pair ${closest.toFixed(1)}°`);
