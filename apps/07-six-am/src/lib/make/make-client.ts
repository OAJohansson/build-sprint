// Main-thread handle on Make's workers (S3). Two workers, so a "Suggest settings" search (~0.5 s)
// never holds up the re-render after a knob turn. Each call returns a promise; a newer render makes
// an older one's result stale (the caller checks `latest`).
import type { MakeRequest, MakeResponse } from "./jobs";

type Req = MakeRequest extends infer R ? (R extends MakeRequest ? Omit<R, "id"> : never) : never;
type Res<T extends MakeRequest["type"]> = Extract<MakeResponse, { type: T }>;

class Mailbox {
  private worker = new Worker(new URL("./make.worker.ts", import.meta.url), { type: "module" });
  private waits = new Map<number, { resolve: (m: MakeResponse) => void; reject: (e: Error) => void }>();
  private next = 1;
  constructor() {
    this.worker.onmessage = (e: MessageEvent<MakeResponse>) => {
      const m = e.data, w = this.waits.get(m.id);
      if (!w) return;
      this.waits.delete(m.id);
      if (m.type === "error") w.reject(new Error(m.message));
      else w.resolve(m);
    };
    this.worker.onerror = (e) => { for (const w of this.waits.values()) w.reject(new Error(e.message || "Make worker failed")); this.waits.clear(); };
  }
  send(r: Req, transfer: Transferable[] = []): Promise<MakeResponse> {
    const id = this.next++;
    return new Promise((resolve, reject) => {
      this.waits.set(id, { resolve, reject });
      this.worker.postMessage({ ...r, id }, transfer);
    });
  }
  stop() { this.worker.terminate(); this.waits.clear(); }
}

export class MakeClient {
  private main = new Mailbox();
  private search = new Mailbox();
  private renders = 0;

  /** Reads a copy of the part (the copy is transferred, then zeroed in the worker). */
  read(r: Omit<Extract<MakeRequest, { type: "read" }>, "id" | "type">) {
    return this.main.send({ type: "read", ...r }, [r.left.buffer, r.right.buffer]) as Promise<Res<"read">>;
  }
  /** Renders Mine; `stale()` is true once a newer render was asked for. */
  render(r: Omit<Extract<MakeRequest, { type: "render" }>, "id" | "type">) {
    const n = ++this.renders;
    return (this.main.send({ type: "render", ...r }) as Promise<Res<"render">>).then((res) => ({ res, stale: n !== this.renders }));
  }
  suggest(r: Omit<Extract<MakeRequest, { type: "suggest" }>, "id" | "type">) {
    return this.search.send({ type: "suggest", ...r }) as Promise<Res<"suggest">>;
  }
  stop() { this.main.stop(); this.search.stop(); }
}
