// Character spike (decision pending): can an image model draw a hand-drawn fashion figure wearing a
// board's style? Sends the same board and prompt to each model through OpenRouter and saves the
// drawings, so the owner can judge them side by side before we design around one.
//
// node --env-file=.env.local spike/character.mjs <board-folder> <out-folder>
// shortcut: a throwaway script, the real call moves into a server route on day 2.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

// MODELS=a,b to rerun some (e.g. after a rate limit).
const MODELS = process.env.MODELS?.split(",") ?? ["google/gemini-nano-banana-2.1", "openai/gpt-5.4-image-2"];

const STYLE = `A loose, hand-drawn fashion illustration of one fictional man, full figure, walking
towards the viewer, on warm off-white paper. Quick confident ink lines, loose marker and
watercolour washes that don't fill every shape, lots of empty paper around him. Like a
designer's sketchbook page, not a cartoon, not a photo.`;

const RULES = `Invent his face; don't copy any person in the photos. No text, no logos, no brand
marks, no background scene.`;

const PROMPTS = {
  // What the app can do with the board alone.
  board: `${STYLE}

He wears one outfit put together from this moodboard: pick the most characteristic pieces,
colours and fit from the images, so someone who made this board would say "that's my style".

${RULES}`,
  // What day 2 can do: the style read in words, plus the board.
  read: `${STYLE}

He wears one outfit in the style of this moodboard. The style, in words: relaxed and roomy
(boxy heavyweight tee or a short-sleeve camp-collar shirt in stripes or checks, wide jeans or
long denim shorts, workwear trousers); a muted earthy palette (chocolate brown, cream, olive,
slate, navy, black); Birkenstock Boston clogs or loafers with white socks; a cap, a tote or
crossbody bag, a thin chain, black sunglasses. Relaxed Copenhagen menswear, workwear meets skate,
90s revival.

${RULES}`,
};

const [boardDir, outDir] = process.argv.slice(2);
const key = process.env.OPENROUTER_API_KEY;
if (!boardDir || !outDir || !key) {
  console.error("Usage: node --env-file=.env.local spike/character.mjs <board> <out> (needs OPENROUTER_API_KEY)");
  process.exit(1);
}

const files = (await readdir(boardDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const images = await Promise.all(
  files.map(async (f) => ({
    type: "image_url",
    image_url: { url: `data:image/jpeg;base64,${(await readFile(join(boardDir, f))).toString("base64")}` },
  })),
);
await mkdir(outDir, { recursive: true });
console.log(`${files.length} board images`);

async function draw(model, name, prompt) {
  const started = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "2:3" },
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...images] }],
    }),
  });
  const body = await res.json();
  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  const url = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!res.ok || !url) {
    console.log(`${model} ${name}: failed (${res.status}) ${JSON.stringify(body.error ?? body).slice(0, 300)}`);
    return;
  }
  const file = `${model.split("/")[1]}--${name}.png`;
  await writeFile(join(outDir, file), Buffer.from(url.split(",")[1], "base64"));
  console.log(`${model} ${name}: ${file}, ${seconds}s, cost $${body.usage?.cost ?? "?"}`);
}

await Promise.all(MODELS.flatMap((m) => Object.entries(PROMPTS).map(([n, p]) => draw(m, n, p))));
