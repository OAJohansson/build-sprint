"use client";

import { useEffect, useRef, useState } from "react";
import type { EarsModelInfo, EarsRequest, EarsResponse, EarsResult } from "@/lib/ears/ears.worker";
import { renderTestLoop, TEST_BPM } from "./test-loop";

// Minimal typing for the SoundCloud Widget API (https://developers.soundcloud.com/docs/api/html5-widget).
type ScSound = { title?: string; user?: { username?: string }; policy?: string; duration?: number; full_duration?: number };
type ScWidget = {
  bind(ev: string, cb: () => void): void;
  play(): void;
  getCurrentSound(cb: (s: ScSound | null) => void): void;
  getPosition(cb: (ms: number) => void): void;
  getDuration(cb: (ms: number) => void): void;
};
type ScApi = { Widget: ((el: HTMLIFrameElement) => ScWidget) & { Events: Record<string, string> } };
declare global {
  interface Window { SC?: ScApi }
}

const TARGET_RATE = 16000;
const DEFAULT_URL = "https://soundcloud.com/hardreset90087/redemption-extended-mix";

type Run = {
  source: "tab" | "test";
  track: string | null;
  preview: boolean;
  capturedSeconds: number;
  captureRate: number;
  resampleMs: number;
  model: EarsModelInfo | null;
  result: EarsResult;
};

