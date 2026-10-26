// Magpie service worker: the share path (R5). A photo shared from the camera roll or Instagram
// on Android (manifest.ts) arrives here as a POST to /share-target. The photo is kept in
// IndexedDB and the share sheet closes onto /new?shared=1, where capture picks it up and opens
// the details with it. Keep the store layout in step with src/lib/photo.ts.
// shortcut: one shared photo at a time (the newest wins); a share of several photos keeps the
// first. Upgrade if sharing whole albums turns out to be a thing.

const DB = "magpie", STORE = "shared";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") event.respondWith(receive(event.request));
});

async function receive(request) {
  try {
    const form = await request.formData();
    const file = form.getAll("files").find((f) => f instanceof File && f.size > 0);
    if (!file) return Response.redirect("/new?missed=1", 303);
    await put(file);
    return Response.redirect("/new?shared=1", 303);
  } catch {
    return Response.redirect("/new?missed=1", 303);
  }
}

function put(file) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => { if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE); };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const t = open.result.transaction(STORE, "readwrite");
      t.objectStore(STORE).put(file, "latest");
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    };
  });
}
