// Main-thread handle on the Lab separator worker (L143): one window of PCM in, four parts out.
// The window's buffers are transferred, so this side no longer holds them after a call.
import type { SepRequest, SepResponse } from "./separator.worker";

type Loaded = Extract<SepResponse, { type: "loaded" }>;
export type Parts = Extract<SepResponse, { type: "parts" }>;

export class Separator {
  private worker = new Worker(new URL("./separator.worker.ts", import.meta.url), { type: "module" });
  private waits = new Map<number, { resolve: (m: Parts) => void; reject: (e: Error) => void }>();
  private next = 1;
  readonly loaded: Promise<Loaded>;

  constructor(onProgress?: (loaded: number, total: number) => void) {
    let resolve!: (m: Loaded) => void;
    let reject!: (e: Error) => void;
    this.loaded = new Promise((res, rej) => { resolve = res; reject = rej; });
    this.worker.onmessage = (e: MessageEvent<SepResponse>) => {
      const m = e.data;
      if (m.type === "progress") onProgress?.(m.loaded, m.total);
      else if (m.type === "loaded") resolve(m);
      else if (m.type === "parts") { this.waits.get(m.id)?.resolve(m); this.waits.delete(m.id); }
      else if (m.type === "error") {
        if (m.id === undefined) reject(new Error(m.message));
        else { this.waits.get(m.id)?.reject(new Error(m.message)); this.waits.delete(m.id); }
      }
    };
    this.worker.postMessage({ type: "load" } satisfies SepRequest);
  }

  separate(left: Float32Array<ArrayBuffer>, right: Float32Array<ArrayBuffer>, from: number, length: number) {
    const id = this.next++;
    return new Promise<Parts>((resolve, reject) => {
      this.waits.set(id, { resolve, reject });
      this.worker.postMessage({ type: "separate", id, left, right, from, length } satisfies SepRequest, [left.buffer, right.buffer]);
    });
  }

  stop() {
    this.worker.terminate();
    this.waits.forEach((w) => w.reject(new Error("stopped")));
    this.waits.clear();
  }
}
