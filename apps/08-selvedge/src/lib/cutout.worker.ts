// Background removal, off the main thread so the editor never freezes (decision 0025). Two
// models, both downloaded once and kept by the browser, both on the CPU (WASM), which every
// browser has:
// - quick: ormbg (Apache-2.0, 44 MB), a few seconds a photo; the default.
// - careful: BEN2 (MIT, 219 MB), about half a minute a photo; for the hard ones. On the owner's
//   photos it fixed every miss the quick one made (a ghosted arm, a car, a clothes pile).
// A photo comes in as a blob; the same photo goes back as a WebP with transparency, the same
// size, so a piece's crop box still fits it.
// shortcut: careful runs on the CPU, try WebGPU for speed once it stops running out of memory.

import { pipeline, RawImage, env } from "@huggingface/transformers";

env.allowLocalModels = false;

export type Quality = "quick" | "careful";
type Segmenter = (image: RawImage) => Promise<RawImage>;
const MODELS: Record<Quality, { id: string; dtype: "uint8" | "fp16" }> = {
  quick: { id: "onnx-community/ormbg-ONNX", dtype: "uint8" },
  careful: { id: "onnx-community/BEN2-ONNX", dtype: "fp16" },
};
const ready: Partial<Record<Quality, Promise<Segmenter>>> = {};

function model(quality: Quality, id: string) {
  ready[quality] ??= pipeline("background-removal", MODELS[quality].id, {
    dtype: MODELS[quality].dtype,
    device: "wasm",
    progress_callback: (p: { status: string; progress?: number }) => {
      if (p.status === "progress" && typeof p.progress === "number") postMessage({ type: "loading", id, progress: p.progress });
    },
  }) as unknown as Promise<Segmenter>;
  return ready[quality]!;
}

/**
 * The clean-up after the model (tuned on the owner's photos, 23 Oct): "fairly sure" counts as
 * solid (a ghosted arm comes back), faint haze goes, stray islands away from the subject go (bits
 * of a car), and small holes inside the subject fill.
 */
function cleanUp(alpha: Uint8ClampedArray, w: number, h: number) {
  const lo = 0.12 * 255, hi = 0.5 * 255;
  for (let i = 0; i < alpha.length; i++) {
    const a = alpha[i];
    if (a <= lo) alpha[i] = 0;
    else if (a >= hi) alpha[i] = 255;
    else { const t = (a - lo) / (hi - lo); alpha[i] = Math.round(255 * t * t * (3 - 2 * t)); }
  }
  // Label connected solid and clear regions (4 neighbours).
  const label = new Int32Array(w * h).fill(-1);
  const size: number[] = [], solid: boolean[] = [], edge: boolean[] = [];
  const stack: number[] = [];
  let id = 0, isSolid = false;
  const visit = (q: number) => { if (label[q] === -1 && (alpha[q] > 127) === isSolid) { label[q] = id; stack.push(q); } };
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1) continue;
    id = size.length; isSolid = alpha[start] > 127;
    let n = 0, touches = false;
    label[start] = id; stack.push(start);
    while (stack.length) {
      const p = stack.pop()!, x = p % w, y = (p / w) | 0;
      n++;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touches = true;
      if (x > 0) visit(p - 1);
      if (x < w - 1) visit(p + 1);
      if (y > 0) visit(p - w);
      if (y < h - 1) visit(p + w);
    }
    size.push(n); solid.push(isSolid); edge.push(touches);
  }
  let largest = 0;
  for (let i = 0; i < size.length; i++) if (solid[i] && size[i] > largest) largest = size[i];
  const minIsland = Math.max(0.004 * w * h, 0.04 * largest), maxHole = 0.01 * w * h;
  for (let p = 0; p < w * h; p++) {
    const c = label[p];
    if (solid[c] && size[c] < minIsland) alpha[p] = 0;
    else if (!solid[c] && !edge[c] && size[c] < maxHole) alpha[p] = 255;
  }
}

self.onmessage = async (e: MessageEvent<{ id: string; blob: Blob; quality: Quality }>) => {
  const { id, blob, quality } = e.data;
  try {
    const segment = await model(quality, id);
    postMessage({ type: "working", id });
    const out = await segment(await RawImage.fromBlob(blob));
    const rgba = out.channels === 4 ? out : out.rgba();
    const { width: w, height: h } = rgba;
    const pixels = new Uint8ClampedArray(rgba.data);
    const alpha = new Uint8ClampedArray(w * h);
    for (let i = 0; i < w * h; i++) alpha[i] = pixels[i * 4 + 3];
    cleanUp(alpha, w, h);
    for (let i = 0; i < w * h; i++) pixels[i * 4 + 3] = alpha[i];
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext("2d")!.putImageData(new ImageData(pixels, w, h), 0, 0);
    const webp = await canvas.convertToBlob({ type: "image/webp", quality: 0.86 });
    postMessage({ type: "done", id, blob: webp });
  } catch (error) {
    postMessage({ type: "failed", id, reason: error instanceof Error ? error.message : String(error) });
  }
};
