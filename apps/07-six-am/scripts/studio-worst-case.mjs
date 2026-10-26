// Worst-case Studio data (break-ui pass, 26 Oct): 60 untitled tracks, a full 64-bar track, a 512-bar
// template with 64 markers, an empty track and long / one-letter / emoji / non-Latin names.
// Sandbox only: node scripts/studio-worst-case.mjs http://localhost:<port> (ACCESS_CODE=test-code, in-memory store).
// Seeds worst-case tracks into the sandbox (in-memory) store through the app's own API.
const app = process.argv[2] ?? "http://localhost:3057";
const H = { "content-type": "application/json", "x-access-code": "test-code" };
const uuid = () => crypto.randomUUID();
const muted = [false, false, false, false];
const put = async (id, name, doc) => { const r = await fetch(`${app}/api/tracks?id=${id}`, { method: "PUT", headers: H, body: JSON.stringify({ name, doc }) }); if (!r.ok) console.log("FAIL", name, r.status, await r.text()); return id; };
let n = 0; const rid = () => `w${(n++).toString(36)}x${Math.random().toString(36).slice(2, 7)}`;
const fill = (track, loops, total) => { const out = []; let b = 1, i = 0; while (b <= total) { const [id, len] = loops[i++ % loops.length]; if (b + len - 1 > total) break; out.push({ id: rid(), loopId: id, track, start: b, length: len }); b += len; } return out; };
const ids = {};
// Many tracks first (oldest), then the worst cases on top.
for (let i = 1; i <= 60; i++) await put(uuid(), `Untitled track ${i}`, { regions: [], muted });
ids.full = await put(uuid(), "Full house (every lane, 64 bars)", { regions: [
  ...fill(0, [["four-to-the-floor", 4], ["rolling-hats", 2], ["clap-stack", 2], ["broken-beat", 4]], 64),
  ...fill(1, [["acid-line", 4], ["offbeat-pump", 2], ["deep-sub", 4], ["walking-funk", 4]], 64),
  ...fill(2, [["chicago-stab", 4], ["organ-hit", 2], ["warm-pad", 8], ["piano-bounce", 4]], 64),
  ...fill(3, [["shaker-loop", 2], ["vocal-chop", 4], ["noise-riser", 8], ["cowbell", 2]], 64),
], muted });
const labels = ["Intro", "Build", "Drop", "Breakdown", "Build", "Drop", "Breakdown", "Outro"];
const markers = Array.from({ length: 64 }, (_, i) => ({ bar: 1 + i * 8, label: i === 5 ? "Second breakdown (long)" : labels[i % labels.length] }));
ids.long512 = await put(uuid(), "512-bar template · 126.04 BPM", { regions: [
  ...fill(0, [["four-to-the-floor", 4]], 512).filter((_, i) => i % 3 !== 2),
  ...fill(1, [["deep-sub", 4], ["acid-line", 4]], 512).filter((_, i) => i % 4 !== 3),
], muted, bars: 512, bpm: 126.04, key: { key: "C#", scale: "minor" }, markers });
ids.empty = await put(uuid(), "Empty", { regions: [], muted });
ids.nonlatin = await put(uuid(), "夜明けのループ · Ночной цикл · حلقة الفجر", { regions: [{ id: rid(), loopId: "deep-sub", track: 1, start: 1, length: 4 }], muted });
ids.emoji = await put(uuid(), "🌅🔁 Sunrise édit 👩🏽‍🎤", { regions: [], muted });
ids.one = await put(uuid(), "X", { regions: [], muted });
ids.long = await put(uuid(), "Lost in The Loop (Cărbune Adrian's Late-Night Warehouse Rework) · template v2 final FINAL".slice(0, 80), { regions: [], muted });
console.log(JSON.stringify(ids));
