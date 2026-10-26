import "server-only";
import sharp from "sharp";
import type { Image, Library, Store } from "@/lib/server/store";
import { kindLabel, stickerShape, subKindInfo, type Yum } from "@/lib/yum";

// The sticker: an image model draws the yum as a flat, thick-outlined die-cut sticker, then the
// white outside the sticker's outline is cut away (decision 0029). The prompt is the one the
// spike and the eval used (spike/sticker-shared.mjs); keep them in step.

export const STICKER_MODEL = "google/gemini-2.5-flash-image";

const STYLE = `Style: a flat cartoon illustration with bold, thick, even dark-brown outlines (#3B1F1A) around every shape. Flat colour fills only: no gradients, no shading, no shine or glossy highlights, no drop shadow, no texture, no photo detail. Plain surfaces: leave out patterns, prints and writing on bowls, plates, cups and cloths. Simple, chunky, friendly shapes with few details, like a cute vinyl sticker.`;

const frame = (shape: "round" | "square") =>
  `${shape === "round" ? "Behind the item, a round disc" : "Behind the item, a rounded square with generous round corners"} in a clear pastel colour that suits it (not white, not cream), filling most of the picture. No border and no outline around that shape: it sits straight on the background. Outside the sticker the background is plain pure white.

No text, no letters, no logos, no labels, no hands, no table, no background scene.`;

