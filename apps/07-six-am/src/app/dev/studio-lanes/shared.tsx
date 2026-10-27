"use client";

// Shared rough pieces for the Studio lane directions (dev only): the Studio's own control bar (its
// real CSS), the ruler, a lane's blocks, the lane state (add, remove, rename, reorder, volume, pan,
// mute, solo, fold a family, drop a library sound), and the add-lane type list.
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import st from "@/components/studio/studio.module.css";
import {
  BARS, DROP_BAR, FAMILIES, LANES, MY_SOUNDS, PLAYHEAD, SECTIONS, TRACK, TYPES, WORST_LANES, WORST_SOUNDS, colorOf, pct, type, wpct,
  type FamilyId, type Lane, type MySound, type TypeId,
} from "./data";
import v from "./v.module.css";

export { v };
export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

/** The Studio's control bar as it is today (its own CSS), so the lanes are judged in place. */
export function Bar() {
  return (
    <header className={st.bar}>
      <div className={st.logo}><Logo className={st.mark} />Six AM</div>
      <ViewsNav current="studio" />
      <div className={st.trackBox}>
        <input className={st.trackTitle} defaultValue={TRACK.name} aria-label="Track name" size={16} spellCheck={false} />
        <button className={st.libBtn}>My tracks <ChevronDown aria-hidden /></button>
        <span className={st.saveState}>Saved</span>
      </div>
      <div className={st.transport}>
        <button className={st.tb} aria-label="Back to start"><svg viewBox="0 0 16 16" aria-hidden><path d="M3 2h2v12H3zM14 2v12L6 8z" fill="currentColor" /></svg></button>
        <button className={cx(st.tb, st.play)} aria-label="Play"><svg viewBox="0 0 16 16" aria-hidden><path d="M4 2l10 6-10 6z" fill="currentColor" /></svg></button>
        <div className={st.lcd}><b>{PLAYHEAD}.1</b><small>bar</small><b>{TRACK.bpm}</b><small>bpm</small><b>{TRACK.key}</b><small>key</small></div>
        <button className={st.undo} aria-label="Undo"><svg viewBox="0 0 16 16" aria-hidden><path d="M6 3 2 7l4 4V8h4a3 3 0 0 1 0 6H8v2h2a5 5 0 0 0 0-10H6z" fill="currentColor" /></svg> <span className={st.undoWord}>Undo</span></button>
        <div className={st.knobWrap}>Filter<div className={st.knob} style={{ ["--a" as string]: "135deg" }} role="slider" aria-label="Filter" aria-valuenow={100} tabIndex={0} /></div>
      </div>
      <SettingsLink />
    </header>
  );
}

export function Ruler({ dropBar, dropColor, numbers }: { dropBar?: number | null; dropColor?: string; numbers?: boolean }) {
  return (
    <div className={cx(v.ruler, numbers && v.rulerNums)}>
      {numbers && Array.from({ length: BARS / 8 }, (_, i) => <em key={`n${i}`} className={v.barNum} style={{ left: pct(i * 8 + 1) }}>{i * 8 + 1}</em>)}
      {Array.from({ length: BARS / 4 }, (_, i) => (
        <i key={i} className={cx(v.tick, i % 4 === 0 && v.tickBig)} style={{ left: pct(i * 4 + 1) }} />
      ))}
      {SECTIONS.map((s) => <span key={s.bar} className={v.section} style={{ left: pct(s.bar) }}>{s.name}</span>)}
      {dropBar ? <span className={v.rulerMark} style={{ left: pct(dropBar), ["--c" as string]: dropColor }}>{dropBar}</span> : null}
    </div>
  );
}

/** One lane's blocks. `ghost` = a library sound held over it; `summary` = a folded family. */
export function LaneBody({ lanes, silent, ghost, summary, dim, target, onDrop, h, flat }: {
  lanes: Lane[]; silent?: (l: Lane) => boolean; ghost?: { bar: number; bars: number; name: string } | null;
  summary?: boolean; dim?: boolean; target?: boolean; onDrop?: () => void; h?: number;
  /** Round 2 (critic): flat clips, no "live" highlight, so a clip is only dimmer when its lane is silent. */
  flat?: boolean;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={cx(v.laneBody, dim && v.laneDim, (target || over) && v.laneTarget, summary && v.summary)}
      style={{ ["--c" as string]: colorOf(lanes[0]?.type ?? "fx"), height: h }}
      onDragOver={onDrop ? (e) => { e.preventDefault(); setOver(true); } : undefined}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop ? (e) => { e.preventDefault(); setOver(false); onDrop(); } : undefined}
    >
      {lanes.flatMap((l, li) => l.blocks.map((bk, i) => (
        <div key={`${l.id}-${i}`} className={cx(v.block, silent?.(l) && v.blockSilent, bk.start <= PLAYHEAD && PLAYHEAD < bk.start + bk.len && !summary && !flat && v.blockLive, flat && v.flat)}
          style={{ left: pct(bk.start), width: wpct(bk.len), ...(summary ? { top: 7 + li * 7, bottom: "auto", height: 4 } : {}) } as CSSProperties}
          title={`${bk.name} · bar ${bk.start}`}>
          {!summary && <b className={v.blockName}>{bk.name}</b>}
        </div>
      )))}
      {ghost ? (
        <div className={v.ghost} style={{ left: pct(ghost.bar), width: wpct(ghost.bars * 4) }}><b>{ghost.name}</b></div>
      ) : null}
      <i className={v.playhead} style={{ left: pct(PLAYHEAD) }} aria-hidden />
    </div>
  );
}

