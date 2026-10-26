// Wont's offline shell (v1.1, feedback 44): pages and assets network-first, falling back to the
// last copy, so the board opens with no signal and taps still save to the device. /api is never
// cached. Network-first means a deploy shows up on the next online open.
const CACHE = "wont-shell-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/sync"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
        if (hit) return hit;
        // An uncached page offline (e.g. a habit's screen): the board instead.
        if (req.mode === "navigate") return (await caches.match("/")) ?? Response.error();
        return Response.error();
      }),
  );
});
