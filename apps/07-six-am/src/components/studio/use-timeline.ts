"use client";

// The studio's behaviour: editing with undo, the lanes (S5: add, remove, rename, reorder, volume,
// pan, mute, solo), dragging from the crate and My sounds onto a lane, moving and repeating blocks,
// and the transport. The edit rules live in @/lib/timeline, @/lib/studio-lanes and @/lib/studio-drop.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  docBars, type Doc, type Loop, type Region,
  loopById, newId, registerSounds, snapBar, snapLength,
} from "@/lib/timeline";
import {
  accepts, addLane as addLaneTo, crateLaneType, laneMix, laneOfRegion, lanesOf, legacyTrack, moveLane as moveLaneIn,
  removeLane as removeLaneFrom, renameLane as renameLaneIn, setPan, setVolume, soundLaneType, toggleMute as muteIn,
  toggleSolo as soloIn, withLanes, type FamilyId, type Lane, type LaneType,
} from "@/lib/studio-lanes";
import { dropLibSound, placeInLane } from "@/lib/studio-drop";
import { PART_LANE, dropLength, libLoopFrom, phraseStart } from "@/lib/make/lib-loop";
import type { LibrarySound } from "@/lib/make/library";
import type { Sound } from "@/lib/synths/loop";
import type { Scale } from "@/lib/synths/theory";
import type { AudioEngine } from "./audio";

/** What is being dragged from the crate: a crate loop, or a library sound (My sounds). */
export type CrateItem = { kind: "loop"; loop: Loop } | { kind: "lib"; sound: LibrarySound };
/** Where a dragged item would land: a lane (by id), or a new lane of its type; and the bar. */
type Target = { lane: string | "new"; bar: number } | null;

type Drag =
  | { type: "new"; item: CrateItem; x: number; y: number; target: Target }
  | { type: "move"; id: string; start: number; offset: number; overBin: boolean }
  | { type: "resize"; id: string; length: number };

const THRESHOLD = 4;
const HOLD_MS = 250; // press and hold a block this long and the bin appears

/** An item's lane type, old lane and length in bars (a library sound's block fills a phrase). */
export function itemInfo(item: CrateItem): { type: LaneType; track: number; bars: number; name: string } {
  if (item.kind === "loop") return { type: crateLaneType(item.loop), track: item.loop.track, bars: item.loop.bars, name: item.loop.name };
  const type = PART_LANE[item.sound.part];
  return { type, track: legacyTrack(type), bars: item.sound.pattern.bars, name: item.sound.name };
}

