"use client";

// The Lab, Listen mode (S1, jobs 1–2; design lab-handoff.md, decisions L153–L179, T81–T90): the
// arrangement map of a saved track, played as four separated parts. The first Play opens the Deck
// (SoundCloud in a small window) and asks Chrome to share it (L178, L179); after that Play just
// plays. Seek, loop a section from memory (L161), hear only / mute parts (L177), chords estimated
// as you listen. Everything audio lives in LabTransport (src/lib/lab/transport.ts); nothing of the
// original is stored or sent (L143). Graders: window.__sixamLab; ?quiet=1 silences the output.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import type { EarsAnalysis } from "@/lib/ears/results";
import { LiveError, PART_NAMES, type PartName } from "@/lib/lab/live";
import { barToMs, loopBars, msToBar } from "@/lib/lab/timing";
import { LabTransport, type TransportState } from "@/lib/lab/transport";
import { clockMs, labParts, labSections, sectionAt, type LabSection } from "@/lib/lab/view";
import type { TrackMap } from "@/lib/map/types";
import { mentorApi } from "@/lib/mentor/client";
import { HearChip, Lanes, heardParts, type Hear } from "./lanes";
import s from "./lab.module.css";

declare global {
  interface Window { __sixamLab?: { state: () => TransportState | null; heardMs: () => number; bar: () => number; hear: () => Hear } }
}

type Mode = "listen" | "make";
const FIRST_LINE = "To split the parts, Six AM plays the song again from SoundCloud in a small window. It never keeps the audio.";

function problemText(e: unknown): string {
  if (e instanceof LiveError) {
    if (e.reason === "cancelled") return "Chrome didn't share the Deck. Press Play and pick “Six AM Deck” in Chrome's dialog.";
    if (e.reason === "hidden") return "Come back to this tab, then press Play.";
    return e.message;
  }
  return `The part splitter couldn't start: ${e instanceof Error ? e.message : String(e)}`;
}

