"use client";

// Lab spike (L144). Live: captures the Deck tab with local playback suppressed, separates rolling
// 7.8 s windows in a worker, plays each part's new region a fixed delay later, solo/mute per part.
// Every window and region lives in memory for one step and is dropped (L143): no MediaRecorder,
// no storage, no upload. Bench: the same loop on Six AM's own synthetic mix, as fast as it goes.
// Results on window.__labSpike for a grader.
import { useEffect, useRef, useState } from "react";
import { BENCH_RATE, benchMix, sdr } from "@/lib/lab/bench-mix";
import type { SepRequest, SepResponse } from "@/lib/lab/separator.worker";
import { makePlan, playDelay, step, type StreamPlan } from "@/lib/lab/stream";
import type { DeckMsg } from "./deck/deck";

const PARTS = ["Drums", "Bass", "Other", "Vocals"] as const;
const RATE = 44100;

type Stat = { k: number; computeMs: number; prep: number; run: number; post: number; lateMs: number };
type Api = {
  model?: { backend: string; loadMs: number; bytes: number; cached: boolean };
  bench?: Record<string, number | string>;
  live?: { inDb: number; partsDb: number[]; suppressLocalAudioPlayback: unknown; label: string; delayS: number; steps: number; late: number; meanComputeMs: number; ratio: number; heardS: number };
  error?: string;
  log: string[];
};
declare global { interface Window { __labSpike?: Api } }

class Separator {
  private worker = new Worker(new URL("../../../lib/lab/separator.worker.ts", import.meta.url), { type: "module" });
  private waits = new Map<number, (m: Extract<SepResponse, { type: "parts" }>) => void>();
  private next = 1;
  loaded: Promise<Extract<SepResponse, { type: "loaded" }>>;
  constructor(onProgress: (loaded: number, total: number) => void, onError: (msg: string) => void) {
    let resolve!: (m: Extract<SepResponse, { type: "loaded" }>) => void;
    this.loaded = new Promise((r) => (resolve = r));
    this.worker.onmessage = (e: MessageEvent<SepResponse>) => {
      const m = e.data;
      if (m.type === "progress") onProgress(m.loaded, m.total);
      else if (m.type === "loaded") resolve(m);
      else if (m.type === "parts") { this.waits.get(m.id)?.(m); this.waits.delete(m.id); }
      else if (m.type === "error") onError(m.message);
    };
    this.worker.postMessage({ type: "load" } satisfies SepRequest);
  }
  separate(left: Float32Array, right: Float32Array, from: number, length: number) {
    const id = this.next++;
    return new Promise<Extract<SepResponse, { type: "parts" }>>((resolve) => {
      this.waits.set(id, resolve);
      this.worker.postMessage({ type: "separate", id, left, right, from, length } satisfies SepRequest, [left.buffer, right.buffer]);
    });
  }
  stop() { this.worker.terminate(); }
}

/** The window [start, start+len) from a source, zero where it is before 0. A fresh copy. */
function cut(read: (i: number) => number, start: number, len: number) {
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) { const j = start + i; if (j >= 0) out[i] = read(j); }
  return out;
}

const db = (a: Float32Array) => { let e = 0; for (let i = 0; i < a.length; i++) e += a[i] * a[i]; return +(10 * Math.log10(e / Math.max(1, a.length) + 1e-12)).toFixed(1); };

function fadeInOut(a: Float32Array, fade: number) {
  for (let i = 0; i < fade && i < a.length; i++) { const g = i / fade; a[i] *= g; a[a.length - 1 - i] *= g; }
}