/** One open track. `initial` is the saved arrangement; Studio remounts this per track. `bpm` is the project tempo. */
export function useTimeline(initial: Doc, bpm: number, startBar = 1) {
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
  // S5: the track's lanes; a track saved before S5 has the 4 old ones until its lanes are edited.
  const lanes = useMemo(() => lanesOf(doc), [doc]);
  const lanesKey = JSON.stringify(lanes);
  const mix = useMemo(() => laneMix(lanes), [lanes]);

  const [playing, setPlaying] = useState(false);
  // Every track opens at bar 1 (D1; drafts already did, user test F3).
  const [playhead, setPlayhead] = useState(startBar);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  /** The crate tab: My sounds first (L200), then the seven families. */
  const [group, setGroup] = useState<"mine" | FamilyId>("mine");
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d); };
  /** The lane the sound drawer adds to (S3's "+ Sound", now in a lane's ⋯ menu). */
  const [soundTarget, setSoundTarget] = useState<string | null>(null);

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

  // Edits that come in a stream (a knob or fader being dragged) share one undo step: same `merge` key, one entry.
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

  // ── Lanes ───────────────────────────────────────────────────────────────────────────────────────
  /** Apply a lane edit: the doc gets its lanes (and the old muted/soloed follow, withLanes). */
  const editLanes = useCallback((f: (ls: Lane[], d: Doc) => Lane[] | { lanes: Lane[]; regions: Region[] }, merge?: string) => {
    const d = docRef.current;
    const out = f(lanesOf(d), d);
    const next = Array.isArray(out) ? withLanes(d, out) : withLanes({ ...d, regions: out.regions }, out.lanes);
    commit(next, merge);
  }, [commit]);
  const toggleMute = useCallback((id: string) => editLanes((ls) => muteIn(ls, id)), [editLanes]);
  /** L200: headphones = hear only this lane; several lanes can be soloed together. */
  const toggleSolo = useCallback((id: string) => editLanes((ls) => soloIn(ls, id)), [editLanes]);
  const setLaneVolume = useCallback((id: string, db: number) => editLanes((ls) => setVolume(ls, id, db), `vol:${id}`), [editLanes]);
  const setLanePan = useCallback((id: string, pan: number) => editLanes((ls) => setPan(ls, id, pan), `pan:${id}`), [editLanes]);
  const renameLane = useCallback((id: string, name: string) => editLanes((ls) => renameLaneIn(ls, id, name)), [editLanes]);
  const moveLane = useCallback((id: string, dir: -1 | 1) => editLanes((ls) => moveLaneIn(ls, id, dir)), [editLanes]);
  /** S5-2: removing a lane with blocks says so, with Undo (no confirmation dialog). */
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h); }, [toast]);
  const removeLane = useCallback((id: string) => {
    const d = docRef.current, ls = lanesOf(d), lane = ls.find((l) => l.id === id);
    const n = d.regions.filter((r) => laneOfRegion(r, ls)?.id === id).length;
    editLanes((l2, d2) => removeLaneFrom(l2, d2.regions, id));
    setSelected(null);
    if (lane && n) setToast(`Removed ${lane.name}${n > 1 ? ` and ${n} blocks` : " and its block"}`);
  }, [editLanes]);
  /** A new lane of `type` at the end of its family; returns its id (null when the track is full). */
  const addLane = useCallback((type: LaneType) => {
    const r = addLaneTo(lanesOf(docRef.current), type);
    if (r.id) editLanes(() => r.lanes);
    return r.id;
  }, [editLanes]);

  const remove = useCallback((id: string) => {
    const d = docRef.current;
    commit({ ...d, regions: d.regions.filter((r) => r.id !== id) });
    setSelected(null);
  }, [commit]);

  /** Put a block on a lane (overwriting there only), giving the doc its lanes. */
  const putOnLane = useCallback((r: Region, laneList: Lane[], extra: Partial<Doc> = {}) => {
    const d = { ...docRef.current, ...extra };
    const lane = r.lane ?? laneOfRegion(r, laneList)?.id;
    commit(withLanes({ ...d, regions: placeInLane(d.regions, { ...r, lane }, laneList) }, laneList));
  }, [commit]);

  // Sound: the engine is loaded in the browser only (Tone.js needs Web Audio), on first use.
  const engineRef = useRef<Promise<AudioEngine> | null>(null);
  const engine = useCallback(() => (engineRef.current ??= import("./audio").then((m) => {
    const e = new m.AudioEngine();
    // Dev only: the open track's engine, for the before/after schedule and level checks (S5).
    if (process.env.NODE_ENV !== "production") (window as unknown as { __sixamEngine?: unknown }).__sixamEngine = e;
    return e;
  })), []);
  const playheadRef = useRef(playhead);
  useLayoutEffect(() => { playheadRef.current = playhead; });

  // Lanes before regions: a block plays on its lane's channel.
  useEffect(() => { engine().then((e) => e.setLanes(JSON.parse(lanesKey) as Lane[])); }, [engine, lanesKey]);
  useEffect(() => { engine().then((e) => { e.setBars(bars); e.setRegions(doc.regions); }); }, [engine, doc.regions, bars]);
  useEffect(() => { engine().then((e) => e.setPreview(preview)); }, [engine, preview]);
  useEffect(() => { engine().then((e) => e.setTempo(bpm)); }, [engine, bpm]);
  // Sounds before regions: the regions' sound index is built from them.
  useEffect(() => { engine().then((e) => e.setSounds(doc.sounds ?? [])); }, [engine, doc.sounds]);
  useEffect(() => { engine().then((e) => e.setKey(key, scale)); }, [engine, key, scale]);

  /** The sound drawer's Listen and My sounds' click: loop one sound alone (null stops). Stops the crate preview. */
  const [previewSound, setPreviewSoundState] = useState<Sound | null>(null);
  const setPreviewSound = useCallback((x: Sound | null) => {
    setPreviewSoundState(x);
    if (x) setPreview(null);
    engine().then((e) => e.setPreviewSound(x));
  }, [engine]);

  /** The lane an item goes on when added without a drop (Enter, the drawer): the drawer's lane when
   *  it takes it, else the first lane that does, else a new lane of its type. */
  const laneFor = useCallback((type: LaneType, track: number, prefer?: string | null): { lanes: Lane[]; id: string; isNew: boolean } | null => {
    const ls = lanesOf(docRef.current);
    const hit = ls.find((l) => l.id === prefer && accepts(l, { type, track })) ?? ls.find((l) => accepts(l, { type, track }));
    if (hit) return { lanes: ls, id: hit.id, isNew: false };
    const r = addLaneTo(ls, type);
    return r.id ? { lanes: r.lanes, id: r.id, isNew: true } : null;
  }, []);

  /** Add a sound to a lane at `bar` (one pass long, overwriting what's there) and select it. */
  const addSound = useCallback((x: Sound, bar: number) => {
    const lb = x.bars;
    registerSounds([x]);
    const at = laneFor(soundLaneType(x), x.lane, soundTarget);
    if (!at) return null;
    const start = Math.min(Math.max(1, Math.floor(bar)), Math.max(1, bars - lb + 1));
    const r: Region = { id: newId(), loopId: x.id, track: x.lane, lane: at.id, start, length: lb };
    putOnLane(r, at.lanes, { sounds: [...(docRef.current.sounds ?? []), x] });
    setSelected(r.id);
    return r;
  }, [putOnLane, laneFor, bars, soundTarget]);

  /** Change a sound everywhere it plays (knobs live; a knob drag is one undo step). */
  const updateSound = useCallback((x: Sound, merge?: string) => {
    const d = docRef.current;
    registerSounds([x]);
    commit({ ...d, sounds: (d.sounds ?? []).map((o) => (o.id === x.id ? x : o)) }, merge);
  }, [commit]);

  /** Drop a crate item on a lane (or a new lane) at a bar. A library sound lands at the phrase. */
  const dropItem = useCallback((item: CrateItem, target: { lane: string | "new"; bar: number }) => {
    if (item.kind === "lib") {
      const r = dropLibSound(docRef.current, item.sound, target.bar, target.lane === "new" ? { newLane: true } : { laneId: target.lane });
      if (!r) return;
      commit(r.doc);
      setSelected(r.regionId);
      return;
    }
    const info = itemInfo(item);
    let ls = lanesOf(docRef.current), laneId = target.lane;
    if (laneId === "new") {
      const added = addLaneTo(ls, info.type);
      if (!added.id) return;
      ls = added.lanes;
      laneId = added.id;
    }
    const r: Region = { id: newId(), loopId: item.loop.id, track: item.loop.track, lane: laneId, start: target.bar, length: item.loop.bars };
    putOnLane(r, ls);
    setSelected(r.id);
  }, [commit, putOnLane]);

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

  /** Where an item under the pointer would land: a lane that takes it, or the "new lane" row; a
   *  crate loop at the bar under its middle, a library sound at the phrase (L199). */
  const targetAt = (item: CrateItem, ev: PointerEvent): Target => {
    const info = itemInfo(item);
    const el = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null);
    const laneEl = el?.closest<HTMLElement>("[data-lane]");
    const isNew = !!el?.closest("[data-newlane]");
    const lane = laneEl ? lanesOf(docRef.current).find((l) => l.id === laneEl.dataset.lane) : undefined;
    if (!isNew && !(lane && accepts(lane, info))) return null;
    const ppb = ppbRef.current;
    if (item.kind === "lib") {
      const raw = Math.max(1, Math.floor(laneX(ev.clientX) / ppb) + 1);
      const full = dropLength(info.bars, 1, bars);
      return { lane: isNew ? "new" : lane!.id, bar: Math.max(1, Math.min(phraseStart(raw), bars - full + 1)) };
    }
    return { lane: isNew ? "new" : lane!.id, bar: snapBar(laneX(ev.clientX) - (info.bars * ppb) / 2, ppb, info.bars, bars) };
  };

  /** Hear an item alone: a crate loop by its recipe, a library sound as a block would play it. */
  const hear = (item: CrateItem) => {
    if (item.kind === "loop") { setPreviewSound(null); setPreview((p) => (p === item.loop.id ? null : item.loop.id)); return; }
    const id = `listen-${item.sound.id}`;
    if (previewSound?.id === id) { setPreviewSound(null); return; }
    setPreviewSound(libLoopFrom(item.sound, PART_LANE[item.sound.part], id));
  };

  /** Spread onto a crate item or My sounds card: click hears it, drag drops it onto a lane that
   *  takes it. By keyboard (break-ui pass): Space hears it, Enter adds it at the playhead. */
  const crateItem = (item: CrateItem) => {
    const info = itemInfo(item);
    return {
      tabIndex: 0,
      role: "button",
      "aria-label": `${info.name}, ${info.bars} ${info.bars === 1 ? "bar" : "bars"}. Space to hear it, Enter to add it at bar ${Math.floor(playhead)}`,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === " ") { e.preventDefault(); e.stopPropagation(); hear(item); }
        else if (e.key === "Enter") {
          e.preventDefault(); e.stopPropagation();
          const at = laneFor(info.type, info.track, null);
          if (!at) return;
          const bar = Math.min(Math.max(1, Math.floor(playheadRef.current)), bars - info.bars + 1);
          dropItem(item, { lane: at.isNew ? "new" : at.id, bar });
        }
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        track(e, (ev) => setDrag({ type: "new", item, x: ev.clientX, y: ev.clientY, target: targetAt(item, ev) }), (_ev, moved) => {
          if (!moved) { hear(item); return; }
          const d = dragRef.current;
          if (d?.type === "new" && d.target) dropItem(item, d.target);
          setDrag(null);
        });
      },
    };
  };

  /** Move or resize a block on its own lane. */
  const moveTo = (r: Region, patch: Partial<Region>) => {
    const ls = lanesOf(docRef.current);
    putOnLane({ ...r, ...patch, lane: laneOfRegion(r, ls)?.id }, ls);
  };

  /** Spread onto a block: click selects, drag moves along its lane, drop on the bin removes it.
   *  The bin appears once you hold the block or start dragging it (owner, feedback 8). */
  const blockBody = (r: Region) => ({
    // Keyboard (break-ui pass): Tab to a block, Enter selects it (a sound opens its drawer),
    // ←/→ move it a bar (Shift: 4 bars), Delete removes it (the window handler below).
    tabIndex: 0,
    role: "button",
    "aria-label": `${loopById(r.loopId).name}, bars ${r.start}–${r.start + r.length - 1}. Enter selects, ←/→ move, Shift 4 bars, Delete removes`,
    "aria-pressed": selected === r.id,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setSelected(r.id); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault(); e.stopPropagation();
        const step = (e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 4 : 1);
        const start = Math.min(Math.max(1, r.start + step), bars - r.length + 1);
        setSelected(r.id);
        if (start !== r.start) moveTo(r, { start });
      }
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      setSelected(r.id);
      const offset = laneX(e.clientX) - (r.start - 1) * ppbRef.current;
      const hold = setTimeout(() => setDrag({ type: "move", id: r.id, offset, start: r.start, overBin: false }), HOLD_MS);
      track(e, (ev) => {
        clearTimeout(hold);
        const overBin = !!(document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest("[data-bin]");
        // Over the bin, the block stays put; elsewhere it follows along its lane.
        const start = overBin ? r.start : snapBar(laneX(ev.clientX) - offset, ppbRef.current, r.length, bars);
        setDrag({ type: "move", id: r.id, offset, start, overBin });
      }, () => {
        clearTimeout(hold);
        const d = dragRef.current;
        if (d?.type === "move" && d.overBin) remove(r.id);
        else if (d?.type === "move" && d.start !== r.start) moveTo(r, { start: d.start });
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
        if (d?.type === "resize" && d.length !== r.length) moveTo(r, { length: d.length });
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

  // Keyboard: space plays, Delete removes, M mutes the selected block's lane, ⌘Z undoes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      // Space on a focused control is that control's own press, not play/pause (break-ui pass).
      if (e.key === " " && t.closest("button, a, [role='button'], [role='slider'], [role='radio']")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selected) { e.preventDefault(); remove(selected); }
      else if (e.key.toLowerCase() === "m" && selected) {
        const r = docRef.current.regions.find((x) => x.id === selected);
        const lane = r && laneOfRegion(r, lanesOf(docRef.current));
        if (lane) toggleMute(lane.id);
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
  const ghost = drag?.type === "new" ? { ...drag, info: itemInfo(drag.item) } : null;
  const bin = drag?.type === "move" ? { id: drag.id, over: drag.overBin } : null;
  const silent = (id: string) => !mix.find((m) => m.id === id)?.audible;
  const laneOf = (r: Region) => laneOfRegion(r, lanes);
  const bar = Math.floor(playhead), beat = Math.floor((playhead - bar) * 4) + 1;

  return {
    doc, bars, key, scale, engine, previewSound, setPreviewSound, addSound, updateSound, markers: initial.markers ?? [], regions, playing, setPlaying, playhead, jumpTo, bar, beat, selected, setSelected,
    preview, setPreview, group, setGroup, ghost, bin, pxPerBar, lanesRef,
    lanes, silent, laneOf, toggleMute, toggleSolo, setLaneVolume, setLanePan, renameLane, moveLane, removeLane, addLane,
    soundTarget, setSoundTarget,
    canUndo: past.length > 0, undo, remove, toast, setToast,
    crateItem, blockBody, blockGrip, ruler,
  };
}

export type Timeline = ReturnType<typeof useTimeline>;
