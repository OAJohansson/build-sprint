// The checked-draw path (L126) on the bake-off's 5 prompts, once each: the route's own drawLoop
// (draw → trim/seam → tempo/key check → up to 3 draws) with Stable Audio 2.5, outside Next. Files
// and a manifest (every draw's seed, cost and measured values) go to --out, outside the repo.
// Doesn't grade: data-evals does. Never prints a key.
//
//   node --import ./scripts/ts-resolve.mjs scripts/loops-draws.mjs --out /path/outside/repo [--max-usd 1.5]
//
// Worst case 5 × 3 draws × $0.08 = $1.20; stops before any draw that would pass --max-usd.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bassLoopRequest, loopSeconds } from "../src/lib/ai-loops/prompt.ts";
import { drawLoop, MAX_DRAWS } from "../src/lib/server/ai-loops/draws.ts";
import { stabilityAdapter } from "../src/lib/server/ai-loops/stability.ts";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const envFile = here("../.env.local");
const fromFile = (name) => {
  if (!existsSync(envFile)) return "";
  const line = readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : "";
};
const key = process.env.STABILITY_API_KEY ?? fromFile("STABILITY_API_KEY");
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const out = arg("out");
if (!out || resolve(out).startsWith(resolve(here("../../..")))) {
  console.error("Pass --out <dir> outside the repo.");
  process.exit(1);
}
if (!key) {
  console.error("STABILITY_API_KEY is not set.");
  process.exit(1);
}
const MAX_USD = Number(arg("max-usd") ?? 1.5);
const PRICE = 0.08;

// The same 5 requests as the bake-off (fixed before any result, like L35). Seed 42 on draw 1.
const CASES = [
  { n: 1, bpm: 120, key: "A", scale: "minor", bars: 8, genres: [{ style: "Electronic---Deep House", p: 0.6 }] },
  { n: 2, bpm: 124, key: "F", scale: "minor", bars: 8, genres: [{ style: "Electronic---Tech House", p: 0.55 }] },
  { n: 3, bpm: 126, key: "C", scale: "major", bars: 4, genres: [{ style: "Electronic---Disco", p: 0.5 }, { style: "Electronic---House", p: 0.3 }] },
  { n: 4, bpm: 128, key: "D#", scale: "minor", bars: 8, genres: [{ style: "Electronic---Techno", p: 0.6 }] },
  { n: 5, bpm: 145, key: "G", scale: "minor", bars: 8, genres: [{ style: "Electronic---Trance", p: 0.5 }] },
];

const adapter = stabilityAdapter("stable-audio-2.5", 18_000); // the route's timeout
const balance = async () => {
  try {
    const r = await fetch("https://api.stability.ai/v1/user/balance", { headers: { authorization: `Bearer ${key}` } });
    return r.ok ? (await r.json()).credits ?? null : null;
  } catch {
    return null;
  }
};

mkdirSync(join(out, "stability"), { recursive: true });
const manifest = {
  ranAt: new Date().toISOString(),
  note: "scripts/loops-draws.mjs: the route's drawLoop (check: Ears tempo ±1 BPM, bass-range key same/relative), max draws " + MAX_DRAWS + ". Not graded.",
  stabilityCreditsBefore: await balance(),
  stabilityCreditsAfter: null,
  items: [],
  totals: {},
};
let spent = 0;
const canDraw = () => spent + PRICE <= MAX_USD + 1e-9;

for (const c of CASES) {
  if (!canDraw()) {
    console.log(`Stop: the next draw would pass $${MAX_USD} (spent $${spent.toFixed(2)}).`);
    break;
  }
  const req = bassLoopRequest(c, c.bars, 42);
  const name = String(c.n).padStart(2, "0");
  process.stdout.write(`#${c.n} ${req.bpm} BPM ${req.key} ${req.scale} ${req.bars} bars … `);
  try {
    const r = await drawLoop(
      req,
      async (rq) => {
        const res = await adapter.generate(rq, key);
        spent += res.costUsd;
        return res;
      },
      { canDraw },
    );
    const file = join("stability", `${name}.wav`);
    writeFileSync(join(out, file), r.audio);
    manifest.items.push({
      n: c.n, file, prompt: req.prompt, model: r.model,
      requested: { bpm: req.bpm, key: req.key, scale: req.scale, bars: req.bars, seconds: loopSeconds(req.bpm, req.bars) },
      draws: r.draws, checked: r.checked, seed: r.seed, measured: r.measured, costUsd: Math.round(r.totalCostUsd * 100) / 100,
      finish: r.finish, drawLog: r.log,
    });
    const m = r.measured;
    console.log(`${r.draws} draw(s), ${r.checked ? "passed" : "best of failed"}: ${m?.bpm} BPM ${m?.key} ${m?.scale}, $${r.totalCostUsd.toFixed(2)}`);
  } catch (e) {
    manifest.items.push({ n: c.n, error: e instanceof Error ? e.message : String(e) });
    console.log(`FAILED: ${e instanceof Error ? e.message : e}`);
  }
}

await new Promise((r) => setTimeout(r, 20_000)); // the balance lags the last charge
manifest.stabilityCreditsAfter = await balance();
const ok = manifest.items.filter((i) => !i.error);
manifest.totals = {
  loops: ok.length,
  checkedPass: ok.filter((i) => i.checked).length,
  draws: ok.reduce((s, i) => s + i.draws, 0),
  estimatedUsd: Math.round(spent * 100) / 100,
  stabilityCreditsUsed:
    manifest.stabilityCreditsBefore != null && manifest.stabilityCreditsAfter != null ? manifest.stabilityCreditsBefore - manifest.stabilityCreditsAfter : null,
};
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Spent ~$${spent.toFixed(2)}. Manifest: ${join(out, "manifest.json")}`);
