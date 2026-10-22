// Remove a save's background in the browser and keep the cut-out beside the original
// (feedback 7, decision 0025). One worker for the whole page; the model loads on first use.
// shortcut: the cut-out is automatic only, add hand-traced scissors to fix misses (owner's
// "auto, then fix") once the automatic one has been tried on real saves.

import { cutoutUrl, imageUrl } from "@/lib/library";

export type CutoutProgress = { stage: "loading"; progress: number } | { stage: "working" };

let worker: Worker | null = null;
const waiting = new Map<string, { resolve: (b: Blob) => void; reject: (e: Error) => void; onProgress?: (p: CutoutProgress) => void }>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./cutout.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data as { type: string; id?: string; progress?: number; blob?: Blob; reason?: string };
    if (m.type === "loading") for (const w of waiting.values()) w.onProgress?.({ stage: "loading", progress: m.progress ?? 0 });
    const job = m.id ? waiting.get(m.id) : undefined;
    if (!job) return;
    if (m.type === "working") job.onProgress?.({ stage: "working" });
    if (m.type === "done" && m.blob) { waiting.delete(m.id!); job.resolve(m.blob); }
    if (m.type === "failed") { waiting.delete(m.id!); job.reject(new Error(m.reason)); }
  };
  return worker;
}

/** Cut a save out of its background and store it. Resolves with a cache-busting version. */
export async function cutOut(saveId: string, onProgress?: (p: CutoutProgress) => void): Promise<number> {
  const photo = await fetch(imageUrl(saveId));
  if (!photo.ok) throw new Error(`The photo didn't load (${photo.status})`);
  const blob = await photo.blob();
  const result = await new Promise<Blob>((resolve, reject) => {
    waiting.set(saveId, { resolve, reject, onProgress });
    getWorker().postMessage({ id: saveId, blob });
  });
  const put = await fetch(cutoutUrl(saveId), { method: "PUT", headers: { "Content-Type": "image/webp" }, body: result });
  if (!put.ok) throw new Error(`The cut-out didn't save (${put.status})`);
  return Date.now();
}
