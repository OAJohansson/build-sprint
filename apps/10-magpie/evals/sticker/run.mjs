// Sticker eval runner (data-evals). Saves each case through the real API into the SANDBOX
// library only, polls every 1 s until the sticker is ready or failed, downloads sticker + photo,
// and reads OpenRouter credits before and after for cost.
//
//   node --env-file=.env.local evals/sticker/run.mjs [--base http://localhost:3110]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3110";
const code = process.env.SANDBOX_ACCESS_CODE;
const orKey = process.env.OPENROUTER_API_KEY;
if (!code || !orKey) throw new Error("SANDBOX_ACCESS_CODE and OPENROUTER_API_KEY must be set.");
const headers = { "x-access-code": code };
const here = new URL("./", import.meta.url);
const out = new URL("./out/", here);
await mkdir(out, { recursive: true });
const { cases } = JSON.parse(await readFile(new URL("dataset.json", here), "utf8"));

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for a manual cost reading
const credits = async () => {
  const j = await (await fetch("https://openrouter.ai/api/v1/credits", { headers: { Authorization: `Bearer ${orKey}` } })).json();
  return j.data.total_credits - j.data.total_usage; // remaining; usage is what we diff
};
const usage = async () => (await (await fetch("https://openrouter.ai/api/v1/credits", { headers: { Authorization: `Bearer ${orKey}` } })).json()).data.total_usage;

const usageBefore = await usage();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCase(c) {
  const id = randomUUID();
  const body = new FormData();
  body.set("id", id);
  for (const k of ["name", "kind", "subKind", "hearts"]) if (c[k] != null) body.set(k, String(c[k]));
  body.set("note", `sticker-eval ${c.key}`);
  let photoBytes = null;
  if (c.photo) {
    photoBytes = await readFile(new URL(c.photo, here));
    body.set("photo", new Blob([photoBytes], { type: "image/jpeg" }), c.photo.split("/").pop());
  }
  const t0 = Date.now();
  const r = await fetch(`${base}/api/yums`, { method: "POST", headers, body });
  const tSaved = (Date.now() - t0) / 1000;
  const posted = await r.json().catch(() => ({}));
  const res = { key: c.key, id, status: r.status, number: posted.yum?.number, initialSticker: posted.yum?.sticker, savedS: tSaved };
  if (r.status !== 201) return { ...res, error: JSON.stringify(posted).slice(0, 200) };
  let state = "drawing";
  while (state === "drawing" && Date.now() - t0 < 180_000) {
    await sleep(1000);
    const g = await (await fetch(`${base}/api/yums/${id}`, { headers })).json().catch(() => ({}));
    state = g.yum?.sticker ?? state;
  }
  res.final = state;
  res.seconds = +((Date.now() - t0) / 1000).toFixed(1);
  if (state === "ready") {
    const s = await fetch(`${base}/api/yums/${id}/sticker`, { headers });
    res.stickerType = s.headers.get("content-type");
    await writeFile(new URL(`${c.key}-sticker.webp`, out), Buffer.from(await s.arrayBuffer()));
  }
  const p = await fetch(`${base}/api/yums/${id}/photo`, { headers });
  res.photoStatus = p.status;
  res.photoType = p.headers.get("content-type");
  if (p.ok) {
    const buf = Buffer.from(await p.arrayBuffer());
    res.photoBytes = buf.length;
    await writeFile(new URL(`${c.key}-photo.webp`, out), buf);
  }
  console.log(JSON.stringify(res));
  return res;
}

const results = [];
const queue = [...cases];
await Promise.all([0, 1, 2].map(async () => { while (queue.length) results.push(await runCase(queue.shift())); }));

await sleep(20_000); // let OpenRouter's usage counter settle
const usageAfter = await usage();
const ready = results.filter((r) => r.final === "ready").length;
const summary = { usageBefore, usageAfter, delta: +(usageAfter - usageBefore).toFixed(5), stickers: ready, perSticker: +((usageAfter - usageBefore) / Math.max(1, ready)).toFixed(5) };
console.log(JSON.stringify(summary));
await writeFile(new URL("results.json", here), JSON.stringify({ ranAt: new Date().toISOString(), summary, results: results.sort((a, b) => a.key.localeCompare(b.key)) }, null, 2));
