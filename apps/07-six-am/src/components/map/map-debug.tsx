"use client";

// The arrangement map's debug surface (S1/S2, non-visual run): paste a SoundCloud link, map the
// whole track, see the numbers, open it as a Studio template. Deliberately unstyled: the map view's
// design comes from the design pick. Graders drive it from the URL (?url=…&auto=1) and read the
// result from window.__sixamMap (see the run notes in the PM's report).
import { useCallback, useEffect, useRef, useState } from "react";
import { startTabCapture, type TabCapture } from "@/lib/ears/capture";
import { EarsClient } from "@/lib/ears/ears-client";
import { widgetSrc, Player } from "@/lib/ears/widget";
import { ApiError, mentorApi, useAccessCode } from "@/lib/mentor/client";
import { STUDIO_DRAFT_KEY } from "@/lib/mentor/studio";
import { layerSpans } from "@/lib/map/context";
import { listenWholeTrack, type MapRun, type MapStage } from "@/lib/map/listen";
import { templateDraft } from "@/lib/map/template";
import { LAYERS, type TrackMap } from "@/lib/map/types";

type Status =
  | { is: "idle" }
  | { is: "running"; stage: MapStage | { stage: "capture" } }
  | { is: "done"; map: TrackMap; run: MapRun | null; saved: string }
  | { is: "error"; message: string };

declare global {
  interface Window {
    __sixamMap?: { status: string; error?: string; map?: TrackMap; timings?: MapRun["timings"]; saved?: string; startedAt?: number; endedAt?: number };
    /** The last run's frame features (numbers only: per ~21 ms band levels and onsets), for tuning. */
    __sixamFrames?: { fps: number; t0: number; n: number; data: number[] };
  }
}

