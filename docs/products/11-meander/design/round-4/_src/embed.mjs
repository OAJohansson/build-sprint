// One-off tool: finds fixed positions for the schools on a unit sphere so that linked schools sit close together
// and all schools are spread evenly. Run `node embed.mjs`; paste the printed lat/long into data.mjs.
import fs from 'node:fs';
if (!fs.existsSync(new URL('./positions.mjs', import.meta.url))) fs.writeFileSync(new URL('./positions.mjs', import.meta.url), 'export const POS = {};\n');
const { schools, links } = await import('./data.mjs');
let seed = 11; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI;
const ids = schools.map(s => s.id), L = links.map(l => [ids.indexOf(l[0]), ids.indexOf(l[1])]);
const TARGET = 47, MINSEP = 38;
function energy(P) { let e = 0;
  for (const [a, b] of L) { const d = ang(P[a], P[b]); e += Math.max(0, d - TARGET) ** 2 * 2.5; }
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const d = ang(P[i], P[j]); if (d < MINSEP) e += (MINSEP - d) ** 2 * 30; e += 60000 / (d * d); }
  return e; }
let best = null, bestE = Infinity;
for (let run = 0; run < 70; run++) {
  let P = ids.map(() => norm([rnd() - .5, rnd() - .5, rnd() - .5])); let e = energy(P), T = 1;
  for (let it = 0; it < 70000; it++) { const i = Math.floor(rnd() * P.length), old = P[i], s = .35 * T + .01;
    P[i] = norm(old.map(x => x + (rnd() - .5) * s)); const e2 = energy(P);
    if (e2 < e || rnd() < Math.exp((e - e2) / (40 * T + .01))) e = e2; else P[i] = old; T *= .99991; }
  if (e < bestE) { bestE = e; best = P.map(p => p.slice()); }
}
const out = {}; ids.forEach((id, i) => { const [x, y, z] = best[i]; out[id] = [+(Math.asin(y) * 180 / Math.PI).toFixed(1), +(Math.atan2(x, z) * 180 / Math.PI).toFixed(1)]; });
fs.writeFileSync(new URL('./positions.mjs', import.meta.url), '// Written by embed.mjs. Fixed [latitude, longitude] for each school on the globe.\nexport const POS = ' + JSON.stringify(out) + ';\n');
console.log('energy', bestE.toFixed(1), 'longest link', Math.max(...L.map(([a, b]) => ang(best[a], best[b]))).toFixed(1), 'closest pair', Math.min(...best.flatMap((p, i) => best.slice(i + 1).map(q => ang(p, q)))).toFixed(1));
console.log(L.map(([a, b]) => ids[a] + '-' + ids[b] + ':' + ang(best[a], best[b]).toFixed(0)).join(' '));