export function ModelSpike({ testMode }: { testMode: boolean }) {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [sound, setSound] = useState<ScSound | null>(null);
  const [listening, setListening] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [status, setStatus] = useState("Idle.");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [model, setModel] = useState<EarsModelInfo | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const widgetRef = useRef<ScWidget | null>(null);
  const playingRef = useRef(false);
  const capture = useRef<{ stream: MediaStream; ctx: AudioContext; tap: AudioWorkletNode } | null>(null);
  const pending = useRef<((r: EarsResult) => void) | null>(null);
  const modelRef = useRef<EarsModelInfo | null>(null);

  // Worker: created once, loads the model straight away so the first analysis is quick.
  useEffect(() => {
    const w = new Worker(new URL("../../../lib/ears/ears.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<EarsResponse>) => {
      const m = e.data;
      if (m.type === "progress") setProgress(m.total ? m.loaded / m.total : null);
      else if (m.type === "loaded") { modelRef.current = m.info; setModel(m.info); setProgress(null); }
      else if (m.type === "result") { pending.current?.(m.result); pending.current = null; }
      else if (m.type === "error") { setError(m.message); setBusy(false); pending.current = null; }
    };
    w.postMessage({ type: "load" } satisfies EarsRequest);
    return () => w.terminate();
  }, []);

  // SoundCloud widget API script.
  useEffect(() => {
    if (testMode || window.SC) return;
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    document.head.appendChild(s);
  }, [testMode]);

  useEffect(() => () => stopCapture(), []);

  function loadPlayer() {
    setSound(null);
    setIframeSrc(
      "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url.trim()) + "&auto_play=false&visual=false&show_comments=false",
    );
  }

  function onIframe(el: HTMLIFrameElement | null) {
    if (!el || !window.SC) return;
    const SC = window.SC;
    const w = SC.Widget(el);
    widgetRef.current = w;
    w.bind(SC.Widget.Events.READY, () => w.getCurrentSound((s) => setSound(s)));
    w.bind(SC.Widget.Events.PLAY, () => { playingRef.current = true; });
    w.bind(SC.Widget.Events.PAUSE, () => { playingRef.current = false; });
    w.bind(SC.Widget.Events.FINISH, () => { playingRef.current = false; });
  }

  async function enableListening() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        // Chrome-only hints (Step 0 used the same set).
        ...({ preferCurrentTab: true, selfBrowserSurface: "include", surfaceSwitching: "exclude", systemAudio: "exclude" } as object),
      });
      stream.getVideoTracks().forEach((t) => t.stop()); // audio only; we never look at the picture
      const audio = stream.getAudioTracks();
      if (!audio.length) { setError("No audio shared: switch on 'Also share tab audio' and try again."); stream.getTracks().forEach((t) => t.stop()); return; }
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule("/ears/pcm-tap.js");
      const src = ctx.createMediaStreamSource(new MediaStream(audio));
      const tap = new AudioWorkletNode(ctx, "pcm-tap");
      src.connect(tap); // not connected to ctx.destination: no echo
      audio[0].onended = () => stopCapture();
      capture.current = { stream, ctx, tap };
      setListening(true);
      setStatus(`Listening at ${ctx.sampleRate} Hz. Press Analyse.`);
    } catch (e) {
      setError(`Sharing cancelled or failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function stopCapture() {
    const c = capture.current;
    if (!c) return;
    c.tap.port.postMessage({ on: false });
    c.stream.getTracks().forEach((t) => t.stop());
    c.ctx.close();
    capture.current = null;
    setListening(false);
  }

  const ask = <T,>(cb: (r: (v: T) => void) => void) => new Promise<T>(cb);

  async function analyseTab() {
    const c = capture.current, w = widgetRef.current;
    if (!c || !w) return;
    setError(null); setRun(null); setBusy(true);
    const current = await ask<ScSound | null>((r) => w.getCurrentSound(r));
    const preview = current?.policy === "SNIP";
    const [pos, dur] = await Promise.all([ask<number>((r) => w.getPosition(r)), ask<number>((r) => w.getDuration(r))]);
    const left = dur > 0 ? Math.max(0, (dur - pos) / 1000) : seconds;
    const want = Math.max(3, Math.min(seconds, left || seconds));
    if (!playingRef.current) w.play();

    // PCM blocks live in this array, in memory only, until the resample below; then they're dropped.
    let chunks: Float32Array[] = [];
    let got = 0;
    const rate = c.ctx.sampleRate;
    await new Promise<void>((resolve) => {
      const started = performance.now();
      c.tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (!playingRef.current) return; // only count audio while the widget plays
        chunks.push(e.data);
        got += e.data.length;
        setStatus(`Capturing ${(got / rate).toFixed(0)} / ${want.toFixed(0)} s${preview ? " (preview only, 30 s)" : ""}…`);
        if (got >= want * rate) resolve();
      };
      c.tap.port.postMessage({ on: true });
      const idle = setInterval(() => {
        // Track ended or paused for good: analyse what we have.
        if (!capture.current || (!playingRef.current && performance.now() - started > 4000 && got > 3 * rate)) { clearInterval(idle); resolve(); }
      }, 500);
    });
    c.tap.port.postMessage({ on: false });
    c.tap.port.onmessage = null;
    if (got < 3 * rate) { chunks = []; setBusy(false); setError("Under 3 s captured. Is the track playing?"); return; }

    const t0 = performance.now();
    const pcm = new Float32Array(got);
    let o = 0;
    for (const ch of chunks) { pcm.set(ch, o); o += ch.length; }
    chunks = [];
    const pcm16 = await resample(pcm, rate);
    const resampleMs = Math.round(performance.now() - t0);
    setStatus("Analysing…");
    const result = await analyse(pcm16);
    setRun({
      source: "tab",
      track: current ? `${current.title} — ${current.user?.username}` : null,
      preview,
      capturedSeconds: Math.round((got / rate) * 10) / 10,
      captureRate: rate,
      resampleMs,
      model: modelRef.current,
      result,
    });
    setStatus("Done.");
    setBusy(false);
  }

  async function analyseTest() {
    setError(null); setRun(null); setBusy(true);
    setStatus(`Rendering a 30 s test loop at ${TEST_BPM} BPM…`);
    const t0 = performance.now();
    const pcm16 = await renderTestLoop(TARGET_RATE, 30);
    const resampleMs = Math.round(performance.now() - t0);
    setStatus("Analysing…");
    const result = await analyse(pcm16);
    setRun({ source: "test", track: `synthetic loop, ${TEST_BPM} BPM, A minor`, preview: false, capturedSeconds: 30, captureRate: TARGET_RATE, resampleMs, model: modelRef.current, result });
    setStatus("Done.");
    setBusy(false);
  }

  function analyse(pcm16: Float32Array) {
    return new Promise<EarsResult>((resolve) => {
      pending.current = resolve;
      // Transferred, not copied: after this the page no longer holds the samples.
      workerRef.current!.postMessage({ type: "analyse", pcm: pcm16, sampleRate: TARGET_RATE } satisfies EarsRequest, [pcm16.buffer]);
    });
  }

  async function copyResults() {
    if (!run) return;
    await navigator.clipboard.writeText(JSON.stringify({ userAgent: navigator.userAgent, ...run }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const r = run?.result;
  const testPass = run?.source === "test" && r ? Math.abs(r.bpm - TEST_BPM) <= 1 && r.activations.count === 400 && r.activations.finite : null;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-3 px-4 py-6 font-mono text-sm">
      <h1 className="text-base font-semibold uppercase tracking-widest">Six AM · model spike</h1>
      <p className="text-neutral-500">
        Discogs-EffNet in a Web Worker on audio from this tab. Nothing is recorded or uploaded: PCM stays in memory for one analysis, only numbers come out.
      </p>

      <Section title="Model">
        {model ? (
          <p>Loaded in {(model.loadMs / 1000).toFixed(1)} s · {(model.bytes / 1e6).toFixed(1)} MB · {model.classes} classes · input {model.inputName} · outputs {model.outputNames.join(", ")}</p>
        ) : (
          <p>Loading model… {progress !== null ? `${Math.round(progress * 100)}%` : ""}</p>
        )}
      </Section>

      {testMode ? (
        <Section title="Test mode (no tab capture)">
          <p className="text-neutral-500">Renders a 30 s kick + bass + hat loop at {TEST_BPM} BPM with an A minor stab per bar, at 16 kHz, and runs the same worker path.</p>
          <Button onClick={analyseTest} disabled={busy}>Run test loop</Button>
        </Section>
      ) : (
        <>
          <Section title="1 · SoundCloud track">
            <input className="w-full rounded border border-neutral-300 px-2 py-2" value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} />
            <Button onClick={loadPlayer}>Load player</Button>
            {iframeSrc && (
              <iframe key={iframeSrc} ref={onIframe} className="mt-3 w-full" height={166} allow="autoplay" src={iframeSrc} title="SoundCloud player" />
            )}
            {sound && (
              <p className="mt-2">
                {sound.title} — {sound.user?.username}
                {sound.policy === "SNIP" && <b className="ml-2 text-amber-600">preview only (30 s)</b>}
              </p>
            )}
          </Section>
          <Section title="2 · Enable listening">
            <p className="text-neutral-500">Keep this tab selected and switch on “Also share tab audio”.</p>
            <Button onClick={enableListening} disabled={listening}>Enable listening</Button>{" "}
            <Button onClick={stopCapture} disabled={!listening} ghost>Stop</Button>
          </Section>
          <Section title="3 · Analyse">
            <label className="flex items-center gap-2">
              Seconds
              <input type="number" min={5} max={180} className="w-20 rounded border border-neutral-300 px-2 py-1" value={seconds} onChange={(e) => setSeconds(Number(e.target.value) || 60)} />
            </label>
            <Button onClick={analyseTab} disabled={!listening || !sound || busy || !model}>Analyse</Button>
          </Section>
        </>
      )}

      <Section title="Result">
        <p className="text-neutral-500">{status}</p>
        {error && <p className="text-red-600">{error}</p>}
        {run && r && (
          <div className="mt-2 space-y-2">
            {testPass !== null && (
              <p className={testPass ? "font-semibold text-green-700" : "font-semibold text-red-600"}>
                {testPass ? "Test PASS" : "Test FAIL"}: BPM {r.bpm} (want {TEST_BPM} ± 1), {r.activations.count} activations, finite {String(r.activations.finite)}
              </p>
            )}
            <p>{run.track}{run.preview && " · preview only (30 s)"}</p>
            <p>{run.capturedSeconds} s at {run.captureRate} Hz · resample {run.resampleMs} ms · features {r.timings.featuresMs} ms · inference {r.timings.inferenceMs} ms ({r.patches} patches)</p>
            <ol className="list-decimal pl-5">
              {r.styles.map((s) => <li key={s.style}>{s.style.replace("---", " / ")} <b>{s.pct}%</b></li>)}
            </ol>
            <p>BPM <b>{r.bpm}</b> (confidence {r.bpmConfidence}) · key <b>{r.key} {r.scale}</b> ({r.keyStrength}) · energy <b>{r.energy.dbfs} dBFS</b> · brightness <b>{r.brightness.centroidHz} Hz</b></p>
            <Button onClick={copyResults} ghost>{copied ? "Copied" : "Copy results"}</Button>
          </div>
        )}
      </Section>
    </main>
  );
}

/** Downmixed PCM at the capture rate → 16 kHz mono, in memory (OfflineAudioContext's resampler). */
async function resample(pcm: Float32Array<ArrayBuffer>, rate: number): Promise<Float32Array<ArrayBuffer>> {
  if (rate === TARGET_RATE) return pcm;
  const off = new OfflineAudioContext(1, Math.ceil((pcm.length * TARGET_RATE) / rate), TARGET_RATE);
  const buf = off.createBuffer(1, pcm.length, rate);
  buf.copyToChannel(pcm, 0);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start();
  const out = await off.startRendering();
  return new Float32Array(out.getChannelData(0)); // own copy, so it can be transferred to the worker
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 p-4">
      <h2 className="mb-2 text-xs uppercase tracking-widest text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

function Button({ ghost, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { ghost?: boolean }) {
  return (
    <button
      {...props}
      className={`mt-2 rounded px-3 py-2 font-semibold disabled:opacity-40 ${ghost ? "border border-neutral-300" : "bg-amber-500 text-black"}`}
    />
  );
}
