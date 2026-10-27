"use client";

// One track's page: a saved map opens in the Lab (S1, components/lab); a track without one gets the
// Phase 3 full-track listen (A1–A5), which fills the map in live and then opens the Lab.
// Graders: ?url=<track>&auto=1 starts the listen at once; window.__sixamMap reports it.
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { MapError } from "@/lib/map/listen";
import { Logo } from "@/components/studio/logo";
import { Notice, Unlock } from "@/components/studio/unlock";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { CaptureError, startTabCapture, type TabCapture } from "@/lib/ears/capture";
import { EarsClient } from "@/lib/ears/ears-client";
import { keyLabel } from "@/lib/ears/labels";
import type { EarsAnalysis } from "@/lib/ears/results";
import { Player, widgetSrc } from "@/lib/ears/widget";
import { ApiError, mentorApi, useAccessCode } from "@/lib/mentor/client";
import { LabView } from "@/components/lab/lab-view";
import { listenWholeTrack, type MapRun } from "@/lib/map/listen";
import type { TrackMap } from "@/lib/map/types";
import { clock, rulerStep, viewLayers, viewSections, type Block } from "@/lib/map/view";
import s from "./map.module.css";

declare global {
  interface Window {
    __sixamMap?: { status: string; error?: string; map?: TrackMap; timings?: MapRun["timings"]; saved?: string; startedAt?: number; endedAt?: number };
    /** The last run's frame features (numbers only: band levels and onsets per ~21 ms), for tuning. */
    __sixamFrames?: { fps: number; t0: number; n: number; data: number[] };
  }
}

type Phase = { is: "loading" } | { is: "locked"; error: string | null } | { is: "problem"; text: string } | { is: "ready" };
type Live = { map: TrackMap | null; heardSec: number; durationSec: number };

const RULER_PX = 1290; // the ruler's width at the 1440 px laptop layout
const report = (extra: Partial<NonNullable<Window["__sixamMap"]>>) => { window.__sixamMap = { status: "idle", ...window.__sixamMap, ...extra }; };

