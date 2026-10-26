/// <reference lib="webworker" />
// Lab separator (L143, L144 spike): one 7.8 s stereo window of PCM in, four parts of one region of
// it out. The PCM lives only for one call and is dropped; nothing is stored, recorded or uploaded.
// The only network use is the model download (cached in Cache Storage: model weights, never audio).
import * as ort from "onnxruntime-web/webgpu";
import { CONSTANTS, prepareModelInput, standaloneIspec, standaloneMask } from "demucs-web";

export const MODEL_URL = CONSTANTS.DEFAULT_MODEL_URL; // timcsy/demucs-web-onnx htdemucs_embedded.onnx (MIT)
export const WINDOW = CONSTANTS.TRAINING_SAMPLES; // 343980 samples = 7.8 s at 44.1 kHz
const PARTS = ["drums", "bass", "other", "vocals"] as const;

export type SepRequest =
  | { type: "load" }
  | { type: "separate"; id: number; left: Float32Array; right: Float32Array; from: number; length: number };
export type SepResponse =
  | { type: "progress"; loaded: number; total: number }
  | { type: "loaded"; backend: string; loadMs: number; bytes: number; cached: boolean }
  | { type: "error"; id?: number; message: string }
  | { type: "parts"; id: number; parts: Float32Array<ArrayBuffer>[]; ms: { prep: number; run: number; post: number } };

const post = (m: SepResponse, transfer: Transferable[] = []) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m, transfer);
ort.env.wasm.numThreads = 1; // threads need COOP/COEP, which would break the SoundCloud iframe
let session: ort.InferenceSession | null = null;

async function modelBytes(): Promise<{ bytes: Uint8Array; cached: boolean }> {
  const cache = await caches.open("sixam-models").catch(() => null);
  const hit = await cache?.match(MODEL_URL);
  if (hit) return { bytes: new Uint8Array(await hit.arrayBuffer()), cached: true };
  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) throw new Error(`Model download failed (${res.status})`);
  const total = Number(res.headers.get("content-length") ?? 0);
  post({ type: "progress", loaded: 0, total }); // a download (not the cache): "first time only"
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  let lastPost = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (loaded - lastPost > 2_000_000) { post({ type: "progress", loaded, total }); lastPost = loaded; }
  }
  const bytes = new Uint8Array(loaded);
  let o = 0;
  for (const c of chunks) { bytes.set(c, o); o += c.length; }
  await cache?.put(MODEL_URL, new Response(bytes.slice(), { headers: { "content-type": "application/octet-stream" } })).catch(() => {});
  return { bytes, cached: false };
}

async function load() {
  const t0 = performance.now();
  const { bytes, cached } = await modelBytes();
  let backend = "webgpu";
  try {
    session = await ort.InferenceSession.create(bytes, { executionProviders: ["webgpu"], graphOptimizationLevel: "basic" });
  } catch {
    backend = "wasm";
    session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"], graphOptimizationLevel: "basic" });
  }
  post({ type: "loaded", backend, loadMs: Math.round(performance.now() - t0), bytes: bytes.length, cached });
}

async function separate(id: number, left: Float32Array, right: Float32Array, from: number, length: number) {
  if (!session) throw new Error("Model not loaded");
  const t0 = performance.now();
  const input = prepareModelInput(left, right);
  const feeds: Record<string, ort.Tensor> = {
    [session.inputNames[0]]: new ort.Tensor("float32", input.waveform, [1, 2, WINDOW]),
  };
  if (session.inputNames.length > 1) feeds[session.inputNames[1]] = new ort.Tensor("float32", input.magSpec, [1, 4, 2048, 336]);
  const t1 = performance.now();
  const out = await session.run(feeds);
  const t2 = performance.now();
  let time: Float32Array | null = null;
  let freq: Float32Array | null = null;
  for (const name of session.outputNames) {
    const t = out[name];
    if (t.dims.length === 4 && t.dims[2] === 2) time = t.data as Float32Array;
    else if (t.dims.length === 5) freq = t.data as Float32Array;
  }
  if (!time || !freq) throw new Error("Unexpected model outputs");
  const specs = standaloneMask(freq);
  // parts[p*2 + ch]: only the requested region, time branch + frequency branch.
  const parts: Float32Array<ArrayBuffer>[] = [];
  for (let p = 0; p < PARTS.length; p++) {
    const f = standaloneIspec(specs[p], WINDOW);
    for (let ch = 0; ch < 2; ch++) {
      const fch = ch === 0 ? f.left : f.right;
      const base = p * 2 * WINDOW + ch * WINDOW;
      const r = new Float32Array(length);
      for (let i = 0; i < length; i++) r[i] = time[base + from + i] + fch[from + i];
      parts.push(r);
    }
  }
  for (const name of session.outputNames) out[name].dispose?.();
  const t3 = performance.now();
  post({ type: "parts", id, parts, ms: { prep: t1 - t0, run: t2 - t1, post: t3 - t2 } }, parts.map((p) => p.buffer));
}

self.onmessage = (e: MessageEvent<SepRequest>) => {
  const m = e.data;
  if (m.type === "load") load().catch((err) => post({ type: "error", message: String(err?.message ?? err) }));
  else if (m.type === "separate")
    separate(m.id, m.left, m.right, m.from, m.length).catch((err) => post({ type: "error", id: m.id, message: String(err?.message ?? err) }));
};
