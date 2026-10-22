// Selvedge service worker: the capture path. A share from Android's share sheet (manifest.ts)
// is caught here, put in a queue on the phone straight away (so nothing is lost, even offline),
// and the share sheet closes onto the inbox. Then the queue uploads: pictures shrunk to a long
// side of 1600 px as WebP first, links sent as they are (the server fetches their picture).
// A failed upload stays queued and is retried on the next share, when the inbox opens, or when
// the phone is back online (Background Sync). Keep the store layout in step with src/lib/queue.ts.
// shortcut: offline, the share is kept but the inbox page can't load (no cached page), upgrade
// to caching the inbox shell if sharing offline turns out to be common.

const DB = "selvedge";
const VERSION = 2;
const QUEUE = "queue";
const LONG_SIDE = 1600;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") event.respondWith(receive(event.request));
});

self.addEventListener("sync", (event) => { if (event.tag === "upload") event.waitUntil(flush()); });
self.addEventListener("message", (event) => { if (event.data === "flush") event.waitUntil(flush()); });

async function receive(request) {
  const form = await request.formData();
  const text = String(form.get("text") || ""), url = String(form.get("url") || ""), title = String(form.get("title") || "");
  const files = form.getAll("files").filter((f) => f instanceof File && f.size > 0);
  const at = Date.now();
  // Every picture is its own save; a share with only a link (Instagram, Pinterest) is one save.
  const items = files.length
    ? files.map((file, i) => ({ id: crypto.randomUUID(), at: at + i, file, text: "", url: "", title: "", state: "queued" }))
    : [{ id: crypto.randomUUID(), at, file: null, text, url, title, state: "queued" }];
  for (const item of items) await put(item);
  try { await self.registration.sync?.register("upload"); } catch {}
  flush(); // not awaited: the share sheet shouldn't wait for the upload
  return Response.redirect("/inbox?shared=" + items.length, 303);
}

// One upload pass at a time; a share that arrives mid-pass asks for another pass.
let flushing = null, again = false;
function flush() {
  if (flushing) { again = true; return flushing; }
  flushing = (async () => {
    try {
      do {
        again = false;
        for (const item of (await all()).sort((a, b) => a.at - b.at)) await upload(item);
        notify();
      } while (again);
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

async function upload(item) {
  const body = new FormData();
  body.set("id", item.id);
  if (item.text) body.set("text", item.text);
  if (item.url) body.set("url", item.url);
  if (item.title) body.set("title", item.title);
  if (item.file) {
    try {
      const { blob, aspect } = await shrink(item.file);
      body.set("image", blob, "save.webp");
      body.set("aspect", String(aspect));
    } catch {
      return save({ ...item, state: "unreadable" }); // a picture type the phone can't open
    }
  }
  let res;
  try {
    res = await fetch("/api/saves", { method: "POST", body, credentials: "same-origin" });
  } catch {
    return save({ ...item, state: "offline" });
  }
  if (res.ok) return remove(item.id);
  // 401: this phone hasn't been given the access code yet; the inbox asks for it.
  return save({ ...item, state: res.status === 401 ? "locked" : "failed" });
}

async function shrink(file) {
  const bitmap = await createImageBitmap(file); // follows the photo's rotation (EXIF)
  const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return { blob: await canvas.convertToBlob({ type: "image/webp", quality: 0.82 }), aspect: w / h };
}

async function notify() {
  for (const client of await self.clients.matchAll()) client.postMessage("queue-changed");
}

// The queue, in IndexedDB (localStorage can't hold pictures, and a worker can't reach it).
function db() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, VERSION);
    open.onupgradeneeded = () => {
      const d = open.result;
      if (d.objectStoreNames.contains("shares")) d.deleteObjectStore("shares"); // the probe's store
      if (!d.objectStoreNames.contains(QUEUE)) d.createObjectStore(QUEUE, { keyPath: "id" });
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => resolve(open.result);
  });
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(QUEUE, mode);
    const req = fn(t.objectStore(QUEUE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}
const put = (item) => tx("readwrite", (s) => s.put(item));
const save = put;
const remove = (id) => tx("readwrite", (s) => s.delete(id));
const all = () => tx("readonly", (s) => s.getAll());
