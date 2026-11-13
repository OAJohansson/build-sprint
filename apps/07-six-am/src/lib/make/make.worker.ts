/// <reference lib="webworker" />
// Make's worker (S3): reading the looped part, rendering "Mine" and "Suggest settings" run here so
// the page never stalls (the shortcut in match.ts). A mailbox for jobs.ts; nothing is kept between
// messages, nothing is stored or sent anywhere (L143, L161).
// L245: a melody read may use Basic Pitch; its model (and TensorFlow.js) load here, once, on the first
// melody read, from the app's own public folder; never at app start.
import type { GraphModel } from "@tensorflow/tfjs";
import { runMakeJobAsync, type MakeRequest } from "./jobs";
import { BP_MODEL_URL } from "./notes-bp";

// TensorFlow.js 3.21's browser platform tests `!window` (not `typeof window`) when it polls the WebGL
// backend, which throws in a worker. A declared-but-undefined `window` makes it use plain setTimeout,
// and every `typeof window` check elsewhere still sees a worker, not a page.
// shortcut: a global for one library's bug; drop it when tfjs is upgraded past the fix (tfjs 4 checks typeof).
(globalThis as { window?: unknown }).window = undefined;

let model: Promise<GraphModel> | null = null;
const loadModel = () => (model ??= import("@tensorflow/tfjs").then((tf) => tf.loadGraphModel(BP_MODEL_URL)).catch((e) => { model = null; throw e; }));

self.onmessage = async (e: MessageEvent<MakeRequest>) => {
  const { res, transfer } = await runMakeJobAsync(e.data, loadModel);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(res, transfer);
};
