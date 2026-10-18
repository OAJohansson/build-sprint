"use client";

// The studio's behaviour: editing with undo, dragging from the crate, moving and repeating
// blocks, mute, the transport and the filter knob. The edit rules live in @/lib/timeline.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BARS, type Doc, type Loop, type Region,
  demoDoc, loopById, newId, place, snapBar, snapLength,
} from "@/lib/timeline";
import type { AudioEngine } from "./audio";

type Drag =
  | { type: "new"; loop: Loop; x: number; y: number; bar: number | null }
  | { type: "move"; id: string; start: number; offset: number }
  | { type: "resize"; id: string; length: number };

const THRESHOLD = 4;

export function useTimeline() {
  // shortcut: starts from the demo track and isn't saved; move to useLocalStorage (brief requirement 7) in the build.
  const [doc, setDoc] = useState<Doc>(demoDoc);
  const [past, setPast] = useState<Doc[]>([]);
  const docRef = useRef(doc);

  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(37);
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
    const ro = new ResizeObserver(() => setPxPerBar(el.clientWidth / BARS));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const commit = useCallback((next: Doc) => {
    const prev = docRef.current;
    setPast((p) => [...p.slice(-49), prev]);
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

  useEffect(() => { engine().then((e) => e.setRegions(doc.regions)); }, [engine, doc.regions]);
  useEffect(() => { engine().then((e) => e.setMuted(doc.muted)); }, [engine, doc.muted]);
  useEffect(() => { engine().then((e) => e.setFilter(filter)); }, [engine, filter]);
  useEffect(() => { engine().then((e) => e.setPreview(preview)); }, [engine, preview]);

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
        const bar = onOwnTrack ? snapBar(laneX(ev.clientX) - (loop.bars * ppbRef.current) / 2, ppbRef.current, loop.bars) : null;
        setDrag({ type: "new", loop, x: ev.clientX, y: ev.clientY, bar });
      }, (_ev, moved) => {
        if (!moved) { setPreview((p) => (p === loop.id ? null : loop.id)); return; }
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

  /** Spread onto a block: click selects, drag moves along its track. */
  const blockBody = (r: Region) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      setSelected(r.id);
      const offset = laneX(e.clientX) - (r.start - 1) * ppbRef.current;
      track(e, (ev) => {
        setDrag({ type: "move", id: r.id, offset, start: snapBar(laneX(ev.clientX) - offset, ppbRef.current, r.length) });
      }, (_ev, moved) => {
        if (!moved) return;
        const d = dragRef.current;
        if (d?.type === "move" && d.start !== r.start) {
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
        setDrag({ type: "resize", id: r.id, length: snapLength(w, ppbRef.current, lb, r.start) });
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
      const set = (x: number) => jumpTo(Math.min(Math.max(Math.floor(x / ppbRef.current) + 1, 1), BARS));
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
  const inTrack = new Set(doc.regions.map((r) => r.loopId));
  const sounding = doc.muted.map((m, t) => !m && regions.some((r) => r.track === t && playhead >= r.start && playhead < r.start + r.length));
  const bar = Math.floor(playhead), beat = Math.floor((playhead - bar) * 4) + 1;

  return {
    doc, regions, playing, setPlaying, playhead, jumpTo, bar, beat, selected, setSelected,
    preview, setPreview, group, setGroup, filter, ghost, inTrack, sounding, pxPerBar, lanesRef,
    canUndo: past.length > 0, undo, toggleMute, remove,
    crateItem, blockBody, blockGrip, ruler, knob,
  };
}

export type Timeline = ReturnType<typeof useTimeline>;
