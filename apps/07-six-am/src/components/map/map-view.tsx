"use client";

// The arrangement map of one track (A1–A5; design L114, T54–T58, built from the map3 prototype):
// the Studio's bar ruler with the track's sections, flat blocks where each layer seems to play
// (estimates), a read-out on point or focus, the listen filling in live, the Mentor explaining the
// structure underneath, and one way out: a new Studio track with the same bones.
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
import { STUDIO_DRAFT_KEY } from "@/lib/mentor/studio";
import { listenWholeTrack, type MapRun } from "@/lib/map/listen";
import { templateDraft } from "@/lib/map/template";
import type { TrackMap } from "@/lib/map/types";
import { clock, rulerStep, viewLayers, viewSections, type Block, type ViewSection } from "@/lib/map/view";
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
type Mentor = { is: "asking" } | { is: "answer"; text: string; more: boolean; asking?: boolean } | { is: "error"; text: string };

const RULER_PX = 1290; // the ruler's width at the 1440 px laptop layout
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const report = (extra: Partial<NonNullable<Window["__sixamMap"]>>) => { window.__sixamMap = { status: "idle", ...window.__sixamMap, ...extra }; };

export function MapView({ id, auto }: { id: string; auto: boolean }) {
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

  return (
    <>
      <MapScreen
        map={map} analysis={analysis} live={live} problem={problem} code={code}
        canListen={!!player} onListen={listen} onStop={stop} player={player}
      />
      <iframe ref={onIframe} className={s.player} title="SoundCloud player" src={widgetSrc(id)} allow="autoplay" tabIndex={-1} aria-hidden />
    </>
  );
}

