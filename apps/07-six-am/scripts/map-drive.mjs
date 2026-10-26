// Spike driver: CDP over Node's built-in WebSocket. Opens /map?url=…&auto=1 in a launched Chrome,
// sets the sandbox access code, polls window.__sixamMap until done or error. No npm deps.
const [, , port = "9437", app = "http://localhost:3037", track = "https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix", code = "test-code", maxMin = "12"] = process.argv;
const targets = await (await fetch(`http://localhost:${port}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") console.log("[console.error]", m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300)); else if (m.method === "Runtime.exceptionThrown") console.log("[exception]", m.params.exceptionDetails.exception?.description?.slice(0, 300)); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send("Runtime.enable"); await send("Page.enable");
await send("Page.navigate", { url: `${app}/map` }); await sleep(3000);
await evalJs(`localStorage.setItem("07-six-am:code", JSON.stringify(${JSON.stringify(code)}))`);
const t0 = Date.now();
await send("Page.navigate", { url: `${app}/map?url=${encodeURIComponent(track)}&auto=1` });
console.log("navigated", new Date().toISOString());
let last = "";
while (Date.now() - t0 < Number(maxMin) * 60000) {
  await sleep(5000);
  const st = await evalJs(`JSON.stringify({ s: window.__sixamMap?.status, e: window.__sixamMap?.error, text: document.querySelector('#map-status')?.textContent, title: document.title, audible: !!document.querySelector('iframe') })`);
  if (st !== last) { console.log(Math.round((Date.now() - t0) / 1000) + "s", st); last = st; }
  const s = st && JSON.parse(st);
  if (s?.s === "done" || s?.s === "error") break;
}
const out = await evalJs(`JSON.stringify({ timings: window.__sixamMap?.timings, saved: window.__sixamMap?.saved, startedAt: window.__sixamMap?.startedAt, endedAt: window.__sixamMap?.endedAt, map: window.__sixamMap?.map })`);
console.log("RESULT", out);
const pre = await evalJs(`[...document.querySelectorAll('pre')].map(p => p.textContent).join('\\n---\\n').slice(0, 20000)`);
console.log(pre);
const frames = await evalJs(`JSON.stringify(window.__sixamFrames ?? null)`);
if (frames && frames !== "null") { const fs = await import("node:fs"); const f = process.env.FRAMES_OUT ?? "frames.json"; fs.writeFileSync(f, frames); console.log("frames saved", f, frames.length); }
ws.close();
