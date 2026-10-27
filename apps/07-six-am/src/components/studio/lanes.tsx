"use client";
/* eslint-disable react-hooks/refs -- the handler factories from useTimeline read refs only inside events */

// The Studio's lanes (S5, Fold, L194, L200): the ruler with sections, bar numbers every 8 and
// "+ Add lane" in its corner; every lane under its family row (which folds to one summary row);
// a lane's gutter shows its name, hear-only (headphones) and mute (speaker) on hover, ⋯, and volume
// and pan on their own line. Flat clips. A dragged sound tints the lanes that take it.
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { loopById, type Region } from "@/lib/timeline";
import { FAMILIES, LANE_TYPES, accepts, colorOf, laneType, legacyTrack, type FamilyId, type Lane, type LaneType } from "@/lib/studio-lanes";
import { sectionName } from "@/lib/map/view";
import type { Timeline } from "./use-timeline";
import v from "./lanes.module.css";

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

// The Lab's option B icons (lanes.tsx there isn't exported; same drawing, L200).
const Phones = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><path d="M2.5 10V8a5.5 5.5 0 0 1 11 0v2" fill="none" stroke="currentColor" strokeWidth="1.4" /><rect x="1.8" y="9.3" width="3" height="4.6" rx="1" fill="currentColor" /><rect x="11.2" y="9.3" width="3" height="4.6" rx="1" fill="currentColor" /></svg>
);
const Speaker = ({ off }: { off?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="currentColor" />{off ? <path d="M10.5 5.5l4 5m0-5l-4 5" stroke="currentColor" strokeWidth="1.4" /> : <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.4" />}</svg>
);

const fmtDb = (db: number) => (db === 0 ? "0 dB" : `${db > 0 ? "+" : "−"}${Math.abs(db)} dB`);
const fmtPan = (p: number) => (p === 0 ? "C" : p < 0 ? `L ${-p}` : `R ${p}`);

/** The 11 lane types in their families, for "Add a lane". */
function TypeList({ onPick, only }: { onPick: (t: LaneType) => void; only?: FamilyId }) {
  return (
    <div className={v.typeList}>
      {FAMILIES.filter((f) => !only || f.id === only).map((f) => (
        <div key={f.id} className={v.typeFam} style={{ ["--c" as string]: f.color }}>
          <span className={v.typeFamName}>{f.name}</span>
          {LANE_TYPES.filter((t) => t.family === f.id).map((t) => (
            <button key={t.id} className={v.typeBtn} onClick={() => onPick(t.id)}>
              <b>{t.name}</b><em>{t.hint}</em>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function LanesView({ t, onNewSound }: {
  t: Timeline;
  /** "New sound…" in a lane's ⋯ menu: open the sound drawer for that lane (S3's "+ Sound"). */
  onNewSound: (lane: Lane) => void;
}) {
  const ppb = t.pxPerBar;
  const [fold, setFold] = useState<FamilyId[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ fam?: FamilyId } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const ghost = t.ghost;
  const groups = useMemo(() => FAMILIES.map((f) => ({ ...f, lanes: t.lanes.filter((l) => laneType(l.type).family === f.id) })).filter((g) => g.lanes.length), [t.lanes]);
  const byLane = useMemo(() => {
    const m = new Map<string, Region[]>();
    for (const r of t.regions) { const l = t.laneOf(r); if (l) m.set(l.id, [...(m.get(l.id) ?? []), r]); }
    return m;
  }, [t]);
  const takes = (l: Lane) => !!ghost && accepts(l, ghost.info);
  const anyTakes = !!ghost && t.lanes.some(takes);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(null); setAdding(null); } };
    const away = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest("[data-pop]")) { setMenu(null); setAdding(null); } };
    addEventListener("keydown", esc);
    addEventListener("pointerdown", away);
    return () => { removeEventListener("keydown", esc); removeEventListener("pointerdown", away); };
  }, []);
  const pick = (type: LaneType) => {
    const id = t.addLane(type);
    setAdding(null);
    setFold((x) => x.filter((f) => f !== laneType(type).family));
    return id;
  };
  const numEvery = t.bars > 128 ? 16 : 8;

  return (
    <div className={cx(v.tl, v.fadeEnd)} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
      <div className={v.content}>
        <div className={cx(v.row, v.rulerRow, scrolled && v.rulerShadow)}>
          {/* The ruler's corner holds "+ Add lane", so it stays in view however many lanes there are. */}
          <div className={cx(v.gut, v.corner)} data-pop>
            <button className={v.addBtn} aria-expanded={!!adding && !adding.fam} onClick={() => setAdding(adding ? null : {})}>+ Add lane</button>
            {adding && !adding.fam ? (
              <div className={cx(v.pop, v.addPop)} role="dialog" aria-label="Add a lane">
                {t.lanes.length >= 24 ? <p className={v.full}>24 lanes is the most a track can have. Remove one first.</p> : <TypeList onPick={pick} />}
              </div>
            ) : null}
          </div>
          <div className={v.ruler} {...t.ruler}>
            {Array.from({ length: Math.floor(t.bars / 4) }, (_, i) => <i key={i} className={cx(v.tick, i % 2 === 0 && v.tickBig)} style={{ left: i * 4 * ppb }} />)}
            {Array.from({ length: Math.ceil(t.bars / numEvery) }, (_, i) => <em key={`n${i}`} className={v.barNum} style={{ left: i * numEvery * ppb }}>{i * numEvery + 1}</em>)}
            {t.markers.map((m, i) => {
              // A name that doesn't fit before the next marker shows as a plain line, name in the tooltip (break-ui).
              const room = ((t.markers[i + 1]?.bar ?? t.bars + 1) - m.bar) * ppb;
              const name = sectionName(m.label), fits = room >= name.length * 7 + 12;
              return <span key={`${m.bar}-${m.label}`} className={v.section} title={`${name} · bar ${m.bar}`} style={{ left: (m.bar - 1) * ppb, ...(fits ? {} : { padding: 0, background: "none" }) }}>{fits ? name : null}</span>;
            })}
            {ghost?.target ? <span className={v.rulerMark} style={{ left: (ghost.target.bar - 1) * ppb, ["--c" as string]: colorOf(ghost.info.type) }}>{ghost.target.bar}</span> : null}
          </div>
        </div>

        {groups.map((g) => {
          const folded = fold.includes(g.id);
          return (
            <div key={g.id} style={{ ["--c" as string]: g.color }}>
              <div className={v.row}>
                <div className={cx(v.gut, v.famGut, folded && v.famGutFolded)} data-pop>
                  <button className={cx(v.famHead, folded && v.folded)} onClick={() => setFold((x) => (x.includes(g.id) ? x.filter((y) => y !== g.id) : [...x, g.id]))} aria-expanded={!folded}>
                    <ChevronDown aria-hidden />{g.name}{folded ? <span className={v.famCount}>{g.lanes.length} {g.lanes.length === 1 ? "lane" : "lanes"}</span> : null}
                  </button>
                  <button className={v.famPlus} aria-label={`Add a ${g.name} lane`} onClick={() => {
                    const types = LANE_TYPES.filter((x) => x.family === g.id);
                    if (types.length === 1) pick(types[0].id); else setAdding({ fam: g.id });
                  }}>+</button>
                  {adding?.fam === g.id ? (
                    <div className={cx(v.pop, v.menu)} style={{ left: 8, top: 22, minWidth: 220 }} role="dialog" aria-label={`Add a ${g.name} lane`}>
                      <TypeList onPick={pick} only={g.id} />
                    </div>
                  ) : null}
                </div>
                {folded ? (
                  <div className={cx(v.laneBody, v.summary, ghost && !g.lanes.some(takes) && v.laneDim)} style={{ backgroundSize: `${ppb * 4}px 100%` }}>
                    {g.lanes.flatMap((l, li) => (byLane.get(l.id) ?? []).map((r) => (
                      <i key={r.id} className={v.mini} style={{ left: (r.start - 1) * ppb, width: r.length * ppb - 2, top: 7 + Math.min(li, 3) * 7, opacity: t.silent(l.id) ? 0.35 : 1 }} />
                    )))}
                  </div>
                ) : <div className={v.famBody} />}
              </div>
              {!folded && g.lanes.map((l) => (
                <LaneRow key={l.id} l={l} t={t} regions={byLane.get(l.id) ?? []} menu={menu === l.id} setMenu={setMenu} onNewSound={onNewSound} takes={takes(l)} dragging={!!ghost} />
              ))}
            </div>
          );
        })}

        {ghost && !anyTakes ? (
          <div className={v.row} style={{ ["--c" as string]: colorOf(ghost.info.type) }}>
            <div className={v.gut} />
            <div className={cx(v.newDrop, ghost.target?.lane === "new" && v.newDropOn)} data-newlane>Drop here for a new {laneType(ghost.info.type).name} lane</div>
          </div>
        ) : null}
        <div className={cx(v.row, v.filler)}><div className={v.gut} /><div style={{ flex: 1 }} /></div>

        <div className={v.overlay} ref={t.lanesRef} aria-hidden>
          {t.markers.filter((m) => m.bar > 1).map((m) => <i key={`${m.bar}-${m.label}`} className={v.markerLine} style={{ left: (m.bar - 1) * ppb }} />)}
          <div className={v.playhead} style={{ transform: `translateX(${(t.playhead - 1) * ppb}px)` }} />
        </div>
      </div>
      {ghost ? <div className={v.dragChip} style={{ left: ghost.x, top: ghost.y, ["--c" as string]: colorOf(ghost.info.type) } as CSSProperties}>{ghost.info.name}</div> : null}
    </div>
  );
}

function LaneRow({ l, t, regions, menu, setMenu, onNewSound, takes, dragging }: {
  l: Lane; t: Timeline; regions: Region[]; menu: boolean; setMenu: (id: string | null) => void; onNewSound: (lane: Lane) => void; takes: boolean; dragging: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const ppb = t.pxPerBar;
  const i = t.lanes.indexOf(l);
  const sameFam = (j: number) => !!t.lanes[j] && laneType(t.lanes[j].type).family === laneType(l.type).family;
  const silent = t.silent(l.id);
  const ghost = t.ghost;
  return (
    <div className={v.row} style={{ ["--c" as string]: colorOf(l.type) }}>
      <div className={cx(v.gut, silent && v.gutSilent)} style={{ height: 56 }} data-pop
        onKeyDown={(e) => { if (e.altKey && e.key === "ArrowUp") { e.preventDefault(); t.moveLane(l.id, -1); } if (e.altKey && e.key === "ArrowDown") { e.preventDefault(); t.moveLane(l.id, 1); } }}>
        <i className={v.colorBar} />
        <div className={v.laneHead}>
          <div className={v.line1}>
            {editing ? (
              <input className={v.nameInput} defaultValue={l.name} autoFocus maxLength={40} aria-label="Lane name"
                onBlur={(e) => { t.renameLane(l.id, e.target.value); setEditing(false); }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false); }} />
            ) : (
              <button className={v.name} onDoubleClick={() => setEditing(true)} onKeyDown={(e) => { if (e.key === "F2" || e.key === "Enter") { e.preventDefault(); setEditing(true); } }}
                title={`${l.name} · ${laneType(l.type).name} · double-click to rename`}>{l.name}</button>
            )}
            <span className={v.icons}>
              {/* L200: headphones = hear only this lane (several can be on), speaker = mute; a lit one stays. */}
              <button className={v.hearIcon} data-lit={l.soloed ? "" : undefined} aria-pressed={l.soloed} onClick={() => t.toggleSolo(l.id)}
                aria-label={`Hear only ${l.name}`} title={l.soloed ? `Hearing ${l.name}: click to hear everything` : `Hear only ${l.name}`}><Phones /></button>
              <button className={v.hearIcon} data-lit={l.muted ? "mute" : undefined} aria-pressed={l.muted} onClick={() => t.toggleMute(l.id)}
                aria-label={`Mute ${l.name}`} title={l.muted ? `Unmute ${l.name}` : `Mute ${l.name}`}><Speaker off={l.muted} /></button>
              <button className={v.more} onClick={() => setMenu(menu ? null : l.id)} aria-label={`More for ${l.name}`} aria-expanded={menu} aria-haspopup="menu">⋯</button>
            </span>
          </div>
          <div className={v.mix}>
            <label className={v.mixItem} title="Volume">
              <input className={v.vol} type="range" min={-30} max={6} step={0.5} value={l.volumeDb} onChange={(e) => t.setLaneVolume(l.id, +e.target.value)} onDoubleClick={() => t.setLaneVolume(l.id, 0)} aria-label={`${l.name} volume`} aria-valuetext={fmtDb(l.volumeDb)} />
              <span className={v.mixVal}>{fmtDb(l.volumeDb)}</span>
            </label>
            <label className={v.mixItem} title="Pan: left or right · double-click for centre">
              <input className={v.pan} type="range" min={-100} max={100} step={5} value={l.pan} onChange={(e) => t.setLanePan(l.id, +e.target.value)} onDoubleClick={() => t.setLanePan(l.id, 0)} aria-label={`${l.name} pan`} aria-valuetext={fmtPan(l.pan)} />
              <span>{fmtPan(l.pan)}</span>
            </label>
          </div>
        </div>
        {menu ? (
          <div className={cx(v.pop, v.menu)} role="menu">
            <button role="menuitem" onClick={() => { setMenu(null); setEditing(true); }}>Rename</button>
            {legacyTrack(l.type) < 3 ? <button role="menuitem" onClick={() => { setMenu(null); onNewSound(l); }}>New sound…</button> : null}
            <button role="menuitem" disabled={!sameFam(i - 1)} onClick={() => t.moveLane(l.id, -1)}>Move up <kbd>⌥↑</kbd></button>
            <button role="menuitem" disabled={!sameFam(i + 1)} onClick={() => t.moveLane(l.id, 1)}>Move down <kbd>⌥↓</kbd></button>
            <hr />
            <button role="menuitem" className={v.danger} onClick={() => { setMenu(null); t.removeLane(l.id); }}>
              Remove lane{regions.length ? ` and ${regions.length} ${regions.length === 1 ? "block" : "blocks"}` : ""}
            </button>
          </div>
        ) : null}
      </div>
      <div data-lane={l.id} className={cx(v.laneBody, dragging && (takes ? v.laneTarget : v.laneDim))} style={{ backgroundSize: `${ppb * 4}px 100%` }} onPointerDown={() => t.setSelected(null)}>
        {regions.map((r) => {
          const loop = loopById(r.loopId);
          if (!loop) return null;
          return (
            <div key={r.id} className={cx(v.clip, silent && v.clipSilent, t.selected === r.id && v.clipSelected, t.bin?.id === r.id && t.bin.over && v.clipRemoving)}
              style={{ left: (r.start - 1) * ppb, width: Math.max(2, r.length * ppb - 2) }} title={`${loop.name} · bars ${r.start}–${r.start + r.length - 1}`} {...t.blockBody(r)}>
              {/* F12: a narrow block shows the engine name only ("303 Acid"); the full name is the tooltip. */}
              <b className={v.clipName}>{r.length * ppb < 140 ? loop.name.split(" · ")[0] : loop.name}</b>
              <i className={v.grip} {...t.blockGrip(r)} />
            </div>
          );
        })}
        {takes && ghost?.target && ghost.target.lane === l.id ? (
          <div className={v.ghost} style={{ left: (ghost.target.bar - 1) * ppb, width: ghostBars(ghost.item, ghost.info.bars, t.bars, ghost.target.bar) * ppb - 2 }}><b>{ghost.info.name}</b></div>
        ) : null}
      </div>
    </div>
  );
}

/** A dropped block's length: a crate loop one pass, a library sound whole passes filling a phrase. */
function ghostBars(item: NonNullable<Timeline["ghost"]>["item"], passBars: number, total: number, start: number) {
  if (item.kind === "loop") return passBars;
  const passes = Math.max(1, Math.floor(8 / passBars));
  return Math.max(passBars, Math.min(passes, Math.floor((total - start + 1) / passBars)) * passBars);
}