function MapScreen({ map, analysis, live, problem, code, canListen, onListen, onStop, player }: {
  map: TrackMap | null; analysis: EarsAnalysis | null; live: Live | null; problem: string | null; code: string;
  canListen: boolean; onListen: () => void; onStop: () => void; player: Player | null;
}) {
  // F6: the reference plays from a section's start in the hidden player (only once the map is done).
  const [playing, setPlaying] = useState<number | null>(null);
  const mentorRef = useRef<HTMLElement | null>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [showMentor, setShowMentor] = useState(false);
  const [started, setStarted] = useState(false);
  const [read, setRead] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);

  const listening = !!live;
  const shown = listening ? live.map : map;
  const done = !listening && !!map;
  const empty = !listening && !map;
  const bpm = shown?.bpm ?? analysis?.bpm ?? 0;
  const origin = shown?.originSec ?? 0;
  const durationSec = live?.durationSec || map?.durationSec || (analysis?.durationMs ?? 0) / 1000;
  const bars = map && !listening ? map.bars : bpm ? Math.max(1, Math.round(((durationSec - origin) * bpm) / 240)) : 0;
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
  const reason = empty ? "Map the track first" : listening ? "Ready when the whole track has played" : undefined;
  const barTime = (bar: number) => clock(origin + ((bar - 1) * 240) / Math.max(1, bpm));
  const secText = (x: ViewSection) => `${x.name} · bars ${x.from}–${x.to - 1} · ${barTime(x.from)}–${barTime(x.to)}`;
  const spanText = (name: string, b: Block) => `${name} · bars ${b.from}–${b.to - 1} · ${b.level} (estimate)`;

  const ask = async (more: boolean) => {
    if (!analysis) return;
    if (more) setMentor((m) => (m?.is === "answer" ? { ...m, asking: true } : m));
    else setMentor({ is: "asking" });
    try {
      const reply = await mentorApi(code).ask({
        job: "chat", track: analysis,
        message: more
          ? `Tell me more about how "${title}" is built: one level deeper, how I'd copy that structure in the Studio.`
          : `Teach me how "${title}" is built: what its map shows, and what those sections do and why producers use them.`,
      });
      const text = reply.answer.sentences.map((x) => x.text).join(" ");
      setMentor((m) => more && m?.is === "answer" ? { is: "answer", text: `${m.text} ${text}`, more: false } : { is: "answer", text, more: reply.answer.tellMore });
    } catch (e) {
      setMentor({ is: "error", text: e instanceof Error ? e.message : "The Mentor couldn't answer." });
    }
  };
  // F5: the answer sits under the map; bring it into view when it arrives.
  useEffect(() => {
    if (mentor?.is === "answer" || mentor?.is === "error") mentorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [mentor]);
  useEffect(() => () => player?.pause(), [player]);
  const play = (i: number, x: ViewSection) => {
    if (!done || !player) return;
    if (playing === i) { player.pause(); setPlaying(null); return; }
    setPlaying(i);
    player.seekAndPlay(Math.max(0, x.startSec) * 1000).catch(() => setPlaying(null));
  };
  const stopPlaying = () => { player?.pause(); setPlaying(null); };
  const toggleMentor = () => {
    const next = !showMentor;
    setShowMentor(next);
    if (next && !mentor) ask(false);
  };
  const start = () => {
    if (!map) return;
    setStarted(true);
    try { localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(templateDraft(map))); } catch { /* storage blocked */ }
    location.href = "/";
  };

  return (
    <div className={s.root} onKeyDown={(e) => { if (e.key === "Escape") { setSel(null); setRead(null); } }}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}><SettingsLink /></div>
      </header>

      <div className={s.head}>
        <a className={s.back} href="/analyse">← Analyse</a>
        <div className={s.title}>
          <h1 title={title}>{title}</h1>
          <p>
            <span className={s.uploader} title={uploader}>{uploader}</span>
            <span className={s.facts}>
              {uploader ? <span className={s.sep} aria-hidden>·</span> : null}
              {[bpm ? `${Math.round(bpm * 10) / 10} BPM` : "", key, durationSec ? clock(durationSec) : "", !empty && bars ? `${bars} bars` : ""].filter(Boolean).join(" · ")}
            </span>
          </p>
        </div>
        <div className={s.actions}>
          {reason && <span id="why" className={s.srOnly}>{reason}</span>}
          {started && map && <span className={s.done} aria-live="polite">Opening a new Studio track: {Math.round(map.bpm * 10) / 10} BPM, {key}, {map.bars} bars, {plural(map.sections.length, "marker")}…</span>}
          {listening ? <button className={s.textBtn} onClick={onStop}>Stop listening</button> : null}
          <span title={reason ?? (!analysis ? "Analyse the track first" : undefined)}>
            <button className={s.textBtn} disabled={!done || !analysis} aria-describedby={reason ? "why" : undefined} aria-expanded={showMentor} onClick={toggleMentor}>
              {showMentor ? "Hide explanation" : "Explain the structure"}
            </button>
          </span>
          <span title={reason}>
            <button className={s.start} disabled={!done || started} aria-describedby={reason ? "why" : undefined} onClick={start}>
              Start a track from this
            </button>
          </span>
        </div>
      </div>

      {!empty && <div className={s.info}>
        <span className={s.read} aria-live="polite">
          {problem ? <span className={s.problem}>{problem}</span> : playing !== null && sections[playing]
            ? <>Playing {sections[playing].name.toLowerCase()} from bar {sections[playing].from} <button className={s.textBtn} onClick={stopPlaying}>Stop</button></>
            : read}
        </span>
        <span className={s.note}><i className={s.hatchKey} aria-hidden /> maybe <span className={s.sep} aria-hidden>·</span> Layers are estimates from the sound, not stems.</span>
      </div>}

      <div className={s.grid} style={{ "--step": `${(st / Math.max(1, bars)) * 100}%` } as React.CSSProperties} onMouseLeave={() => setRead(sel === null || !sections[sel] ? null : secText(sections[sel]))}>
        <div className={s.corner} title="Estimated from the sound, not stems">Layers</div>
        <div className={s.ruler}>
          {sections.map((x, i) => {
            // Hidden (shown on hover/focus) when the name would not fit; never elided.
            const narrow = ((x.to - x.from) / Math.max(1, bars)) * RULER_PX < x.name.length * 7 + 16;
            return (
              <button
                key={i}
                className={narrow ? `${s.sec} ${s.narrow}` : s.sec}
                style={{ left: pct(x.from), width: w(x.from, x.to) }}
                aria-pressed={sel === i}
                aria-label={secText(x)}
                onMouseEnter={() => setRead(secText(x))}
                onFocus={() => setRead(secText(x))}
                onClick={() => { setSel(sel === i ? null : i); setRead(secText(x)); play(i, x); }}
              >
                <span>{x.name}</span>
              </button>
            );
          })}
          {listening && <span className={s.unheard} style={{ left: pct(heard + 1) }} />}
          {listening && (
            <span className={s.here} style={{ left: shown ? pct(heard + 1) : 0 }} role="status">
              {shown && bpm ? `bar ${heard} · ` : "Finding the beat… · "}{clock(leftSec)} left
            </span>
          )}
          {nums.map((b) => <span key={b} className={s.num} style={{ left: pct(b) }}>{b}</span>)}
          {lines.map((b) => <i key={b} className={s.secLine} style={{ left: pct(b) }} />)}
        </div>
        {(layers.length ? layers : viewLayers({ layers: { kind: "estimate", method: "", kick: [], bass: [], chords: [], hats: [], vocals: [] } })).map((l) => {
          const blocks = clip(l.blocks);
          return (
            <Fragment key={l.id}>
              <div className={s.lh} style={{ "--c": l.color } as React.CSSProperties}>{l.name}</div>
              <div className={s.lane}>
                {lines.map((b) => <i key={b} className={s.secLine} style={{ left: pct(b) }} />)}
                {sel !== null && sections[sel] && <i className={s.selCol} style={{ left: pct(sections[sel].from), width: w(sections[sel].from, sections[sel].to) }} />}
                {blocks.map((b, i) => (
                  <span
                    key={i}
                    tabIndex={0}
                    role="img"
                    aria-label={spanText(l.name, b)}
                    className={b.level === "maybe" ? `${s.block} ${s.maybe}` : s.block}
                    style={{ left: pct(b.from), width: w(b.from, b.to), "--c": l.color } as React.CSSProperties}
                    onMouseEnter={() => setRead(spanText(l.name, b))}
                    onFocus={() => setRead(spanText(l.name, b))}
                  />
                ))}
                {done && blocks.length === 0 && <span className={s.none}>Not heard in this track</span>}
                {listening && <span className={s.unheard} style={{ left: pct(heard + 1) }} />}
              </div>
            </Fragment>
          );
        })}
        {listening && !shown && (
          <div className={s.empty}>
            <p>Finding the beat… The map draws in as soon as Ears has the tempo.</p>
          </div>
        )}
        {empty && (
          <div className={s.empty}>
            <h2>Not mapped yet</h2>
            <p>Play the whole track; the map fills in as it plays.</p>
            {problem ? <p className={s.problem} role="alert">{problem}</p> : null}
            <button className={s.start} onClick={onListen} disabled={!canListen}>Listen and map</button>
          </div>
        )}
      </div>
      {showMentor && mentor && (
        <section ref={mentorRef} className={s.mentor} aria-label="Mentor" aria-live="polite">
          {mentor.is === "asking" ? <p className={s.quietLine}>Asking the Mentor…</p> : null}
          {mentor.is === "error" ? <p className={s.problem}>{mentor.text}</p> : null}
          {mentor.is === "answer" ? (
            <p>
              {mentor.text}
              {mentor.asking ? <span className={s.quietLine}> …</span> : mentor.more ? <> <button className={s.textBtn} onClick={() => ask(true)}>Tell me more</button></> : null}
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
