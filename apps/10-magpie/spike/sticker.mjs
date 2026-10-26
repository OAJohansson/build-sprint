// Sticker spike (slice 1, the riskiest feasibility question): can a cheap image model turn a phone
// photo of food or drink into a flat, thick-outlined die-cut sticker in the design's style, fast
// and cheap enough for capture? Sends each photo to each model through OpenRouter (as Selvedge's
// character spike did, decision 0022), cuts the white outside the sticker away (sharp, flood fill
// from the edges) and writes a contact sheet with time and cost per sticker.
//
// node --env-file=.env.local spike/sticker.mjs <photos-folder> <out-folder>
// MODELS=a,b and ONLY=01,02 narrow a run. shortcut: a throwaway script; the real call lives in
// src/lib/server/sticker.ts once a model is picked.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { promptFor, cutOut } from "./sticker-shared.mjs";

const MODELS = process.env.MODELS?.split(",") ?? [
  "google/gemini-3.1-flash-lite-image",
  "google/gemini-2.5-flash-image",
  "google/gemini-nano-banana-2.1",
  "openai/gpt-5-image-mini",
];
const ONLY = process.env.ONLY?.split(",");

const [photoDir, outDir] = process.argv.slice(2);
const key = process.env.OPENROUTER_API_KEY;
if (!photoDir || !outDir || !key) {
  console.error("Usage: node --env-file=.env.local spike/sticker.mjs <photos> <out> (needs OPENROUTER_API_KEY)");
  process.exit(1);
}

const files = (await readdir(photoDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).filter((f) => !ONLY || ONLY.some((o) => f.startsWith(o))).sort();
await mkdir(outDir, { recursive: true });

async function draw(model, file) {
  // The app shrinks photos to a long side of 1024 px before upload; do the same here.
  const photo = await sharp(await readFile(join(photoDir, file))).rotate().resize(1024, 1024, { fit: "inside" }).jpeg({ quality: 82 }).toBuffer();
  const started = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "1:1" },
      messages: [{ role: "user", content: [{ type: "text", text: promptFor(process.env.SHAPE) }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${photo.toString("base64")}` } }] }],
    }),
  });
  const body = await res.json().catch(() => ({}));
  const seconds = (Date.now() - started) / 1000;
  const url = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const name = `${model.split("/")[1]}--${file.replace(/\.\w+$/, "")}`;
  if (!res.ok || !url) {
    console.log(`${name}: failed (${res.status}) ${JSON.stringify(body.error ?? body).slice(0, 200)}`);
    return { model, file, ok: false, seconds };
  }
  const raw = Buffer.from(url.split(",")[1], "base64");
  await writeFile(join(outDir, `${name}--raw.png`), raw);
  const sticker = await cutOut(raw);
  await writeFile(join(outDir, `${name}.png`), sticker);
  const cost = body.usage?.cost;
  console.log(`${name}: ${seconds.toFixed(1)}s, $${cost ?? "?"}`);
  return { model, file, ok: true, seconds, cost, name };
}

// Two at a time per model, so a rate limit doesn't wipe a run.
const results = [];
for (const model of MODELS) {
  for (let i = 0; i < files.length; i += 3) {
    results.push(...(await Promise.all(files.slice(i, i + 3).map((f) => draw(model, f)))));
  }
}
await writeFile(join(outDir, "results.json"), JSON.stringify(results, null, 2));

// Contact sheet: one row per model, stickers on the app's cream paper.
const CELL = 220;
for (const model of MODELS) {
  const rows = results.filter((r) => r.model === model && r.ok);
  if (!rows.length) continue;
  const tiles = await Promise.all(rows.map(async (r) => ({ input: await sharp(join(outDir, `${r.name}.png`)).resize(CELL - 20, CELL - 20, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: 0, top: 10 })));
  const width = CELL * tiles.length;
  const sheet = sharp({ create: { width, height: CELL, channels: 4, background: "#FFF4E0" } }).composite(tiles.map((t, i) => ({ ...t, left: i * CELL + 10 })));
  await sheet.png().toFile(join(outDir, `sheet--${model.split("/")[1]}.png`));
  const secs = rows.map((r) => r.seconds).sort((a, b) => a - b);
  const costs = rows.map((r) => r.cost).filter((c) => typeof c === "number");
  console.log(`${model}: ${rows.length}/${results.filter((r) => r.model === model).length} ok, median ${secs[Math.floor(secs.length / 2)].toFixed(1)}s, mean $${(costs.reduce((a, b) => a + b, 0) / (costs.length || 1)).toFixed(4)}`);
}
