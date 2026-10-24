// Main-thread client for the Ears worker: request ids, promises, model progress.
import type { EarsCombined, EarsModelInfo, EarsRequest, EarsResponse, EarsResult, EarsSnippetStats } from "./types";

export const TARGET_RATE = 16000;

type Pending = { resolve: (v: never) => void; reject: (e: Error) => void };

export class EarsClient {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private loaded: Promise<EarsModelInfo>;
  info: EarsModelInfo | null = null;
  onProgress: ((fraction: number | null) => void) | null = null;
  onError: ((message: string) => void) | null = null;

  constructor() {
    this.worker = new Worker(new URL("./ears.worker.ts", import.meta.url), { type: "module" });
    let resolveLoaded!: (i: EarsModelInfo) => void;
    this.loaded = new Promise((r) => (resolveLoaded = r));
    this.worker.onmessage = (e: MessageEvent<EarsResponse>) => {
      const m = e.data;
      if (m.type === "progress") this.onProgress?.(m.total ? m.loaded / m.total : null);
      else if (m.type === "loaded") { this.info = m.info; this.onProgress?.(null); resolveLoaded(m.info); }
      else if (m.type === "result" || m.type === "combined") this.settle(m.id, (p) => p.resolve(m.result as never));
      else if (m.type === "error") {
        if (m.id !== undefined) this.settle(m.id, (p) => p.reject(new Error(m.message)));
        else this.onError?.(m.message);
      }
    };
    this.worker.postMessage({ type: "load" } satisfies EarsRequest);
  }

  private settle(id: number, fn: (p: Pending) => void) {
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    fn(p);
  }

  private request<T>(build: (id: number) => EarsRequest, transfer: Transferable[] = []): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: never) => void, reject });
      this.worker.postMessage(build(id), transfer);
    });
  }

  ready() {
    return this.loaded;
  }

  /** 16 kHz mono PCM → numbers. The buffer is transferred: the caller no longer holds the samples. */
  analyse(pcm16: Float32Array<ArrayBuffer>): Promise<EarsResult> {
    return this.request<EarsResult>((id) => ({ type: "analyse", id, pcm: pcm16, sampleRate: TARGET_RATE }), [pcm16.buffer]);
  }

  combine(snippets: EarsSnippetStats[]): Promise<EarsCombined> {
    return this.request<EarsCombined>((id) => ({ type: "combine", id, snippets }));
  }

  terminate() {
    this.worker.terminate();
    for (const p of this.pending.values()) p.reject(new Error("worker stopped"));
    this.pending.clear();
  }
}
