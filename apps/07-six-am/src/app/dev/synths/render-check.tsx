"use client";

// Renders each preset × pattern and each kit × drum pattern offline and publishes the results on
// window.sixAmSynths for a grader (headless Chrome). It reports, it doesn't grade: the peak/RMS
// columns only show that something sounded.
import { useEffect, useRef, useState } from "react";
import { renderLoopOffline, type OfflineRender } from "@/lib/synths/engine";
import { DRUM_PATTERNS, KITS, type KitId } from "@/lib/synths/kits";
import { makeKitLoop, makeSynthLoop, type PlayableLoop } from "@/lib/synths/loop";
import { SYNTH_PATTERNS } from "@/lib/synths/patterns";
import { PRESETS, type PresetId } from "@/lib/synths/presets";
import type { Scale } from "@/lib/synths/theory";

type Props = { keyName: string; scale: Scale; bpm: number; repeats: number; only: string; autorun: boolean };

type Row = Omit<OfflineRender, "samples"> & { id: string; seconds: number; peak: number; rms: number };

type Api = {
  status: "idle" | "running" | "done" | "error";
  error?: string;
  params: { key: string; scale: Scale; bpm: number; repeats: number };
  results: Row[];
  /** Mono samples of one render, as a plain array (JSON-friendly). */
  samples(id: string): number[] | null;
  /** One render as a 16-bit mono WAV, base64. */
  wav(id: string): string | null;
  /** Render any preset/kit + pattern at any key and tempo; resolves to its row id. */
  render(opts: { preset?: PresetId; kit?: KitId; pattern: string; key: string; scale: Scale; bpm: number; repeats?: number }): Promise<string | null>;
};

declare global { interface Window { sixAmSynths?: Api } }

/** Every loop to render: each preset with each of its patterns, each kit with each drum pattern. */
function allLoops(): PlayableLoop[] {
  const synths = (Object.keys(PRESETS) as PresetId[]).flatMap((preset) =>
    SYNTH_PATTERNS.filter((p) => (p.presets as string[]).includes(preset)).map((p) => makeSynthLoop(preset, p.id)!));
  const kits = (Object.keys(KITS) as KitId[]).flatMap((kit) => DRUM_PATTERNS.map((p) => makeKitLoop(kit, p.id)!));
  return [...synths, ...kits];
}

function stats(x: Float32Array) {
  let peak = 0, sum = 0;
  for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); peak = Math.max(peak, v); sum += v * v; }
  return { peak, rms: Math.sqrt(sum / Math.max(1, x.length)) };
}

function toWavBase64(x: Float32Array, sampleRate: number): string {
  const buf = new DataView(new ArrayBuffer(44 + x.length * 2));
  const str = (o: number, s: string) => [...s].forEach((ch, i) => buf.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF"); buf.setUint32(4, 36 + x.length * 2, true); str(8, "WAVEfmt ");
  buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true);
  buf.setUint32(24, sampleRate, true); buf.setUint32(28, sampleRate * 2, true); buf.setUint16(32, 2, true); buf.setUint16(34, 16, true);
  str(36, "data"); buf.setUint32(40, x.length * 2, true);
  for (let i = 0; i < x.length; i++) buf.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i])) * 0x7fff, true);
  let bin = "";
  const bytes = new Uint8Array(buf.buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function SynthRenderCheck({ keyName, scale, bpm, repeats, only, autorun }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<Api["status"]>("idle");
  const store = useRef(new Map<string, OfflineRender>());
  const started = useRef(false);

  useEffect(() => {
    const keep = async (r: OfflineRender | null, id: string) => {
      if (!r) return null;
      store.current.set(id, r);
      const { samples, ...rest } = r;
      const row: Row = { ...rest, id, seconds: samples.length / r.sampleRate, ...stats(samples) };
      api.results = [...api.results.filter((x) => x.id !== id), row];
      setRows(api.results);
      return id;
    };
    const api: Api = {
      status: "idle",
      params: { key: keyName, scale, bpm, repeats },
      results: [],
      samples: (id) => { const r = store.current.get(id); return r ? Array.from(r.samples) : null; },
      wav: (id) => { const r = store.current.get(id); return r ? toWavBase64(r.samples, r.sampleRate) : null; },
      render: async (o) => {
        const loop = o.kit ? makeKitLoop(o.kit, o.pattern) : o.preset ? makeSynthLoop(o.preset, o.pattern) : null;
        if (!loop) return null;
        const id = `${loop.id}@${o.key}-${o.scale}-${o.bpm}`;
        return keep(await renderLoopOffline(loop, o.key, o.scale, o.bpm, { repeats: o.repeats ?? 2 }), id);
      },
    };
    window.sixAmSynths = api;
    if (!autorun || started.current) return;
    started.current = true;
    (async () => {
      api.status = "running"; setStatus("running");
      try {
        for (const loop of allLoops().filter((l) => !only || l.id.includes(only))) {
          await keep(await renderLoopOffline(loop, keyName, scale, bpm, { repeats }), loop.id);
        }
        api.status = "done"; setStatus("done");
      } catch (e) {
        api.status = "error"; api.error = String(e); setStatus("error");
        console.error("[six-am] synth render check failed:", e);
      }
    })();
  }, [keyName, scale, bpm, repeats, only, autorun]);

  return (
    <main className="mx-auto w-full max-w-5xl p-6 font-mono text-sm">
      <h1 className="mb-1 text-base">Synth render check (dev only)</h1>
      <p className="mb-4 opacity-70">
        {keyName} {scale} · {bpm} BPM · {repeats} passes · status <span id="status" data-status={status}>{status}</span>.
        Results and samples are on <code>window.sixAmSynths</code>. Params: ?key=&amp;scale=&amp;bpm=&amp;repeats=&amp;only=&amp;run=0
      </p>
      <table className="w-full text-left">
        <thead><tr><th>id</th><th>events</th><th>seconds</th><th>attack</th><th>peak</th><th>rms</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} data-id={r.id}>
              <td>{r.id}</td><td>{r.events.length}</td><td>{r.seconds.toFixed(2)}</td><td>{r.attack}</td>
              <td>{r.peak.toFixed(3)}</td><td>{r.rms.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