export function MapView({ id, auto, quiet = false }: { id: string; auto: boolean; quiet?: boolean }) {
  const [code, setCode, ready] = useAccessCode();
  const [phase, setPhase] = useState<Phase>({ is: "loading" });
  const [analysis, setAnalysis] = useState<EarsAnalysis | null>(null);
  const [map, setMap] = useState<TrackMap | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const capture = useRef<TabCapture | null>(null);
  const ears = useRef<EarsClient | null>(null);
  const abort = useRef<AbortController | null>(null);
  const autoStarted = useRef(false);

  // Load the track's Ears result and its map, if any (both may be missing: then "Listen and map").
  useEffect(() => {
    if (!ready || !code || !id) return;
    let on = true;
    const api = mentorApi(code);
    const none = (e: unknown) => { if (e instanceof ApiError && e.status === 404) return null; throw e; };
    Promise.all([api.analysis(id).catch(none), api.map(id).catch(none)]).then(
      ([a, m]) => { if (!on) return; setAnalysis(a); setMap(m); setPhase({ is: "ready" }); report({ status: m ? "done" : "idle", map: m ?? undefined }); },
      (e) => { if (!on) return; setPhase(e instanceof ApiError && e.status === 401 ? { is: "locked", error: "That code didn't work." } : { is: "problem", text: e instanceof Error ? e.message : "Something went wrong." }); },
    );
    return () => { on = false; };
  }, [ready, code, id]);

  const onIframe = useCallback((el: HTMLIFrameElement | null) => {
    if (el) Player.attach(el).then(setPlayer, (e: Error) => setProblem(`The SoundCloud player didn't load: ${e.message}`));
  }, []);
  useEffect(() => () => { abort.current?.abort(); capture.current?.stop(); ears.current?.terminate(); }, []);

  const listen = useCallback(async () => {
    if (!player) return;
    const api = mentorApi(code);
    abort.current = new AbortController();
    setProblem(null);
    setLive({ map: null, heardSec: 0, durationSec: (analysis?.durationMs ?? 0) / 1000 });
    report({ status: "running", startedAt: Date.now(), error: undefined });
    try {
      capture.current ??= await startTabCapture(() => { capture.current = null; });
      if (!analysis) ears.current ??= new EarsClient();
      const run = await listenWholeTrack({
        url: id, player, capture: capture.current, ears: ears.current, known: analysis, signal: abort.current.signal,
        onStage: (st) => { if (st.stage === "listening") setLive((l) => ({ map: l?.map ?? null, heardSec: st.seconds, durationSec: st.of })); },
        onPartial: (p) => setLive({ map: p.map, heardSec: p.heardSec, durationSec: p.durationSec }),
      });
      // Numbers only go to the server: the new Ears result (if any) and the map.
      let saved = "saved";
      try {
        if (run.analysis) await api.putAnalysis(run.analysis);
        await api.putMap(run.map);
      } catch (e) {
        saved = `not saved: ${e instanceof Error ? e.message : String(e)}`;
        setProblem("The map is here, but it couldn't be saved. It will be gone when you leave.");
      }
      if (run.analysis) setAnalysis(run.analysis);
      setMap(run.map);
      setLive(null);
      window.__sixamFrames = { fps: run.series.fps, t0: run.series.t0, n: run.series.n, data: Array.from(run.series.data, (x) => Math.round(x * 100) / 100) };
      report({ status: "done", map: run.map, timings: run.timings, saved, endedAt: Date.now() });
    } catch (e) {
      // F7: Stop ends the listen before anything is saved, so nothing half-done is kept.
      const stopped = e instanceof MapError && e.reason === "cancelled";
      // N4: the browser's own wording ("Could not start video source") means nothing to the owner.
      const noShare = e instanceof CaptureError && e.reason === "cancelled";
      const message = stopped ? "Stopped. Nothing was saved; the map stays as it was."
        : noShare ? "Couldn't hear the tab. Press Listen and map, choose this tab and turn on Share tab audio."
        : e instanceof Error ? e.message : String(e);
      player.pause();
      setLive(null);
      setProblem(message);
      report({ status: stopped ? "stopped" : "error", error: message, endedAt: Date.now() });
    }
  }, [player, code, id, analysis]);
  const stop = useCallback(() => abort.current?.abort(), []);

  useEffect(() => {
    if (auto && phase.is === "ready" && player && !autoStarted.current) {
      autoStarted.current = true;
      const t = setTimeout(listen, 0);
      return () => clearTimeout(t);
    }
  }, [auto, phase.is, player, listen]);

  if (!id) return <Notice text="Open a track's map from Analyse." action={{ label: "Go to Analyse", onClick: () => { location.href = "/analyse"; } }} />;
  if (ready && !code) return <Unlock error={null} onUnlock={(c) => { setPhase({ is: "loading" }); setCode(c); }} />;
  if (phase.is === "locked") return <Unlock error={phase.error} onUnlock={(c) => { setPhase({ is: "loading" }); setCode(c); }} />;
  if (phase.is === "problem") return <Notice text={phase.text} action={{ label: "Try again", onClick: () => location.reload() }} />;
  if (phase.is === "loading") return <Notice text="Loading the map…" />;

  // A saved map opens in the Lab (S1); the hidden player below is only for the first listen.
  if (map && !live) return <LabView map={map} analysis={analysis} code={code} quiet={quiet} />;

  return (
    <>
      <MapScreen
        map={map} analysis={analysis} live={live} problem={problem}
        canListen={!!player} onListen={listen} onStop={stop}
      />
      <iframe ref={onIframe} className={s.player} title="SoundCloud player" src={widgetSrc(id)} allow="autoplay" tabIndex={-1} aria-hidden />
    </>
  );
}

/**
 * A track without a map yet (most reversible, S1): the Phase 3 full-track listen fills the map in
 * live; once it is saved the Lab opens on it. "Start a track from this", "Explain the structure",
 * the section reference player and the layer legend were removed with the Lab (S1).
 */
