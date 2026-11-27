// Node only (tests and evals): Basic Pitch's model loaded from the package on disk, from memory, since
// TensorFlow.js in Node (without tfjs-node) can't read file:// URLs. The browser fetches BP_MODEL_URL.
import fs from "node:fs";
import path from "node:path";
import * as tf from "@tensorflow/tfjs";

let cached: Promise<tf.GraphModel> | null = null;
export function loadBpModelFromDisk(): Promise<tf.GraphModel> {
  if (cached) return cached;
  const dir = path.join(process.cwd(), "public/models/basic-pitch");
  const json = JSON.parse(fs.readFileSync(path.join(dir, "model.json"), "utf8"));
  const w = fs.readFileSync(path.join(dir, json.weightsManifest[0].paths[0]));
  cached = tf.loadGraphModel(tf.io.fromMemory({
    modelTopology: json.modelTopology, weightSpecs: json.weightsManifest[0].weights,
    weightData: w.buffer.slice(w.byteOffset, w.byteOffset + w.byteLength) as ArrayBuffer,
    format: json.format, generatedBy: json.generatedBy, convertedBy: json.convertedBy, signature: json.signature, userDefinedMetadata: json.userDefinedMetadata,
  }));
  return cached;
}