export function stickerPrompt(yum: Pick<Yum, "name" | "kind" | "subKind" | "number">, fromPhoto: boolean): string {
  const shape = stickerShape(yum.number);
  const what = subKindInfo(yum.kind, yum.subKind)?.label ?? kindLabel(yum.kind);
  const name = yum.name.replace(/"/g, "'");
  if (fromPhoto) {
    return `Turn the ${what.toLowerCase()} in this photo, "${name}", into one die-cut sticker for a cheerful sticker book. If the photo shows several things, draw only that one.

${STYLE}

Draw only the main dish or drink with its glass, cup, plate or bowl, centred and filling most of the sticker. Keep what makes it recognisable: its colours, its garnish, the shape of its glass or dish.

${frame(shape)}`;
  }
  return `Draw one die-cut sticker for a cheerful sticker book of "${name}" (${what.toLowerCase()}).

${STYLE}

Draw only that dish or drink as it is usually served, with its glass, cup, plate or bowl, centred and filling most of the sticker.

${frame(shape)}`;
}

/** Asks the model for the sticker. Throws with a plain reason on failure. */
async function draw(prompt: string, photo: Image | null): Promise<Buffer> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set.");
  const content: object[] = [{ type: "text", text: prompt }];
  if (photo) {
    const small = await sharp(photo.bytes).rotate().resize(1024, 1024, { fit: "inside" }).jpeg({ quality: 82 }).toBuffer();
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${small.toString("base64")}` } });
  }
  const request = JSON.stringify({ model: STICKER_MODEL, modalities: ["image", "text"], image_config: { aspect_ratio: "1:1" }, messages: [{ role: "user", content }] });
  // One retry after a short wait when OpenRouter is busy (429) or hiccups (5xx), within the
  // route's 60 s: two tries of up to 25 s each (decision 0022 planned for rate limits).
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: request,
      signal: AbortSignal.timeout(25_000),
    }).catch((e: unknown) => ({ ok: false, status: 0, json: async () => ({ error: String(e) }) }) as const);
    const body = await res.json().catch(() => ({}));
    const url: string | undefined = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (res.ok && url) return Buffer.from(url.split(",")[1], "base64");
    const retry = attempt === 1 && (res.status === 429 || res.status === 0 || res.status >= 500);
    if (!retry) throw new Error(`Sticker model failed (${res.status}): ${JSON.stringify(body.error ?? body).slice(0, 300)}`);
    console.warn(`[magpie] sticker model ${res.status}, retrying once`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

/**
 * Makes the white outside the sticker transparent: a flood fill from the image's edges through
 * near-white pixels, so the white border inside the sticker's outline stays. Then trims and
 * shrinks to a 512 px WebP.
 */
export async function cutOut(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const light = (i: number) => data[i] > 225 && data[i + 1] > 225 && data[i + 2] > 225;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    seen[p] = 1;
    if (!light(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % w, y = (p - x) / w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  // Soften the cut edge by one pixel.
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] === 0 || !light(p * 4)) continue;
    const x = p % w;
    if ((x > 0 && data[(p - 1) * 4 + 3] === 0) || (x < w - 1 && data[(p + 1) * 4 + 3] === 0) || (p >= w && data[(p - w) * 4 + 3] === 0) || (p < w * (h - 1) && data[(p + w) * 4 + 3] === 0)) data[p * 4 + 3] = 128;
  }
  const trimmed = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
  return dieCut(trimmed);
}

/**
 * The die-cut edge, drawn the same on every sticker: a white ring and a cocoa outline around the
 * pastel shape the model draws (prompt v3). Asking the model for them didn't hold (sticker eval
 * v2: 5 of 15 ended in white), so the code draws them, as in the design's stickers. Grows the shape's mask with a blur and a
 * threshold, then layers cocoa, white and the sticker. Returns a 512 px WebP.
 */
const SIZE = 512, PAD = 38, RIM = 9, LINE = 6;
async function dieCut(png: Buffer): Promise<Buffer> {
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  const inner = SIZE - PAD * 2;
  const { data } = await sharp(png).resize(inner, inner, { fit: "contain", background: clear }).extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: clear }).raw().toBuffer({ resolveWithObject: true });
  const alpha = Buffer.alloc(SIZE * SIZE);
  for (let p = 0; p < SIZE * SIZE; p++) alpha[p] = data[p * 4 + 3];
  // Grow the shape: blur its mask, then keep everything the blur reached (a short ramp, so the
  // edge is smooth). Sharp runs threshold before blur whatever the order, so this step is JS.
  const grow = async (sigma: number) => {
    const blurred = await sharp(alpha, { raw: { width: SIZE, height: SIZE, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
    for (let p = 0; p < blurred.length; p++) blurred[p] = Math.max(0, Math.min(255, (blurred[p] - 6) * 32));
    return blurred;
  };
  const rim = await grow(RIM), line = await grow(RIM + LINE);
  const out = Buffer.alloc(SIZE * SIZE * 4);
  const layers: [number, number, number, Buffer, number][] = [[0x3b, 0x1f, 0x1a, line, 1], [255, 255, 255, rim, 1], [0, 0, 0, data, 4]];
  for (let p = 0; p < SIZE * SIZE; p++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (const [lr, lg, lb, mask, stride] of layers) {
      const la = mask[stride === 4 ? p * 4 + 3 : p] / 255;
      if (!la) continue;
      const [cr, cg, cb] = stride === 4 ? [data[p * 4], data[p * 4 + 1], data[p * 4 + 2]] : [lr, lg, lb];
      const na = la + a * (1 - la);
      r = (cr * la + r * a * (1 - la)) / na; g = (cg * la + g * a * (1 - la)) / na; b = (cb * la + b * a * (1 - la)) / na;
      a = na;
    }
    out[p * 4] = r; out[p * 4 + 1] = g; out[p * 4 + 2] = b; out[p * 4 + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: { width: SIZE, height: SIZE, channels: 4 } }).webp({ quality: 86, alphaQuality: 90 }).toBuffer();
}

/** Draws a yum's sticker and stores it; on failure the yum keeps its photo and shows "failed". */
export async function makeSticker(store: Store, lib: Library, yum: Yum): Promise<void> {
  const started = Date.now();
  try {
    const photo = yum.hasPhoto ? await store.readPhoto(lib, yum.id) : null;
    const raw = await draw(stickerPrompt(yum, !!photo), photo);
    const sticker = await cutOut(raw);
    await store.setSticker(lib, yum.id, "ready", { bytes: new Uint8Array(sticker), type: "image/webp" });
    console.log(`[magpie] sticker ${yum.id} ready in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  } catch (error) {
    console.error(`[magpie] sticker ${yum.id} failed: ${error instanceof Error ? error.message : String(error)}`);
    await store.setSticker(lib, yum.id, "failed").catch(() => {});
  }
}