const LEVELS = " ▁▂▃▄▅▆▇█";
const strip = (v: number[]) => v.map((x) => LEVELS[Math.min(8, Math.max(0, Math.round(x * 8)))]).join("");
const clock = (sec: number) => { const t = Math.max(0, Math.round(sec)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

export function MapDebug({ initialUrl, auto }: { initialUrl: string; auto: boolean }) {
  const [code, setCode, ready] = useAccessCode();
  const [codeInput, setCodeInput] = useState("");
  const [url, setUrl] = useState(initialUrl);
  const [embedUrl] = useState(initialUrl || "https://soundcloud.com/koltercologne/symphony-no-5");
  const [player, setPlayer] = useState<Player | null>(null);
  const [status, setStatus] = useState<Status>({ is: "idle" });
  const capture = useRef<TabCapture | null>(null);
  const ears = useRef<EarsClient | null>(null);
  const abort = useRef<AbortController | null>(null);
  const started = useRef(false);

  const onIframe = useCallback((el: HTMLIFrameElement | null) => {
    if (!el) return;
    Player.attach(el).then(setPlayer, (e: Error) => setStatus({ is: "error", message: `The SoundCloud player didn't load: ${e.message}` }));
  }, []);
  useEffect(() => () => { abort.current?.abort(); capture.current?.stop(); ears.current?.terminate(); }, []);

  const publish = (s: Status, extra: Partial<NonNullable<Window["__sixamMap"]>> = {}) => {
    window.__sixamMap = { ...window.__sixamMap, status: s.is, ...extra };
    setStatus(s);
  };

  const start = useCallback(async () => {
    if (!player || !url) return;
    started.current = true;
    const api = mentorApi(code);
    abort.current = new AbortController();
    publish({ is: "running", stage: { stage: "capture" } }, { startedAt: Date.now(), error: undefined });
    try {
      capture.current ??= await startTabCapture(() => { capture.current = null; });
      const known = await api.analysis(url).catch((e) => { if (e instanceof ApiError && e.status === 404) return null; throw e; });
      if (!known) ears.current ??= new EarsClient();
      const run = await listenWholeTrack({
        url, player, capture: capture.current, ears: ears.current, known, signal: abort.current.signal,
        onStage: (stage) => setStatus({ is: "running", stage }),
      });
      // Numbers only go to the server: the new Ears result (if any) and the map.
      let saved = "saved";
      try {
        if (run.analysis) await api.putAnalysis(run.analysis);
        await api.putMap(run.map);
      } catch (e) {
        saved = `not saved: ${e instanceof Error ? e.message : String(e)}`;
      }
      window.__sixamFrames = { fps: run.series.fps, t0: run.series.t0, n: run.series.n, data: Array.from(run.series.data, (x) => Math.round(x * 100) / 100) };
      publish({ is: "done", map: run.map, run, saved }, { map: run.map, timings: run.timings, saved, endedAt: Date.now() });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      publish({ is: "error", message }, { error: message, endedAt: Date.now() });
    }
  }, [player, url, code]);

  // ?auto=1: start as soon as the player is ready and the access code is known (graders).
  useEffect(() => {
    if (auto && ready && code && player && url && !started.current) {
      const t = setTimeout(start, 0);
      return () => clearTimeout(t);
    }
  }, [auto, ready, code, player, url, start]);

  const loadSaved = async () => {
    try {
      const map = await mentorApi(code).map(url);
      publish({ is: "done", map, run: null, saved: "loaded from the server" }, { map });
    } catch (e) {
      publish({ is: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const openTemplate = (map: TrackMap) => {
    try { localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(templateDraft(map))); } catch { /* storage blocked */ }
    location.href = "/";
  };

  if (ready && !code) {
    return (
      <main style={{ padding: 16, fontFamily: "monospace" }}>
        <form onSubmit={(e) => { e.preventDefault(); if (codeInput.trim()) setCode(codeInput.trim()); }}>
          <label>Access code <input type="password" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} /></label> <button>Unlock</button>
        </form>
      </main>
    );
  }

  const map = status.is === "done" ? status.map : null;
  const run = status.is === "done" ? status.run : null;
  return (
    <main style={{ padding: 16, fontFamily: "monospace", fontSize: 13, lineHeight: 1.5, color: "#ddd", background: "#111", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 16 }}>Arrangement map (debug)</h1>
      <p>Plays the whole track through tab sharing and keeps only numbers. Keep this tab unmuted.</p>
      <div>
        <input style={{ width: "min(640px, 100%)" }} value={url} onChange={(e) => setUrl(e.target.value.trim())} placeholder="https://soundcloud.com/…" aria-label="SoundCloud track link" />{" "}
        <button id="map-start" onClick={start} disabled={!player || !url || status.is === "running"}>Map whole track</button>{" "}
        <button onClick={loadSaved} disabled={!url || status.is === "running"}>Load saved map</button>{" "}
        {status.is === "running" ? <button onClick={() => abort.current?.abort()}>Cancel</button> : null}
      </div>
      <iframe ref={onIframe} title="SoundCloud player" src={widgetSrc(embedUrl)} allow="autoplay" style={{ width: "100%", maxWidth: 640, height: 120, border: 0, marginTop: 8 }} />
      <p id="map-status" data-status={status.is}>
        {status.is === "idle" ? (player ? "Ready." : "Loading the player…") : null}
        {status.is === "running" ? (status.stage.stage === "capture" ? "Asking to share this tab…" : status.stage.stage === "listening" ? `Listening ${clock(status.stage.seconds)} / ${clock(status.stage.of)}` : status.stage.stage === "loading" ? "Loading the track…" : "Working out the map…") : null}
        {status.is === "error" ? `Error: ${status.message}` : null}
        {status.is === "done" ? `Done (${status.saved}).` : null}
      </p>
      {map ? (
        <section>
          <button id="map-template" onClick={() => openTemplate(map)}>Open as Studio template</button>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {`${map.uploader} – ${map.title}
${map.bpm} BPM (Ears ${map.tempo.earsBpm}, refined ${map.tempo.refined}, coherence ${map.tempo.coherence}) · ${map.key} ${map.scale} · bar 1 at ${map.originSec.toFixed(2)} s (downbeat confidence ${map.downbeat.confidence}) · ${map.bars} bars · ${clock(map.durationSec)} · heard ${Math.round(map.coverage * 100)}%

Sections (bars 1-based, as in the Studio):
${map.sections.map((s) => `  ${s.label.padEnd(10)} bars ${String(s.startBar + 1).padStart(3)}–${String(s.endBar).padEnd(4)} ${clock(s.startSec)}–${clock(s.endSec)}`).join("\n")}

Per bar (one character a bar; layers are ESTIMATES):
  energy  ${strip(map.energy)}
${LAYERS.map((k) => `  ${k.padEnd(7)} ${strip(map.layers[k])}   on: ${layerSpans(map.layers[k]).map((s) => `${s.start + 1}–${s.end}`).join(", ") || "-"}`).join("\n")}
${run ? `
Timings: load ${run.timings.loadMs} ms · listen ${(run.timings.listenMs / 1000).toFixed(1)} s · build ${run.timings.buildMs} ms · heard ${run.timings.heardSec} s · ${run.timings.frames} frames · ${run.timings.anchors} playhead anchors · ${run.timings.segments} stretch(es)
Downbeat scores (phase 0–3): ${run.downbeatScores.map((x) => x.toFixed(1)).join(", ")}${run.analysis ? `\nNew Ears result: ${run.analysis.bpm} BPM, ${run.analysis.key} ${run.analysis.scale}` : ""}` : ""}`}
          </pre>
          {run ? (
            <details>
              <summary>Raw bar numbers</summary>
              <pre>{run.raws.map((r, i) => `${String(i + 1).padStart(3)} tot ${r.totalDb.toFixed(1)} kickPulse ${r.kickPulseDb.toFixed(1)} kickPeak ${r.kickPeakDb.toFixed(1)} beatFlux ${r.beatFlux.toFixed(1)} offFlux ${r.offFlux.toFixed(1)} lowSus ${r.lowSustainDb.toFixed(1)} lowPeak ${r.lowPeakDb.toFixed(1)} mid ${r.midDb.toFixed(1)} high ${r.highDb.toFixed(1)} hf ${r.highFlux.toFixed(2)} tonal ${r.tonal.toFixed(2)} voc ${r.vocDb.toFixed(1)} vf ${r.vocFlux.toFixed(3)}`).join("\n")}</pre>
            </details>
          ) : null}
          <pre id="map-json" hidden>{JSON.stringify(map)}</pre>
        </section>
      ) : null}
    </main>
  );
}
