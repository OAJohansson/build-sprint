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
  `${shape === "round" ? "The sticker is round: a soft pastel disc behind the item" : "The sticker is a rounded square with generous round corners: a soft pastel rounded square behind the item"}, in a light colour that suits it; a narrow white border around it; and around the white border a bold dark-brown outline, as thick as the outlines on the item. Outside the sticker the background is plain pure white.

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
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: STICKER_MODEL, modalities: ["image", "text"], image_config: { aspect_ratio: "1:1" }, messages: [{ role: "user", content }] }),
    signal: AbortSignal.timeout(50_000),
  });
  const body = await res.json().catch(() => ({}));
  const url: string | undefined = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!res.ok || !url) throw new Error(`Sticker model failed (${res.status}): ${JSON.stringify(body.error ?? body).slice(0, 300)}`);
  return Buffer.from(url.split(",")[1], "base64");
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
  return sharp(trimmed).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 86, alphaQuality: 90 }).toBuffer();
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