/** Lane state for one direction. The worst case enters here, at the data boundary (break-ui). */
export function useLanes(worst: boolean, folded: FamilyId[] = []) {
  const [lanes, setLanes] = useState<Lane[]>(() => structuredClone(worst ? WORST_LANES : LANES));
  const [fold, setFold] = useState<FamilyId[]>(folded);
  const [library, setLibrary] = useState<MySound[]>(worst ? WORST_SOUNDS : MY_SOUNDS);
  const anySolo = lanes.some((l) => l.solo);
  const silent = (l: Lane) => (anySolo ? !l.solo : l.mute);
  const patch = (id: string, p: Partial<Lane>) => setLanes((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const groups = useMemo(() => FAMILIES.map((f) => ({ ...f, lanes: lanes.filter((l) => type(l.type).family === f.id) })).filter((g) => g.lanes.length), [lanes]);
  return {
    lanes, groups, fold, library, setLibrary, silent, anySolo,
    toggleFold: (f: FamilyId) => setFold((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f])),
    mute: (id: string) => setLanes((ls) => ls.map((l) => (l.id === id ? { ...l, mute: !l.mute } : l))),
    solo: (id: string) => setLanes((ls) => ls.map((l) => (l.id === id ? { ...l, solo: !l.solo } : l))),
    rename: (id: string, name: string) => patch(id, { name: name.trim().slice(0, 40) || type(lanes.find((l) => l.id === id)!.type).name }),
    vol: (id: string, vol: number) => patch(id, { vol }),
    pan: (id: string, pan: number) => patch(id, { pan }),
    remove: (id: string) => setLanes((ls) => ls.filter((l) => l.id !== id)),
    /** Reorder within the lane's family (families keep their fixed order). */
    move: (id: string, dir: -1 | 1) => setLanes((ls) => {
      const i = ls.findIndex((l) => l.id === id);
      const j = i + dir;
      if (j < 0 || j >= ls.length || type(ls[j].type).family !== type(ls[i].type).family) return ls;
      const next = [...ls];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    }),
    add: (t: TypeId) => {
      const id = `n${Date.now()}`;
      setLanes((ls) => {
        const fam = type(t).family;
        const order = FAMILIES.map((f) => f.id);
        const at = ls.reduce((acc, l, i) => (order.indexOf(type(l.type).family) <= order.indexOf(fam) ? i + 1 : acc), 0);
        const n = ls.filter((l) => l.type === t).length;
        const lane: Lane = { id, type: t, name: n ? `${type(t).name} ${n + 1}` : type(t).name, vol: 0, pan: 0, mute: false, solo: false, blocks: [] };
        return [...ls.slice(0, at), lane, ...ls.slice(at)];
      });
      setFold((x) => x.filter((f) => f !== type(t).family));
      return id;
    },
    /** A library sound lands at the playhead's phrase in a lane of its type. */
    drop: (laneId: string, s: MySound) => setLanes((ls) => ls.map((l) => (l.id === laneId ? { ...l, blocks: [...l.blocks, { start: DROP_BAR, len: s.bars * 4, name: s.name }] } : l))),
  };
}
export type Lanes = ReturnType<typeof useLanes>;

/** The 11 lane types in their families, for "Add a lane". */
export function TypeList({ onPick, className }: { onPick: (t: TypeId) => void; used?: TypeId[]; className?: string }) {
  return (
    <div className={cx(v.typeList, className)}>
      {FAMILIES.map((f) => (
        <div key={f.id} className={v.typeFam} style={{ ["--c" as string]: f.color }}>
          <span className={v.typeFamName}>{f.name}</span>
          {TYPES.filter((t) => t.family === f.id).map((t) => (
            <button key={t.id} className={v.typeBtn} onClick={() => onPick(t.id)}>
              <b>{t.name}</b><em>{t.hint}</em>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/** A My sounds item: name, where it came from, its tags as plain text. Draggable. */
export function SoundItem({ s, onDragStart, onDragEnd, held, compact, action }: {
  s: MySound; onDragStart?: () => void; onDragEnd?: () => void; held?: boolean; compact?: boolean; action?: ReactNode;
}) {
  return (
    <div className={cx(v.sound, held && v.soundHeld, compact && v.soundCompact)} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} style={{ ["--c" as string]: colorOf(s.type) }} tabIndex={0} title={`${s.name}, from ${s.from}`}>
      <div className={v.soundMeta}>
        <b>{s.name}</b>
        <em>from {s.from}</em>
        <span>{type(s.type).name} · {s.key} · {s.bpm} BPM</span>
      </div>
      {action}
    </div>
  );
}

export function Wrap({ children, cols }: { children: ReactNode; cols?: string }) {
  return <div className={v.root} style={cols ? { gridTemplateColumns: cols } : undefined}>{children}</div>;
}