function MapScreen({ map, analysis, live, problem, canListen, onListen, onStop }: {
  map: TrackMap | null; analysis: EarsAnalysis | null; live: Live | null; problem: string | null;
  canListen: boolean; onListen: () => void; onStop: () => void;
}) {
  const listening = !!live;
  const shown = listening ? live.map : map;
  const empty = !listening && !map;
  const bpm = shown?.bpm ?? analysis?.bpm ?? 0;
  const origin = shown?.originSec ?? 0;
  const durationSec = live?.durationSec || map?.durationSec || (analysis?.durationMs ?? 0) / 1000;
  const bars = bpm ? Math.max(1, Math.round(((durationSec - origin) * bpm) / 240)) : 0;
  const heard = listening ? (bpm ? Math.min(bars, Math.max(0, Math.round(((live.heardSec - origin) * bpm) / 240))) : 0) : bars;
  const leftSec = listening ? Math.max(0, live.durationSec - live.heardSec) : 0;

  // While listening the last section is still open, so only the closed ones are drawn.
  const allSections = shown ? viewSections(shown) : [];
  const sections = listening ? allSections.slice(0, -1) : allSections;
  const layers = shown ? viewLayers(shown) : [];
  const clip = (b: Block[]) => (listening ? b.filter((x) => x.from <= heard).map((x) => ({ ...x, to: Math.min(x.to, heard + 1) })) : b);

  const title = analysis?.title || map?.title || live?.map?.title || (listening ? "Listening…" : "Untitled");
  const uploader = analysis?.uploader || map?.uploader || live?.map?.uploader || "";
  const key = map?.key || analysis?.key ? keyLabel(map?.key || analysis!.key, map?.scale || analysis!.scale) : "";
  const pct = (bar: number) => `${((bar - 1) / Math.max(1, bars)) * 100}%`;
  const w = (a: number, b: number) => `${((b - a) / Math.max(1, bars)) * 100}%`;
  const st = rulerStep(bars, RULER_PX);
  const nums = empty || !bars ? [] : Array.from({ length: Math.ceil(bars / st) }, (_, i) => 1 + i * st).filter((b) => b === 1 || (b - 1) / bars < 0.96);
  const lines = sections.slice(1).map((x) => x.from);

  return (
    <div className={s.root}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}><SettingsLink /></div>
      </header>

      <div className={s.head}>
        <a className={s.back} href="/analyse">← All tracks</a>
        <div className={s.title}>
          <h1 title={title}>{title}</h1>
          <p>
            <span className={s.uploader} title={uploader}>{uploader}</span>
            <span className={s.facts}>
              {uploader ? <span className={s.sep} aria-hidden>·</span> : null}
              {[bpm ? `${Math.round(bpm * 10) / 10} BPM` : "", key, durationSec ? clock(durationSec) : ""].filter(Boolean).join(" · ")}
            </span>
          </p>
        </div>
        <div className={s.actions}>
          {listening ? <button className={s.textBtn} onClick={onStop}>Stop listening</button> : null}
        </div>
      </div>

      {listening && problem ? <div className={s.info}><span className={s.read} aria-live="polite"><span className={s.problem}>{problem}</span></span></div> : null}

      <div className={s.grid} style={{ "--step": `${(st / Math.max(1, bars)) * 100}%` } as React.CSSProperties}>
        <div className={s.corner} title="Estimated from the sound, not stems">Layers</div>
        <div className={s.ruler}>
          {sections.map((x, i) => (
            <span key={i} className={s.sec} style={{ left: pct(x.from), width: w(x.from, x.to) }}><span>{x.name}</span></span>
          ))}
          {listening && <span className={s.unheard} style={{ left: pct(heard + 1) }} />}
          {listening && (
            <span className={s.here} style={{ left: shown ? pct(heard + 1) : 0 }} role="status">
              {shown && bpm ? `bar ${heard} · ` : "Finding the beat… · "}{clock(leftSec)} left
            </span>
          )}
          {nums.map((b) => <span key={b} className={s.num} style={{ left: pct(b) }}>{b}</span>)}
          {lines.map((b) => <i key={b} className={s.secLine} style={{ left: pct(b) }} />)}
        </div>
        {(layers.length ? layers : viewLayers({ layers: { kind: "estimate", method: "", kick: [], bass: [], chords: [], hats: [], vocals: [] } })).map((l) => (
          <Fragment key={l.id}>
            <div className={s.lh} style={{ "--c": l.color } as React.CSSProperties}>{l.name}</div>
            <div className={s.lane}>
              {lines.map((b) => <i key={b} className={s.secLine} style={{ left: pct(b) }} />)}
              {clip(l.blocks).map((b, i) => (
                <span key={i} role="img" aria-label={`${l.name} · bars ${b.from}–${b.to - 1} (estimate)`}
                  className={b.level === "maybe" ? `${s.block} ${s.maybe}` : s.block}
                  style={{ left: pct(b.from), width: w(b.from, b.to), "--c": l.color } as React.CSSProperties} />
              ))}
              {listening && <span className={s.unheard} style={{ left: pct(heard + 1) }} />}
            </div>
          </Fragment>
        ))}
        {listening && !shown && (
          <div className={s.empty}>
            <p>Finding the beat… The map draws in as soon as Ears has the tempo.</p>
          </div>
        )}
        {empty && (
          <div className={s.empty}>
            <h2>Not mapped yet</h2>
            <p>Play the whole track once; the map fills in as it plays. Then the Lab opens on it, where you can hear each part.</p>
            {problem ? <p className={s.problem} role="alert">{problem}</p> : null}
            <button className={s.start} onClick={onListen} disabled={!canListen}>Listen and map</button>
          </div>
        )}
      </div>
    </div>
  );
}
