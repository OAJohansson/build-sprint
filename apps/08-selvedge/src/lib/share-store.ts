// The page's side of the share store the service worker writes (public/sw.js); keep the two in
// step. IndexedDB, not localStorage, because shares carry images.

export type SharedFile = { field: string; name: string; type: string; size: number; blob: Blob };
export type Share = { id: string; at: number; fields: Record<string, string>; files: SharedFile[] };

const DB = "selvedge";
const STORE = "shares";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function listShares(): Promise<Share[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as Share[]).sort((a, b) => b.at - a.at));
    req.onerror = () => reject(req.error);
  });
}

export async function clearShares(): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
