// Selvedge service worker. Catches shares from Android's share sheet (see manifest.ts), keeps
// each one in IndexedDB and opens the probe page. Keep the store layout in step with
// src/lib/share-store.ts.
// shortcut: shares stay on this phone only, upgrade to uploading them (decision 0021) after the probe.

const DB = "selvedge";
const STORE = "shares";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(receive(event.request));
  }
});

async function receive(request) {
  const form = await request.formData();
  const fields = {};
  const files = [];
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") fields[key] = value;
    else files.push({ field: key, name: value.name, type: value.type, size: value.size, blob: value });
  }
  await save({ id: crypto.randomUUID(), at: Date.now(), fields, files });
  return Response.redirect("/probe", 303);
}

function save(record) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: "id" });
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}
