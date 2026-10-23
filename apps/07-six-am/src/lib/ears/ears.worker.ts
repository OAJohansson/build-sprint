/// <reference lib="webworker" />
// Ears worker: 16 kHz mono PCM in, numbers out. The PCM is only held for the length of one
// analysis and dropped afterwards; nothing here stores, uploads or records audio.
import * as ort from "onnxruntime-web/wasm";
import { combineSnippets } from "./combine";
import { chromaProfile, keyFromChroma, meanActivations, melFrames, median, onsetAcf, patches, rmsDb, tempoFromAcf, topFromMean, SAMPLE_RATE } from "./features";
import type { EarsCombined, EarsModelInfo, EarsRequest, EarsResponse, EarsResult, EarsSnippetStats } from "./types";

export const MODEL_URL = "/models/feature-extractors/discogs-effnet/discogs-effnet-bsdynamic-1.onnx";
export const META_URL = "/models/feature-extractors/discogs-effnet/discogs-effnet-bsdynamic-1.json";

const post = (m: EarsResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);

// No wasmPaths: Turbopack emits ORT's .wasm as a same-origin static asset (/_next/static/media/).
// Threads need cross-origin isolation (COOP/COEP), which would break the SoundCloud iframe.
ort.env.wasm.numThreads = 1;

let session: ort.InferenceSession | null = null;
let classes: string[] = [];
let info: EarsModelInfo | null = null;
let loading: Promise<void> | null = null;

// The model (not audio) is kept in the Cache API: the proxy sends no Cache-Control, so the browser
// would otherwise download 18 MB on every visit.
const MODEL_CACHE = "ears-models-v1";

async function fetchWithProgress(url: string): Promise<Uint8Array> {
  const cache = "caches" in self ? await caches.open(MODEL_CACHE).catch(() => null) : null;
  const hit = await cache?.match(url);
  if (hit) return new Uint8Array(await hit.arrayBuffer());
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0, lastPost = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (loaded - lastPost > 512 * 1024) { post({ type: "progress", loaded, total }); lastPost = loaded; }
  }
  const out = new Uint8Array(loaded);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  await cache?.put(url, new Response(out, { headers: { "content-type": "application/octet-stream" } })).catch(() => {});
  return out;
}

async function load() {
  const t0 = performance.now();
  const [meta, bytes] = await Promise.all([fetch(META_URL).then((r) => r.json()), fetchWithProgress(MODEL_URL)]);
  classes = meta.classes;
  session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
  info = {
    loadMs: Math.round(performance.now() - t0),
    bytes: bytes.length,
    inputName: session.inputNames[0],
    outputNames: [...session.outputNames],
    classes: classes.length,
  };
}

async function analyse(pcm: Float32Array, sampleRate: number): Promise<EarsResult> {
  if (sampleRate !== SAMPLE_RATE) throw new Error(`expected ${SAMPLE_RATE} Hz, got ${sampleRate}`);
  if (!session) throw new Error("model not loaded");
  const t0 = performance.now();
  const frames = melFrames(pcm);
  const p = patches(frames);
  if (!p.n) throw new Error("need at least ~2.1 s of audio (128 frames)");
  const acf = onsetAcf(frames);
  const bpm = tempoFromAcf(acf);
  const chroma = chromaProfile(pcm);
  const key = keyFromChroma(chroma);
  const energy = rmsDb(pcm);
  let sumSquares = 0;
  for (let i = 0; i < pcm.length; i++) sumSquares += pcm[i] * pcm[i];
  const centroidHz = median(frames.centroid);
  const t1 = performance.now();

  const input = new ort.Tensor("float32", p.data, [p.n, 128, 96]);
  const out = await session.run({ [session.inputNames[0]]: input });
  const t2 = performance.now();
  // Output 0 is the 400 sigmoid style activations, output 1 the 1280-d embeddings (model JSON).
  const actsName = session.outputNames.find((n) => out[n].dims[1] === classes.length) ?? session.outputNames[0];
  const acts = out[actsName].data as Float32Array;
  const mean = meanActivations(acts, p.n, classes.length);
  const styles = topFromMean(mean, classes, 5);
  input.dispose();
  for (const n of session.outputNames) out[n].dispose();

  const stats: EarsSnippetStats = {
    seconds: pcm.length / SAMPLE_RATE,
    frames: frames.frames,
    patches: p.n,
    acf: acf ? Array.from(acf) : null,
    chroma,
    sumSquares,
    samples: pcm.length,
    centroidHz,
    meanActivations: Array.from(mean),
  };
  return {
    seconds: Math.round((pcm.length / SAMPLE_RATE) * 10) / 10,
    patches: p.n,
    timings: { featuresMs: Math.round(t1 - t0), inferenceMs: Math.round(t2 - t1) },
    styles: styles.top,
    activations: { count: acts.length / p.n, finite: styles.finite },
    bpm: bpm.bpm,
    bpmConfidence: bpm.confidence,
    bpmAlternative: bpm.alternative,
    bpmAmbiguous: bpm.ambiguous,
    key: key.key,
    scale: key.scale,
    keyStrength: key.strength,
    energy: { rms: Math.round(energy.rms * 10000) / 10000, dbfs: Math.round(energy.dbfs * 10) / 10 },
    brightness: { centroidHz: Math.round(centroidHz) },
    stats,
  };
}

async function combine(snippets: EarsSnippetStats[]): Promise<EarsCombined> {
  if (!snippets.length) throw new Error("no snippets to combine");
  return combineSnippets(snippets, classes);
}

self.onmessage = async (e: MessageEvent<EarsRequest>) => {
  const m = e.data;
  const id = m.type === "load" ? undefined : m.id;
  try {
    loading ??= load();
    await loading;
    if (m.type === "load") post({ type: "loaded", info: info! });
    else if (m.type === "analyse") post({ type: "result", id: m.id, result: await analyse(m.pcm, m.sampleRate) });
    else if (m.type === "combine") post({ type: "combined", id: m.id, result: await combine(m.snippets) });
  } catch (err) {
    if (!session) loading = null;
    post({ type: "error", id, message: err instanceof Error ? err.message : String(err) });
  }
  // The PCM goes out of scope here; nothing keeps a reference to it.
};
