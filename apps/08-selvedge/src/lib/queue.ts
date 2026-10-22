// The page's side of the share queue the service worker keeps (public/sw.js; keep the two in
// step). Shares wait here until they're uploaded; the inbox shows what's still waiting and why.

export type QueueState = "queued" | "offline" | "locked" | "failed" | "unreadable";
export type QueueItem = { id: string; at: number; file: Blob | null; text: string; url: string; title: string; state: QueueState };

const DB = "selvedge";
const VERSION = 2;
const QUEUE = "queue";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (d.objectStoreNames.contains("shares")) d.deleteObjectStore("shares");
      if (!d.objectStoreNames.contains(QUEUE)) d.createObjectStore(QUEUE, { keyPath: "id" });
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function listQueue(): Promise<QueueItem[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(QUEUE).objectStore(QUEUE).getAll();
    req.onsuccess = () => resolve((req.result as QueueItem[]).sort((a, b) => b.at - a.at));
    req.onerror = () => reject(req.error);
  });
}

export async function dropFromQueue(id: string): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(QUEUE, "readwrite");
    t.objectStore(QUEUE).delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

/** Ask the service worker to try the uploads again. */
export function retryUploads() {
  navigator.serviceWorker?.controller?.postMessage("flush");
}

/** Call `fn` whenever the service worker says the queue changed. Returns an unsubscribe. */
export function onQueueChange(fn: () => void): () => void {
  const listener = (e: MessageEvent) => { if (e.data === "queue-changed") fn(); };
  navigator.serviceWorker?.addEventListener("message", listener);
  return () => navigator.serviceWorker?.removeEventListener("message", listener);
}
