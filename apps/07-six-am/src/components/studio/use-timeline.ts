"use client";

// The studio's behaviour: editing with undo, dragging from the crate, moving and repeating
// blocks, mute, the transport and the filter knob. The edit rules live in @/lib/timeline.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  docBars, type Doc, type Loop, type Region,
  loopById, newId, place, registerSounds, silentLanes, snapBar, snapLength,
} from "@/lib/timeline";
import type { Sound } from "@/lib/synths/loop";
import type { Scale } from "@/lib/synths/theory";
import type { AudioEngine } from "./audio";

type Drag =
  | { type: "new"; loop: Loop; x: number; y: number; bar: number | null }
  | { type: "move"; id: string; start: number; offset: number; overBin: boolean }
  | { type: "resize"; id: string; length: number };

const THRESHOLD = 4;
const HOLD_MS = 250; // press and hold a block this long and the bin appears

/** One open track. `initial` is the saved arrangement; Studio remounts this per track. `bpm` is the project tempo. */
export function useTimeline(initial: Doc, bpm: number, startBar = 37) {
  const [doc, setDoc] = useState<Doc>(initial);
  const [past, setPast] = useState<Doc[]>([]);
  const docRef = useRef(doc);
  // The track's own sounds draw like crate loops (add-only registry, see timeline.ts).
  registerSounds(doc.sounds);
  // A synth's key: the track's (a template copies the reference's), else the crate's A minor.
  const key = doc.key?.key ?? "A";
  const scale: Scale = doc.key?.scale === "major" ? "major" : "minor";
  // The track's length: 64 bars, or a template's own (S2). It never changes while the track is open.
  // shortcut: every bar is squeezed into the lanes' width (a 200-bar template gets ~6 px bars); add
  // horizontal scroll or zoom when the map view's design lands.
  const bars = docBars(initial);

  const [playing, setPlaying] = useState(false);
  // The demo track opens mid-song (bar 37); a Mentor starting point opens at bar 1 (user test F3).
  const [playhead, setPlayhead] = useState(startBar);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [group, setGroup] = useState(1);
  const [filter, setFilter] = useState(1);
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d); };

  const lanesRef = useRef<HTMLDivElement | null>(null);
  const [pxPerBar, setPxPerBar] = useState(14);
  const ppbRef = useRef(pxPerBar);

  useEffect(() => {
    const el = lanesRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPxPerBar(el.clientWidth / bars));
    ro.observe(el);
    return () => ro.disconnect();
  }, [bars]);

  // Edits that come in a stream (a knob being dragged) share one undo step: same `merge` key, one entry.
  const lastMerge = useRef<string | null>(null);
  const commit = useCallback((next: Doc, merge?: string) => {
    const prev = docRef.current;
    if (!merge || merge !== lastMerge.current) setPast((p) => [...p.slice(-49), prev]);
    lastMerge.current = merge ?? null;
    docRef.current = next;
    setDoc(next);
  }, []);

  const pastRef = useRef(past);
  // Handlers read the latest values through refs, synced after each render.
  useLayoutEffect(() => { docRef.current = doc; pastRef.current = past; ppbRef.current = pxPerBar; });
  const undo = useCallback(() => {
    const p = pastRef.current;
    if (!p.length) return;
    setDoc(p[p.length - 1]);
    setPast(p.slice(0, -1));
  }, []);

  const toggleMute = useCallback((track: number) => {
    const d = docRef.current;
    commit({ ...d, muted: d.muted.map((m, i) => (i === track ? !m : m)) });
  }, [commit]);

  /** L140: solo a lane (several may be); saved with the track, undoable like mute. */
  const toggleSolo = useCallback((track: number) => {
    const { soloed, ...d } = docRef.current;
    const next = d.muted.map((_, i) => (i === track ? !soloed?.[i] : !!soloed?.[i]));
    commit(next.some(Boolean) ? { ...d, soloed: next } : d);
  }, [commit]);

  const remove = useCallback((id: string) => {
    const d = docRef.current;
    commit({ ...d, regions: d.regions.filter((r) => r.id !== id) });
    setSelected(null);
  }, [commit]);

  // Sound: the engine is loaded in the browser only (Tone.js needs Web Audio), on first use.
  const engineRef = useRef<Promise<AudioEngine> | null>(null);
  const engine = useCallback(() => (engineRef.current ??= import("./audio").then((m) => new m.AudioEngine())), []);
  const playheadRef = useRef(playhead);
  useLayoutEffect(() => { playheadRef.current = playhead; });

  useEffect(() => { engine().then((e) => { e.setBars(bars); e.setRegions(doc.regions); }); }, [engine, doc.regions, bars]);
  // The engine only knows "silent": solo (L140) decides over mute.
  const silent = silentLanes(doc);
  const silentKey = silent.join();
  useEffect(() => { engine().then((e) => e.setMuted(silentKey.split(",").map((x) => x === "true"))); }, [engine, silentKey]);
  useEffect(() => { engine().then((e) => e.setFilter(filter)); }, [engine, filter]);
  useEffect(() => { engine().then((e) => e.setPreview(preview)); }, [engine, preview]);
  useEffect(() => { engine().then((e) => e.setTempo(bpm)); }, [engine, bpm]);
  // Sounds before regions: the regions' sound index is built from them.
  useEffect(() => { engine().then((e) => e.setSounds(doc.sounds ?? [])); }, [engine, doc.sounds]);
  useEffect(() => { engine().then((e) => e.setKey(key, scale)); }, [engine, key, scale]);

  /** The sound drawer's Listen: loop one sound alone (null stops). Stops the crate preview. */
  const [previewSound, setPreviewSoundState] = useState<Sound | null>(null);
  const setPreviewSound = useCallback((x: Sound | null) => {
    setPreviewSoundState(x);
    if (x) setPreview(null);
    engine().then((e) => e.setPreviewSound(x));
  }, [engine]);

  /** Add a sound to its lane at `bar` (one pass long, overwriting what's there) and select it. */
  const addSound = useCallback((x: Sound, bar: number) => {
    const d = docRef.current, lb = x.bars;
    registerSounds([x]);
    const start = Math.min(Math.max(1, Math.floor(bar)), Math.max(1, bars - lb + 1));
    const r: Region = { id: newId(), loopId: x.id, track: x.lane, start, length: lb };
    commit({ ...d, sounds: [...(d.sounds ?? []), x], regions: place(d.regions, r) });
    setSelected(r.id);
    return r;
  }, [commit, bars]);

  /** Change a sound everywhere it plays (knobs live; a knob drag is one undo step). */
  const updateSound = useCallback((x: Sound, merge?: string) => {
    const d = docRef.current;
    registerSounds([x]);
    commit({ ...d, sounds: (d.sounds ?? []).map((o) => (o.id === x.id ? x : o)) }, merge);
  }, [commit]);

  // Transport: the music runs on the audio clock; the playhead just reads where it is.
  useEffect(() => {
    let raf = 0, live = true;
    engine().then((e) => {
      if (!live) return;
      if (!playing) { e.stop(); return; }
      e.playFrom(playheadRef.current);
      const tick = () => {
        const bar = e.position();
        if (bar !== null) setPlayhead(bar);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => { live = false; cancelAnimationFrame(raf); };
  }, [engine, playing]);

  /** Move the playhead; while playing, the music jumps there too. */
  const playingRef = useRef(playing);
  useLayoutEffect(() => { playingRef.current = playing; });
  const jumpTo = useCallback((bar: number) => {
    setPlayhead(bar);
    playheadRef.current = bar;
    if (playingRef.current) engine().then((e) => e.playFrom(bar));
  }, [engine]);

  const laneX = (clientX: number) => clientX - (lanesRef.current?.getBoundingClientRect().left ?? 0);

  // Pointer helpers: a press becomes a drag only after a few pixels, so clicks still click.
  const track = (e: React.PointerEvent, onMove: (ev: PointerEvent, moved: boolean) => void, onUp: (ev: PointerEvent, moved: boolean) => void) => {
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const mv = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < THRESHOLD) return;
      moved = true;
      onMove(ev, moved);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      onUp(ev, moved);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };

  /** Spread onto a crate item: click previews, drag drops it onto its own track. */
  const crateItem = (loop: Loop) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      track(e, (ev) => {
        const lane = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
        const onOwnTrack = lane && Number(lane.dataset.track) === loop.track;
        const bar = onOwnTrack ? snapBar(laneX(ev.clientX) - (loop.bars * ppbRef.current) / 2, ppbRef.current, loop.bars, bars) : null;
        setDrag({ type: "new", loop, x: ev.clientX, y: ev.clientY, bar });
      }, (_ev, moved) => {
        if (!moved) { setPreviewSound(null); setPreview((p) => (p === loop.id ? null : loop.id)); return; }
        const d = dragRef.current;
        if (d?.type === "new" && d.bar !== null) {
          const r: Region = { id: newId(), loopId: loop.id, track: loop.track, start: d.bar, length: loop.bars };
          commit({ ...docRef.current, regions: place(docRef.current.regions, r) });
          setSelected(r.id);
        }
        setDrag(null);
      });
    },
  });

  /** Spread onto a block: click selects, drag moves along its track, drop on the bin removes it.
   *  The bin appears once you hold the block or start dragging it (owner, feedback 8). */
  const blockBody = (r: Region) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      setSelected(r.id);
      const offset = laneX(e.clientX) - (r.start - 1) * ppbRef.current;
      const hold = setTimeout(() => setDrag({ type: "move", id: r.id, offset, start: r.start, overBin: false }), HOLD_MS);
      track(e, (ev) => {
        clearTimeout(hold);
        const overBin = !!(document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest("[data-bin]");
        // Over the bin, the block stays put; elsewhere it follows along its track.
        const start = overBin ? r.start : snapBar(laneX(ev.clientX) - offset, ppbRef.current, r.length, bars);
        setDrag({ type: "move", id: r.id, offset, start, overBin });
      }, () => {
        clearTimeout(hold);
        const d = dragRef.current;
        if (d?.type === "move" && d.overBin) remove(r.id);
        else if (d?.type === "move" && d.start !== r.start) {
          commit({ ...docRef.current, regions: place(docRef.current.regions, { ...r, start: d.start }) });
        }
        setDrag(null);
      });
    },
  });

  /** Spread onto a block's right edge: drag repeats the loop in whole lengths. */
  const blockGrip = (r: Region) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      setSelected(r.id);
      const lb = loopById(r.loopId).bars;
      track(e, (ev) => {
        const w = laneX(ev.clientX) - (r.start - 1) * ppbRef.current;
        setDrag({ type: "resize", id: r.id, length: snapLength(w, ppbRef.current, lb, r.start, bars) });
      }, (_ev, moved) => {
        if (!moved) return;
        const d = dragRef.current;
        if (d?.type === "resize" && d.length !== r.length) {
          commit({ ...docRef.current, regions: place(docRef.current.regions, { ...r, length: d.length }) });
        }
        setDrag(null);
      });
    },
  });

  /** Spread onto the ruler: click or drag sets where play starts. */
  const ruler = {
    onPointerDown: (e: React.PointerEvent) => {
      const set = (x: number) => jumpTo(Math.min(Math.max(Math.floor(x / ppbRef.current) + 1, 1), bars));
      set(laneX(e.clientX));
      track(e, (ev) => set(laneX(ev.clientX)), () => {});
    },
  };

  /** Spread onto a knob: drag up or down to turn it. */
  const knob = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      const sy = e.clientY, start = filter;
      track(e, (ev) => setFilter(Math.min(1, Math.max(0, start + (sy - ev.clientY) / 160))), () => {});
    },
  };

  // Keyboard: space plays, Delete removes, M mutes the selected block's track, ⌘Z undoes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selected) { e.preventDefault(); remove(selected); }
      else if (e.key.toLowerCase() === "m" && selected) {
        const r = docRef.current.regions.find((x) => x.id === selected);
        if (r) toggleMute(r.track);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, undo, remove, toggleMute]);

  // What to draw: the committed track with any drag in progress applied on top.
  const regions = doc.regions.map((r) => {
    if (drag?.type === "move" && drag.id === r.id) return { ...r, start: drag.start };
    if (drag?.type === "resize" && drag.id === r.id) return { ...r, length: drag.length };
    return r;
  });
  const ghost = drag?.type === "new" ? drag : null;
  const bin = drag?.type === "move" ? { id: drag.id, over: drag.overBin } : null;
  const inTrack = new Set(doc.regions.map((r) => r.loopId));
  const sounding = silent.map((m, t) => !m && regions.some((r) => r.track === t && playhead >= r.start && playhead < r.start + r.length));
  const bar = Math.floor(playhead), beat = Math.floor((playhead - bar) * 4) + 1;

  return {
    doc, bars, key, scale, engine, previewSound, setPreviewSound, addSound, updateSound, markers: initial.markers ?? [], regions, playing, setPlaying, playhead, jumpTo, bar, beat, selected, setSelected,
    preview, setPreview, group, setGroup, filter, ghost, bin, inTrack, sounding, pxPerBar, lanesRef,
    canUndo: past.length > 0, undo, toggleMute, toggleSolo, silent, remove,
    crateItem, blockBody, blockGrip, ruler, knob,
  };
}

export type Timeline = ReturnType<typeof useTimeline>;
