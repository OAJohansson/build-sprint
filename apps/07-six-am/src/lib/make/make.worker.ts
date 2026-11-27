/// <reference lib="webworker" />
// Make's worker (S3): reading the looped part, rendering "Mine" and "Suggest settings" run here so
// the page never stalls (the shortcut in match.ts). A mailbox for jobs.ts; nothing is kept between
// messages, nothing is stored or sent anywhere (L143, L161).
// Phase 6 spike: a Basic Pitch read (chords reader B, or Melody when MELODY_READER says so) loads the
// model (and TensorFlow.js) here, once, on the first such read, from the app's own public folder; never
// at app start. The model is loaded BEFORE a read opens its tfjs scope (BP-1), and Basic Pitch reads run
// one at a time (a tfjs scope is one global stack; two reads in flight would dispose each other's tensors).
import type { GraphModel } from "@tensorflow/tfjs";
import { runMakeJobAsync, type MakeRequest, type MakeResponse } from "./jobs";
import { BP_MODEL_URL } from "./notes-bp";

// TensorFlow.js 3.21's browser platform tests `!window` (not `typeof window`) when it polls the WebGL
// backend, which throws in a worker. A declared-but-undefined `window` makes it use plain setTimeout,
// and every `typeof window` check elsewhere still sees a worker, not a page.
// shortcut: a global for one library's bug; drop it when tfjs is upgraded past the fix (tfjs 4 checks typeof).
(globalThis as { window?: unknown }).window = undefined;

let model: Promise<GraphModel> | null = null;
const loadModel = () => (model ??= import("@tensorflow/tfjs").then((tf) => tf.loadGraphModel(BP_MODEL_URL)).catch((e) => { model = null; throw e; }));

let bpQueue: Promise<unknown> = Promise.resolve();
const usesBP = (m: MakeRequest) => (m.type === "chords-read" && m.reader === "basic-pitch") || m.type === "melody-read" || m.type === "lead-read";

const reply = ({ res, transfer }: { res: MakeResponse; transfer: ArrayBuffer[] }) => {
  // Which reader ran, so a grader can see every read used the model (BP-1). Numbers only.
  if (res.type === "chords-read" || res.type === "melody-read" || res.type === "lead-read") console.info(`[make] ${res.type.replace("-read", "")} read (${res.reader}) in ${res.ms} ms`);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(res, transfer);
};

self.onmessage = (e: MessageEvent<MakeRequest>) => {
  const m = e.data;
  if (!usesBP(m)) { runMakeJobAsync(m, loadModel).then(reply); return; }
  const run = bpQueue.then(() => runMakeJobAsync(m, loadModel)).then(reply);
  bpQueue = run.catch(() => {});
};