export function LabSpike({ url, hop, guard, auto }: { url: string; hop: number; guard: number; auto: string }) {
  const [log, setLog] = useState<string[]>([]);
  const [modelState, setModelState] = useState("not loaded");
  const [on, setOn] = useState([true, true, true, true]);
  const [deck, setDeck] = useState<{ pos: number; playing: boolean; title: string } | null>(null);
  const [live, setLive] = useState<Api["live"] | null>(null);
  const [trackUrl, setTrackUrl] = useState(url);
  const sep = useRef<Separator | null>(null);
  const gains = useRef<GainNode[]>([]);
  const stopLive = useRef<(() => void) | null>(null);
  const api = useRef<Api>({ log: [] });
  const benchOut = useRef<{ parts: Float32Array<ArrayBuffer>[][]; mix: Float32Array<ArrayBuffer> } | null>(null);
  const delayRef = useRef(0);

  const say = (s: string) => {
    api.current.log.push(s);
    setLog((l) => [...l.slice(-30), s]);
  };

  useEffect(() => {
    window.__labSpike = api.current;
    const ch = new BroadcastChannel("sixam-deck");
    ch.onmessage = (e: MessageEvent<DeckMsg>) => { if (e.data.kind === "state") setDeck(e.data); };
    return () => { ch.close(); stopLive.current?.(); sep.current?.stop(); };
  }, []);

  useEffect(() => {
    if (auto.includes("bench")) runBench().catch((e) => { api.current.error = String(e); say("error: " + String(e)); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { gains.current.forEach((g, i) => g.gain.setTargetAtTime(on[i] ? 1 : 0, g.context.currentTime, 0.01)); }, [on]);

  async function loadModel() {
    if (sep.current) return sep.current.loaded;
    setModelState("downloading…");
    sep.current = new Separator(
      (l, t) => setModelState(`downloading ${Math.round(l / 1e6)} / ${Math.round(t / 1e6)} MB`),
      (msg) => { api.current.error = msg; say("error: " + msg); },
    );
    const m = await sep.current.loaded;
    api.current.model = { backend: m.backend, loadMs: m.loadMs, bytes: m.bytes, cached: m.cached };
    setModelState(`${m.backend} · ${Math.round(m.bytes / 1e6)} MB · ${m.cached ? "from cache" : "downloaded"} · ready in ${(m.loadMs / 1000).toFixed(1)} s`);
    say(`model ready: ${m.backend}, ${(m.loadMs / 1000).toFixed(1)} s`);
    return m;
  }

  async function runBench() {
    await loadModel();
    say("bench: rendering Six AM's own 40 s loop…");
    const b = await benchMix(40);
    const plan = makePlan(BENCH_RATE, hop, guard);
    const total = b.mix[0].length;
    const out = [0, 1, 2, 3].map(() => [new Float32Array(total), new Float32Array(total)]);
    const stats: Stat[] = [];
    const t0 = performance.now();
    for (let k = 0; ; k++) {
      const s = step(plan, k);
      if (s.end > total) break;
      const L = cut((i) => b.mix[0][i], s.windowStart, plan.window);
      const R = cut((i) => b.mix[1][i], s.windowStart, plan.window);
      const w0 = performance.now();
      const r = await sep.current!.separate(L, R, s.from, s.length);
      stats.push({ k, computeMs: performance.now() - w0, ...r.ms, lateMs: 0 });
      for (let p = 0; p < 4; p++) for (let ch = 0; ch < 2; ch++) {
        const a = r.parts[p * 2 + ch];
        fadeInOut(a, plan.fade);
        for (let i = 0; i < a.length; i++) { const j = s.regionStart + i; if (j >= 0 && j < total) out[p][ch][j] += a[i]; }
      }
    }
    const wall = performance.now() - t0;
    const steady = stats.slice(1); // the first run includes WebGPU warm-up
    const mean = steady.reduce((a, s) => a + s.computeMs, 0) / Math.max(1, steady.length);
    const max = Math.max(...steady.map((s) => s.computeMs));
    const heard = (stats.length * plan.hop) / BENCH_RATE;
    const mono = (p: number) => { const m = new Float32Array(total); for (let i = 0; i < total; i++) m[i] = (out[p][0][i] + out[p][1][i]) / 2; return m; };
    const from = plan.window; // skip the zero-padded start
    const to = stats.length * plan.hop;
    const res = {
      backend: api.current.model!.backend,
      windows: stats.length,
      hopS: hop,
      guardS: guard,
      firstMs: Math.round(stats[0].computeMs),
      meanMs: Math.round(mean),
      maxMs: Math.round(max),
      meanRunMs: Math.round(steady.reduce((a, s) => a + s.run, 0) / Math.max(1, steady.length)),
      meanPrepMs: Math.round(steady.reduce((a, s) => a + s.prep, 0) / Math.max(1, steady.length)),
      meanPostMs: Math.round(steady.reduce((a, s) => a + s.post, 0) / Math.max(1, steady.length)),
      ratio: +(hop * 1000 / mean).toFixed(2),
      wallRatio: +((heard * 1000) / wall).toFixed(2),
      delayS: +playDelay(plan, BENCH_RATE, max / 1000).toFixed(2),
      sdrDrums: +sdr(b.parts[0], mono(0), from, to).toFixed(1),
      sdrBass: +sdr(b.parts[1], mono(1), from, to).toFixed(1),
      sdrOther: +sdr(b.parts[2], mono(2), from, to).toFixed(1),
      mixAsBassSdr: +sdr(b.parts[1], b.mix[0], from, to).toFixed(1),
      mixAsDrumsSdr: +sdr(b.parts[0], b.mix[0], from, to).toFixed(1),
    };
    api.current.bench = res;
    benchOut.current = { parts: out, mix: b.mix[0] };
    say("bench: " + JSON.stringify(res));
  }

  async function playBench(p: number) {
    const o = benchOut.current;
    if (!o) return;
    const ctx = new AudioContext({ sampleRate: BENCH_RATE });
    const buf = ctx.createBuffer(2, o.mix.length, BENCH_RATE);
    if (p < 0) { buf.copyToChannel(o.mix, 0); buf.copyToChannel(o.mix, 1); } else { buf.copyToChannel(o.parts[p][0], 0); buf.copyToChannel(o.parts[p][1], 1); }
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.connect(ctx.destination);
    s.start();
    s.onended = () => ctx.close();
  }

  function openDeck() {
    if (!trackUrl) return;
    window.open(`/dev/lab-spike/deck?url=${encodeURIComponent(trackUrl)}${auto.includes("deck") ? "&auto=1" : ""}`, "sixam-deck", "width=520,height=220");
  }

  const cmd = (c: "play" | "pause") => { const ch = new BroadcastChannel("sixam-deck"); ch.postMessage({ kind: "cmd", cmd: c } satisfies DeckMsg); ch.close(); };

  async function startLive() {
    const model = loadModel(); // getDisplayMedia first: it needs the click's user activation
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, suppressLocalAudioPlayback: true } as MediaTrackConstraints,
        // Chrome hints: offer tabs, not this one (its own output must stay audible).
        ...({ preferCurrentTab: false, selfBrowserSurface: "exclude", surfaceSwitching: "exclude", systemAudio: "exclude", monitorTypeSurfaces: "exclude" } as object),
      });
    } catch (e) {
      say("share cancelled: " + String(e));
      return;
    }
    const vt = stream.getVideoTracks()[0];
    const label = vt?.label ?? "";
    stream.getVideoTracks().forEach((t) => t.stop());
    const at = stream.getAudioTracks()[0];
    if (!at) { say("no audio shared: tick 'Also share tab audio'"); return; }
    const settings = at.getSettings() as MediaTrackSettings & { suppressLocalAudioPlayback?: boolean };
    await model;
    say(`capturing "${label}", suppressLocalAudioPlayback = ${String(settings.suppressLocalAudioPlayback)}`);

    const ctx = new AudioContext({ sampleRate: RATE, latencyHint: "playback" });
    await ctx.audioWorklet.addModule("/lab/stereo-tap.js");
    const src = ctx.createMediaStreamSource(new MediaStream([at]));
    const tap = new AudioWorkletNode(ctx, "stereo-tap");
    src.connect(tap); // never to the speakers: only separated parts play
    const master = ctx.createGain();
    master.gain.value = auto.includes("mute") ? 0 : 1; // grader runs stay quiet
    master.connect(ctx.destination);
    gains.current = PARTS.map((_, i) => { const g = ctx.createGain(); g.gain.value = on[i] ? 1 : 0; g.connect(master); return g; });

    const plan: StreamPlan = makePlan(RATE, hop, guard);
    const delayS = playDelay(plan, RATE, 1.5);
    delayRef.current = delayS;
    // Ring of the last 12 s; sample n of the capture sits at ring[n % size].
    const size = RATE * 12;
    const ringL = new Float32Array(size);
    const ringR = new Float32Array(size);
    let written = 0;
    let frame0 = -1;
    let k = 0;
    let busy = false;
    let late = 0;
    const stats: Stat[] = [];
    const tick = async () => {
      if (busy) return;
      const s = step(plan, k);
      if (written < s.end) return;
      if (written - s.end > size - plan.window) { k = Math.floor((written - plan.hop - plan.guard) / plan.hop); say("fell behind: skipped ahead"); return; }
      busy = true;
      const L = cut((i) => ringL[i % size], s.windowStart, plan.window);
      const R = cut((i) => ringR[i % size], s.windowStart, plan.window);
      const inDb = db(L.subarray(s.from, s.from + s.length)); // level only: proves the capture isn't silent
      const w0 = performance.now();
      const r = await sep.current!.separate(L, R, s.from, s.length);
      const computeMs = performance.now() - w0;
      const partsDb = [0, 1, 2, 3].map((p) => db(r.parts[p * 2]));
      const at = (frame0 + s.regionStart) / RATE + delayS;
      const lateMs = Math.max(0, (ctx.currentTime - at) * 1000);
      if (lateMs > 0) late++;
      else {
        for (let p = 0; p < 4; p++) {
          const buf = ctx.createBuffer(2, s.length, RATE);
          for (let ch = 0; ch < 2; ch++) { const a = r.parts[p * 2 + ch]; fadeInOut(a, plan.fade); buf.copyToChannel(a, ch); }
          const node = ctx.createBufferSource();
          node.buffer = buf; // played once, then garbage: never kept
          node.connect(gains.current[p]);
          node.start(at);
        }
      }
      stats.push({ k, computeMs, ...r.ms, lateMs });
      const steady = stats.slice(1);
      const mean = steady.length ? steady.reduce((a, x) => a + x.computeMs, 0) / steady.length : computeMs;
      const state = { inDb, partsDb, suppressLocalAudioPlayback: settings.suppressLocalAudioPlayback, label, delayS: +delayS.toFixed(2), steps: stats.length, late, meanComputeMs: Math.round(mean), ratio: +((hop * 1000) / mean).toFixed(2), heardS: Math.round((stats.length * plan.hop) / RATE) };
      api.current.live = state;
      setLive(state);
      k++;
      busy = false;
      tick();
    };
    tap.port.onmessage = (e: MessageEvent<{ frame: number; l: Float32Array; r: Float32Array }>) => {
      const { frame, l, r } = e.data;
      if (frame0 < 0) frame0 = frame;
      for (let i = 0; i < l.length; i++) { const j = (written + i) % size; ringL[j] = l[i]; ringR[j] = r[i]; }
      written += l.length;
      tick();
    };
    tap.port.postMessage({ on: true });
    const stop = () => { tap.port.postMessage({ on: false }); stream.getTracks().forEach((t) => t.stop()); ctx.close(); stopLive.current = null; say("stopped"); };
    at.onended = stop;
    stopLive.current = stop;
  }

  const solo = (i: number) => setOn(PARTS.map((_, j) => j === i));
  const btn: React.CSSProperties = { minHeight: 32, padding: "4px 12px", marginRight: 8, background: "#222", color: "#eee", border: "1px solid #555", borderRadius: 6, cursor: "pointer" };

  return (
    <main style={{ padding: 24, fontFamily: "ui-monospace, monospace", fontSize: 13, color: "#ddd", background: "#0d0d0d", minHeight: "100vh", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 18 }}>Lab spike · live parts of a streamed track</h1>
      <p>Model: {modelState} <button style={btn} onClick={() => loadModel()}>Load model</button> <button style={btn} onClick={() => runBench()}>Run bench (own loop)</button></p>
      {benchOut.current && (
        <p>Bench audio (Six AM&apos;s own loop): <button style={btn} onClick={() => playBench(-1)}>Mix</button>{PARTS.map((p, i) => <button key={p} style={btn} onClick={() => playBench(i)}>{p}</button>)}</p>
      )}
      <h2 style={{ fontSize: 15, marginTop: 24 }}>1 · Open the Deck</h2>
      <p>
        <input value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)} placeholder="SoundCloud track link" style={{ width: 460, padding: 6, background: "#1a1a1a", color: "#eee", border: "1px solid #444" }} />{" "}
        <button style={btn} onClick={openDeck}>Open Deck window</button>
      </p>
      <p>Deck: {deck ? `${deck.title || "…"} · ${deck.playing ? "playing" : "paused"} · ${(deck.pos / 1000).toFixed(1)} s · heard now (delayed): ${Math.max(0, deck.pos / 1000 - delayRef.current).toFixed(1)} s` : "not open"} <button style={btn} onClick={() => cmd("play")}>Play</button><button style={btn} onClick={() => cmd("pause")}>Pause</button></p>
      <h2 style={{ fontSize: 15, marginTop: 24 }}>2 · Listen</h2>
      <p><button style={btn} onClick={() => startLive()}>Start listening</button> In Chrome&apos;s dialog pick the <b>Six AM Deck</b> tab and keep &quot;Also share tab audio&quot; on.</p>
      {live && <p>Capturing {live.label} · original muted here: <b>{String(live.suppressLocalAudioPlayback)}</b> · delay {live.delayS} s · {live.steps} windows · {live.meanComputeMs} ms each · <b>{live.ratio}× real time</b> · late {live.late} · heard {live.heardS} s <button style={btn} onClick={() => stopLive.current?.()}>Stop</button></p>}
      <h2 style={{ fontSize: 15, marginTop: 24 }}>3 · Parts</h2>
      <p>
        {PARTS.map((p, i) => (
          <label key={p} style={{ marginRight: 16 }}><input type="checkbox" checked={on[i]} onChange={() => setOn((o) => o.map((v, j) => (j === i ? !v : v)))} /> {p} <button style={{ ...btn, minHeight: 28 }} onClick={() => solo(i)}>solo</button></label>
        ))}
        <button style={btn} onClick={() => setOn([true, true, true, true])}>All</button>
      </p>
      <pre style={{ marginTop: 24, whiteSpace: "pre-wrap", color: "#999" }}>{log.join("\n")}</pre>
    </main>
  );
}
