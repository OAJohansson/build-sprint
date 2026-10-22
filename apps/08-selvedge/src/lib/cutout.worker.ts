// Background removal, off the main thread so the editor never freezes (decision 0026). The model
// (ormbg, Apache-2.0, about 44 MB) downloads once, the browser keeps it, and it runs on the CPU
// (WASM), which every browser has. A photo comes in as a blob; the same photo goes back as a WebP
// with transparency, the same size, so a piece's crop box still fits it.

import { pipeline, RawImage, env } from "@huggingface/transformers";

env.allowLocalModels = false;

type Segmenter = (image: RawImage) => Promise<RawImage>;
let ready: Promise<Segmenter> | null = null;

function model() {
  ready ??= pipeline("background-removal", "onnx-community/ormbg-ONNX", {
    dtype: "uint8",
    device: "wasm",
    progress_callback: (p: { status: string; progress?: number }) => {
      if (p.status === "progress" && typeof p.progress === "number") postMessage({ type: "loading", progress: p.progress });
    },
  }) as unknown as Promise<Segmenter>;
  return ready;
}

// Soften the mask's edge: faint pixels go fully clear, nearly solid ones fully solid, a smooth
// step between (from the ormbg write-up), so cut-outs don't keep a haze of background.
function cleanAlpha(data: Uint8ClampedArray) {
  const lo = 0.06 * 255, hi = 0.8 * 255;
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a <= lo) data[i] = 0;
    else if (a >= hi) data[i] = 255;
    else { const t = (a - lo) / (hi - lo); data[i] = Math.round(255 * t * t * (3 - 2 * t)); }
  }
}

self.onmessage = async (e: MessageEvent<{ id: string; blob: Blob }>) => {
  const { id, blob } = e.data;
  try {
    const segment = await model();
    postMessage({ type: "working", id });
    const out = await segment(await RawImage.fromBlob(blob));
    const rgba = out.channels === 4 ? out : out.rgba();
    const pixels = new Uint8ClampedArray(rgba.data);
    cleanAlpha(pixels);
    const canvas = new OffscreenCanvas(rgba.width, rgba.height);
    canvas.getContext("2d")!.putImageData(new ImageData(pixels, rgba.width, rgba.height), 0, 0);
    const webp = await canvas.convertToBlob({ type: "image/webp", quality: 0.86 });
    postMessage({ type: "done", id, blob: webp });
  } catch (error) {
    postMessage({ type: "failed", id, reason: error instanceof Error ? error.message : String(error) });
  }
};