export function LabView({ map, analysis, code, quiet }: { map: TrackMap; analysis: EarsAnalysis | null; code: string; quiet: boolean }) {
  const parts = useMemo(() => labParts(map), [map]);
  const sections = useMemo(() => labSections(map), [map]);
  const bars = map.bars;
  const bpm = map.bpm, origin = map.originSec;
  const tr = useRef<LabTransport | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [ts, setTs] = useState<TransportState | null>(null);
  const [chords, setChords] = useState<(string | null)[]>(() => map.chords ?? Array.from({ length: Math.ceil(bars / 8) }, () => null));
  const [hear, setHear] = useState<Hear>({ kind: "all" });
  const [focus, setFocus] = useState<PartName>("bass"); // T87: the last part heard "only"
  const [mode, setMode] = useState<Mode>(() => (typeof location !== "undefined" && new URLSearchParams(location.search).get("mode") === "make" ? "make" : "listen"));
  const [problem, setProblem] = useState<string | null>(null);
  const [pos, setPos] = useState({ sec: 0, bar: 1 });
  const hearRef = useRef(hear);
  useEffect(() => { hearRef.current = hear; }, [hear]);

  // One transport per page: the Deck link, the separator and the loop's memory. Gone on leave.
  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    const t = new LabTransport({
      url: map.id, bpm, originSec: origin, bars, durationMs: map.durationSec * 1000, knownChords: map.chords, quiet, deckPath: "/deck",
      onChange: setTs,
      onChords: (cells) => {
        setChords(cells);
        // Chord NAMES only go onto the saved map (L165), a few seconds after they change.
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { mentorApi(code).putMap({ ...map, chords: cells }).catch(() => {}); }, 8000);
      },
    });
    tr.current = t;
    let raf = 0, lastSec = -1, lastBar = -1;
    const frame = () => {
      const ms = t.heardMs();
      const b = Math.min(bars + 0.999, Math.max(1, msToBar(ms, bpm, origin)));
      grid.current?.style.setProperty("--ph", `${((b - 1) / bars) * 100}%`);
      const sec = Math.floor(ms / 1000), bi = Math.floor(b);
      if (sec !== lastSec || bi !== lastBar) { lastSec = sec; lastBar = bi; setPos({ sec, bar: bi }); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.__sixamLab = { state: () => tr.current?.state ?? null, heardMs: () => t.heardMs(), bar: () => msToBar(t.heardMs(), bpm, origin), hear: () => hearRef.current };
    return () => { cancelAnimationFrame(raf); clearTimeout(saveTimer); t.dispose(); tr.current = null; };
  }, [map, bpm, origin, bars, code, quiet]);

  // What you hear → the part gains (again once the parts start playing).
  const phase = ts?.phase;
  useEffect(() => { tr.current?.setParts(heardParts(hear, [...PART_NAMES])); }, [hear, phase]);

  const onPlay = useCallback(() => {
    const t = tr.current;
    if (!t) return;
    const st = t.state;
    if (st.phase === "ready") { if (st.playing) t.pause(); else t.play(); return; }
    if (st.phase === "starting") return;
    setProblem(null);
    t.openDeckAndListen().catch((e) => setProblem(problemText(e)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== " " || e.repeat || el.closest("button, input, textarea, select, [role=slider]")) return;
      e.preventDefault();
      onPlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlay]);

  const onOnly = useCallback((id: PartName) => {
    const cur = hear.kind === "only" ? hear.parts : [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setHear(next.length ? { kind: "only", parts: next } : { kind: "all" });
    if (!cur.includes(id)) setFocus(id); // the focus part is the last part heard "only" (T87)
  }, [hear]);
  const onMute = useCallback((id: PartName) => {
    setHear((h) => {
      const cur = h.kind === "mute" ? h.parts : [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return next.length ? { kind: "mute", parts: next } : { kind: "all" };
    });
  }, []);
  const onSeek = useCallback((bar: number) => { tr.current?.seek(barToMs(bar, bpm, origin)); }, [bpm, origin]);

  const loop = ts?.loop ? { from: Math.round(msToBar(ts.loop.startMs, bpm, origin)), to: Math.round(msToBar(ts.loop.endMs, bpm, origin)) } : null;
  const onLoop = useCallback((x: LabSection) => {
    const t = tr.current;
    if (!t) return;
    const l = t.state.loop;
    const from = l ? Math.round(msToBar(l.startMs, bpm, origin)) : null;
    if (from !== null && from >= x.from && from < x.to) { t.setLoop(null); return; } // the same section again: stop
    const r = loopBars({ from: x.from, to: x.to }, msToBar(t.heardMs(), bpm, origin));
    t.setLoop({ startMs: barToMs(r.from, bpm, origin), endMs: barToMs(r.to, bpm, origin) });
  }, [bpm, origin]);

  const go = (m: Mode) => {
    setMode(m);
    const url = new URL(location.href);
    url.searchParams.set("mode", m);
    history.replaceState(null, "", url);
  };

  const title = analysis?.title || map.title || "Untitled";
  const artist = analysis?.uploader || map.uploader;
  const key = map.key || analysis?.key ? `${map.key || analysis!.key} ${map.scale || analysis!.scale}` : "";
  const bpmText = `${Math.round(bpm * 10) / 10}`;
  const facts = [`${bpmText} BPM`, key ? `key ${key}` : ""].filter(Boolean).join(" · ");
  const ready = ts?.phase === "ready";
  const starting = ts?.phase === "starting";
  const model = ts?.model;
  const loading = starting && !!model && !model.ready;
  const pctLoaded = model && model.total ? Math.floor((model.loaded / model.total) * 100) : 0;
  const status = loading
    ? `Getting ready… ${model!.downloading ? `${pctLoaded}%` : ""}${model!.downloading && model!.etaS !== null && model!.etaS > 3 ? ` · first time only, about ${Math.round(model!.etaS)} s` : ""}`
    : ts?.catching ? "catching up…" : "";
  const here = sectionAt(sections, pos.bar);
  const loopSec = loop ? sectionAt(sections, loop.from) : null;
  const deckText = ready ? "Deck on" : starting ? "Deck opening…" : "Deck off";

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
          <p className={s.facts1} title={[artist, facts].filter(Boolean).join(" · ")}>
            {artist ? <span className={s.artist}>{artist}</span> : null}
            <span>{artist ? <>&nbsp;· </> : null}{facts}</span>
          </p>
        </div>
        <div className={s.actions}>
          <div className={s.transport}>
            <button className={s.play} onClick={onPlay} disabled={starting} aria-label={ts?.playing ? "Pause" : "Play"}>{ts?.playing ? "❚❚" : "▶"}</button>
            <HearChip hear={hear} parts={parts} onClear={() => setHear({ kind: "all" })} />
            <span className={s.clock}>{clockMs(pos.sec * 1000)}{here ? ` · in ${here.label}` : ""} <small>bar {pos.bar}</small></span>
            <span className={s.status} aria-live="polite">{status}</span>
            {loop && ts?.loop && (
              <span className={s.loopChip}>
                Looping {loopSec?.label ?? "section"} · {clockMs(ts.loop.startMs)}–{clockMs(ts.loop.endMs)}
                <button className={s.x} onClick={() => tr.current?.setLoop(null)} aria-label={`Stop looping ${loopSec?.label ?? "the section"}`}>×</button>
              </span>
            )}
          </div>
          <div className={s.switch} role="group" aria-label="Mode">
            <button aria-pressed={mode === "listen"} onClick={() => go("listen")}>Listen</button>
            <button aria-pressed={mode === "make"} onClick={() => go("make")}>Make</button>
          </div>
          <span className={s.deck} title="SoundCloud plays in the small Six AM Deck window; you hear the parts here">
            <i className={ready ? s.dot : s.dotOff} aria-hidden />
            <span className={s.muted}>{deckText}</span>
          </span>
        </div>
      </div>
      {loading && <div className={s.progress}><i style={{ width: `${model!.downloading ? pctLoaded : 100}%` }} /></div>}
      {problem ? <p className={s.alertLine} role="alert">{problem}</p>
        : starting ? <p className={s.firstLine} role="status">{FIRST_LINE}</p> : null}
      {mode === "listen" ? (
        <div ref={grid} style={{ display: "contents" }}>
          <Lanes bars={bars} sections={sections} parts={parts} chords={chords} hear={hear} focus={focus}
            onOnly={onOnly} onMute={onMute} onSeek={onSeek} bar={pos.bar} loop={loop} onLoop={onLoop}
            catching={!!ts?.catching} dimmed={!ready} />
        </div>
      ) : (
        <div className={s.soon}>
          <div>
            <h2>Make</h2>
            <p>Your own {parts.find((p) => p.id === focus)?.name.toLowerCase()} beside the looping part comes in the next build.<br />Listen keeps playing meanwhile.</p>
          </div>
        </div>
      )}
    </div>
  );
}
