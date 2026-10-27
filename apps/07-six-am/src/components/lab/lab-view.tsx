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
import { ApiError, mentorApi, money } from "@/lib/mentor/client";
import { HEARD_WINDOW, knowsLine, PART_LABEL, type LabAsk } from "@/lib/mentor/lab";
import { HATS_ROW, KICK_ROW, referenceDb } from "@/lib/lab/activity";
import { measurePart } from "@/lib/lab/measure";
import { HearChip, Lanes, heardParts, type Hear } from "./lanes";
import { LabNotes, type LabTurn } from "./lab-notes";
import { MakeRoom, useMake, type MakeModel } from "./make-room";
import s from "./lab.module.css";

declare global {
  interface Window { __sixamLab?: { state: () => TransportState | null; heardMs: () => number; bar: () => number; hear: () => Hear; levels: () => number[]; barLevels: () => (number | null)[][]; mineLevel: () => number; make: () => ReturnType<MakeModel["debug"]> | null; setLoop: (startMs: number, endMs: number) => void; weight: () => ReturnType<LabTransport["weight"]>; capture: (onsets: number[]) => ReturnType<LabTransport["capture"]> } }
}

type Mode = "listen" | "make";
/** Where you were in this track, for a reload (LS1-8): a position only, per tab. */
const POS_KEY = (id: string) => `07-six-am:lab-pos:${id}`;
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
  const [levels, setLevels] = useState<(number | null)[][] | null>(() => map.partLevels ?? null);
  const [hear, setHear] = useState<Hear>({ kind: "all" });
  const [focus, setFocus] = useState<PartName>("bass"); // T87: the last part heard "only"
  const [mode, setMode] = useState<Mode>(() => (typeof location !== "undefined" && new URLSearchParams(location.search).get("mode") === "make" ? "make" : "listen"));
  const [problem, setProblem] = useState<string | null>(null);
  const [pos, setPos] = useState({ sec: 0, bar: 1 });
  // S2: the Mentor's notes on this track (every part), the open dot and a new question's bar.
  const [turns, setTurns] = useState<(LabTurn & { part: PartName })[]>([]);
  const [openBar, setOpenBar] = useState<number | null>(null);
  const [asking, setAsking] = useState<number | null>(null);
  const [usageNote, setUsageNote] = useState<string | null>(null);
  const hearRef = useRef(hear);
  useEffect(() => { hearRef.current = hear; }, [hear]);
  const makeRef = useRef<MakeModel | null>(null);

  // One transport per page: the Deck link, the separator and the loop's memory. Gone on leave.
  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    // Chord names and part levels (numbers only, L181, LS1-N1) go onto the saved map together, a
    // few seconds after they change.
    const saved = { chords: map.chords, partLevels: map.partLevels };
    const save = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { mentorApi(code).putMap({ ...map, ...saved }).catch(() => {}); }, 8000);
    };
    const t = new LabTransport({
      url: map.id, bpm, originSec: origin, bars, durationMs: map.durationSec * 1000, knownChords: map.chords, knownLevels: map.partLevels, quiet, deckPath: "/deck",
      onChange: setTs,
      onChords: (cells) => { setChords(cells); saved.chords = cells; save(); },
      onLevels: (lv) => { setLevels(lv); saved.partLevels = lv; save(); },
    });
    tr.current = t;
    try { const saved = Number(sessionStorage.getItem(POS_KEY(map.id))); if (saved > 0) t.seek(saved); } catch { /* storage blocked */ }
    let raf = 0, lastSec = -1, lastBar = -1;
    const frame = () => {
      const ms = t.heardMs();
      const b = Math.min(bars + 0.999, Math.max(1, msToBar(ms, bpm, origin)));
      grid.current?.style.setProperty("--ph", `${((b - 1) / bars) * 100}%`);
      const sec = Math.floor(ms / 1000), bi = Math.floor(b);
      if (sec !== lastSec || bi !== lastBar) {
        lastSec = sec; lastBar = bi; setPos({ sec, bar: bi });
        try { sessionStorage.setItem(POS_KEY(map.id), String(Math.round(ms))); } catch { /* storage blocked */ }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.__sixamLab = { state: () => tr.current?.state ?? null, heardMs: () => t.heardMs(), bar: () => msToBar(t.heardMs(), bpm, origin), hear: () => hearRef.current, levels: () => t.partLevels(), barLevels: () => t.levels(), mineLevel: () => t.mineLevel(), make: () => makeRef.current?.debug() ?? null, setLoop: (startMs: number, endMs: number) => t.setLoop({ startMs, endMs }), weight: () => t.weight(), capture: (onsets: number[]) => t.capture(onsets) };
    return () => { cancelAnimationFrame(raf); clearTimeout(saveTimer); t.dispose(); tr.current = null; };
  }, [map, bpm, origin, bars, code, quiet]);

  // S3 Make: the same transport, the same loop; Make's own state survives the switch (T87).
  const title = analysis?.title || map.title || "Untitled";
  const make = useMake({
    tr, active: mode === "make", focus, loop: ts?.loop ?? null, bpm, code, title, url: map.id,
    keyName: map.key || analysis?.key || "", scale: map.scale || analysis?.scale || "",
  });
  useEffect(() => { makeRef.current = make; });

  // What you hear → the part gains (again once the parts start playing). Make plays the focus part
  // alone (A) or Mine (B), with its own A/B, the drums under both when on (L213); the Hear bar is
  // Listen only (T87).
  const phase = ts?.phase;
  const mineOn = mode === "make" && make.isBass && make.ab === "b" && make.mineReady;
  useEffect(() => {
    const t = tr.current;
    if (!t) return;
    if (mode === "make") t.setParts(PART_NAMES.map((id) => (!mineOn && id === focus) || (make.isBass && make.drums && id === "drums")));
    else t.setParts(heardParts(hear, [...PART_NAMES]));
    t.setMineOn(mineOn);
  }, [hear, phase, mode, focus, mineOn, make.isBass, make.drums]);

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
    if (!cur.includes(id) && id !== focus) { setOpenBar(null); setAsking(null); } // its own dots: close the card
  }, [hear, focus]);
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

  // The track's notes, once (they live in the Mentor's store, so they survive a reload).
  useEffect(() => {
    if (!code) return;
    let live = true;
    mentorApi(code).labNotes(map.id).then((ns) => {
      if (live) setTurns(ns.map((n) => ({ id: n.id, part: n.part, bar: n.bar, q: n.q, answer: n.answer, facts: n.facts, createdAt: n.createdAt })));
    }, () => { /* no notes shown; asking still says what's wrong */ });
    return () => { live = false; };
  }, [code, map.id]);

  /** What the Lab knows right now, for one question (L156): never audio, only these numbers. */
  const labAsk = useCallback((bar: number): LabAsk => {
    const t = tr.current;
    const l = t?.state.loop ?? null;
    const loopB = l ? { from: Math.round(msToBar(l.startMs, bpm, origin)), to: Math.round(msToBar(l.endMs, bpm, origin)) } : null;
    const held = loopB && t ? t.loopPart(PART_NAMES.indexOf(focus)) : null;
    const measure = held && loopB ? measurePart(focus, held, loopB, bpm, map.key || analysis?.key || "", map.scale || analysis?.scale || "") : null;
    // LS2-M3: what the Lab heard of the focus part around the bar (levels only), drums with its bands.
    const rows = t?.levels() ?? null;
    const from = Math.max(1, bar - HEARD_WINDOW), to = Math.min(bars, bar + HEARD_WINDOW);
    const win = (row: (number | null)[] | undefined) => row && row.some((v) => v !== null) ? { from, levels: row.slice(from - 1, to), refDb: referenceDb(row) } : undefined;
    const part = win(rows?.[PART_NAMES.indexOf(focus)]);
    const kick = focus === "drums" ? win(rows?.[KICK_ROW]) : undefined, hats = focus === "drums" ? win(rows?.[HATS_ROW]) : undefined;
    const heard = part ? { part, ...(kick && hats ? { kick, hats } : {}) } : null;
    const inMake = mode === "make" ? make.labMake : null;
    const heardNow: LabAsk["hear"] = mode === "make" ? { kind: "only", parts: [focus] } : hear;
    return { part: focus, hear: heardNow, bar, playheadBar: pos.bar, loop: loopB, chords, measure, heard, ...(inMake ? { make: inMake } : {}) };
  }, [focus, hear, pos.bar, chords, bpm, origin, bars, map.key, map.scale, analysis, mode, make.labMake]);

  const send = useCallback(async (id: string, q: string, bar: number, lab: LabAsk) => {
    try {
      const r = await mentorApi(code).ask({ job: "lab", track: analysis, message: q, lab });
      console.info(`[mentor] lab: ${r.latencyMs} ms at Claude, est. $${r.message.costUsd}`);
      setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, id: r.message.id, answer: r.answer, facts: r.lab?.facts ?? "", error: undefined, createdAt: r.message.createdAt } : x)));
      // The same check-in as the Analyse Mentor (50 questions a day): a line, not a limit.
      setUsageNote(r.usage.warning ? `${r.usage.questionsToday} questions today, about ${money(r.usage.todayUsd)} so far (estimate).` : null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "The Mentor couldn't be reached. Try again.";
      setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, error: msg } : x)));
    }
  }, [code, analysis]);
  const pending = useRef(new Map<string, LabAsk>());
  const onAsk = useCallback((q: string, bar: number) => {
    const id = `pending-${Date.now()}`;
    const lab = labAsk(bar);
    pending.current.set(id, lab);
    setTurns((ts) => [...ts, { id, part: focus, bar, q, answer: null, facts: "", createdAt: new Date().toISOString() }]);
    setAsking(null);
    setOpenBar(bar);
    void send(id, q, bar, lab);
  }, [labAsk, focus, send]);
  const onRetry = useCallback((id: string) => {
    const x = turns.find((t) => t.id === id), lab = pending.current.get(id);
    if (!x || !lab) return;
    setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, error: undefined } : t)));
    void send(id, x.q, x.bar, lab);
  }, [turns, send]);

  /** Loops the section holding the playhead (16-bar cap), without toggling an existing loop off. */
  const loopHere = useCallback(() => {
    const t = tr.current, x = sectionAt(sections, Math.floor(msToBar(t?.heardMs() ?? 0, bpm, origin)));
    if (!t || !x) return;
    const r = loopBars({ from: x.from, to: x.to }, msToBar(t.heardMs(), bpm, origin));
    t.setLoop({ startMs: barToMs(r.from, bpm, origin), endMs: barToMs(r.to, bpm, origin) });
  }, [sections, bpm, origin]);
  // Entering Make on the bass needs the loop in memory: set one on the current section if none.
  useEffect(() => {
    if (mode === "make" && focus === "bass" && tr.current && !tr.current.state.loop) loopHere();
  }, [mode, focus, loopHere]);

  const go = (m: Mode) => {
    setMode(m);
    const url = new URL(location.href);
    url.searchParams.set("mode", m);
    history.replaceState(null, "", url);
  };

  const focusTurns = turns.filter((x) => x.part === focus);
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
    // LS1-N4: a loop's first passes wait at the wrap while the Deck goes back to its start.
    : ts?.catching ? `${ts.loop?.state === "filling" ? "filling the loop…" : "catching up…"}${ts.catchLeftS ? ` ${ts.catchLeftS} s` : ""}` : "";
  const here = sectionAt(sections, pos.bar);
  const heardMsFn = useCallback(() => tr.current?.heardMs() ?? 0, []);
  const loopSec = loop ? sectionAt(sections, loop.from) : null;
  // A long section loops 16 bars of it (L161): say which (LS1-2).
  const loopPart = loop && loopSec && loop.to - loop.from < loopSec.to - loopSec.from
    ? (loop.from === loopSec.from ? ", first 16 bars" : `, bars ${loop.from}–${loop.to - 1}`) : "";
  const deckText = ready ? "Deck on" : starting ? "Deck opening…" : ts?.deckOpen ? "Deck open" : "Deck off";
  const closedLine = ts?.phase === "stopped" && ts.deckClosed ? "Deck closed. Press Play to open it again." : null;

  return (
    <div className={s.root} data-lab-root>
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
            {mode === "listen" && <HearChip hear={hear} parts={parts} onClear={() => setHear({ kind: "all" })} />}
            <span className={s.clock}>{clockMs(pos.sec * 1000)}{here ? ` · in ${here.label}` : ""} <small>bar {pos.bar}</small></span>
            <span className={s.status} aria-live="polite">{status}</span>
            {loop && ts?.loop && (
              <span className={s.loopChip}>
                Looping {loopSec?.label ?? "section"}{loopPart} · {clockMs(ts.loop.startMs)}–{clockMs(ts.loop.endMs)}
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
      {problem || closedLine ? <p className={s.alertLine} role="alert">{problem ?? closedLine}</p>
        : starting ? <p className={s.firstLine} role="status">{FIRST_LINE}</p> : null}
      {mode === "listen" ? (
        <div ref={grid} style={{ display: "contents" }}>
          <Lanes bars={bars} sections={sections} parts={parts} chords={chords} levels={levels} hear={hear} focus={focus}
            onOnly={onOnly} onMute={onMute} onSeek={onSeek} bar={pos.bar} loop={loop} onLoop={onLoop}
            catching={!!ts?.catching} dimmed={!ready}
            overlay={(
              <LabNotes bars={bars} turns={focusTurns} partName={PART_LABEL[focus]} playheadBar={pos.bar}
                openBar={openBar} setOpenBar={setOpenBar} asking={asking} setAsking={setAsking}
                knows={(b) => knowsLine(focus, hear, sectionAt(sections, b)?.label ?? null, b)}
                onAsk={onAsk} onRetry={onRetry} onSeek={onSeek} onMake={() => go("make")}
                lastLane={parts.at(-1)?.id === focus} busy={focusTurns.some((x) => !x.answer && !x.error)} note={usageNote} />
            )} />
        </div>
      ) : (
        <MakeRoom m={make} part={parts.find((x) => x.id === focus)!} loop={ts?.loop ?? null} section={loopSec ?? here} bpm={bpm} originSec={origin}
          chords={chords} levels={levels} heardMs={heardMsFn} status={status} ready={ready} playing={!!ts?.playing}
          bar={pos.bar} turns={focusTurns} onAsk={onAsk} onRetry={onRetry} onSeek={onSeek} onLoopHere={loopHere} onBass={() => setFocus("bass")}
          busy={focusTurns.some((x) => !x.answer && !x.error)} note={usageNote} />
      )}
    </div>
  );
}
