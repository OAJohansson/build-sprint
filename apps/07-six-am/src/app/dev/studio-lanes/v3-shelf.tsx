"use client";

// Direction 3, Shelf (axis: sources on the left, lanes full height, tiny mix marks always shown).
// The crate leaves the bottom: a sounds shelf on the left holds My sounds on top and the built-in
// sounds by family below, so the timeline gets the full height for 8+ lanes. Every family is a
// tree header that folds. Each lane shows a short volume line and a pan dot at all times, grey
// and small, dragged sideways to set. "+ Add lane" opens in place as a row of type chips.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAMILIES, MY_SOUNDS, PRESETS, TYPES, colorOf, fmtDb, fmtPan, type Lane, type MySound } from "./data";
import { DROP_BAR } from "./data";
import { Bar, LaneBody, Ruler, SoundItem, cx, useLanes, v, type Lanes } from "./shared";

export function V3Shelf({ state, worst }: { state: string; worst: boolean }) {
  const L = useLanes(worst);
  const [held, setHeld] = useState<MySound | null>(state === "drop" ? MY_SOUNDS[0] : null);
  const [adding, setAdding] = useState(state === "add");
  const [open, setOpen] = useState<string>("bass");

  return (
    <div className={v.root} style={{ gridTemplateColumns: "280px minmax(0, 1fr)", gridTemplateRows: "76px minmax(0, 1fr)" }}>
      <div style={{ gridColumn: "1 / -1", display: "grid" }}><Bar /></div>
      <aside className={v.side} aria-label="Sounds">
        <div className={v.sideHead}><span>My sounds</span><span>{L.library.length}</span></div>
        {L.library.map((s) => <SoundItem key={s.id} s={s} compact held={held?.id === s.id} onDragStart={() => setHeld(s)} onDragEnd={() => setHeld(null)} />)}
        <div className={v.sideHead} style={{ marginTop: 12 }}><span>Built in</span></div>
        {FAMILIES.map((f) => (
          <div key={f.id} style={{ ["--c" as string]: f.color }}>
            <button className={v.sideFam} onClick={() => setOpen(open === f.id ? "" : f.id)} aria-expanded={open === f.id}>
              <ChevronDown aria-hidden style={{ transform: open === f.id ? undefined : "rotate(-90deg)" }} /><i className={v.famDot} />{f.name}
            </button>
            {open === f.id && TYPES.filter((t) => t.family === f.id).flatMap((t) => (PRESETS[t.id] ?? []).map((p) => (
              <div key={p.name} className={v.preset} draggable tabIndex={0}><span>{p.name}</span><em>{p.bars} bars</em></div>
            )))}
          </div>
        ))}
      </aside>
      <div className={cx(v.tl, v.tree)}>
        <div className={cx(v.rowR, v.rulerRow)}><div className={v.gut} style={{ width: 280 }} /><Ruler dropBar={held ? DROP_BAR : null} dropColor={held ? colorOf(held.type) : undefined} /></div>
        {L.groups.map((g) => {
          const folded = L.fold.includes(g.id);
          return (
            <div key={g.id} style={{ ["--c" as string]: g.color }}>
              <div className={v.rowR}>
                <div className={v.gut} style={{ width: 280, height: folded ? 34 : 28 }}>
                  <button className={cx(v.treeHead, folded && v.folded)} style={{ height: "100%" }} onClick={() => L.toggleFold(g.id)} aria-expanded={!folded}>
                    <ChevronDown aria-hidden style={{ transform: folded ? "rotate(-90deg)" : undefined }} /><i className={v.famDot} />{g.name}{g.lanes.length > 1 ? <span className={v.famCount}>{g.lanes.length}</span> : null}
                  </button>
                </div>
                {folded ? <LaneBody lanes={g.lanes} summary silent={L.silent} h={34} /> : <div className={v.famBody} />}
              </div>
              {!folded && g.lanes.map((l) => {
                const match = held?.type === l.type;
                return (
                  <div key={l.id} className={v.rowR} style={{ ["--c" as string]: colorOf(l.type) }}>
                    <Gutter l={l} L={L} />
                    <LaneBody lanes={[l]} silent={L.silent} h={46} dim={!!held && !match} target={match}
                      ghost={match && held ? { bar: DROP_BAR, bars: held.bars, name: held.name } : null}
                      onDrop={match ? () => { L.drop(l.id, held!); setHeld(null); } : undefined} />
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className={v.rowR} style={{ flex: 1 }}>
          <div className={v.gut} style={{ width: adding ? "100%" : 280, borderBottom: 0, borderRight: adding ? 0 : undefined }}>
            {adding ? (
              <div className={v.chips} role="group" aria-label="Add a lane">
                {FAMILIES.map((f, fi) => (
                  <span key={f.id} style={{ display: "contents", ["--c" as string]: f.color }}>
                    {fi ? <i className={v.chipSep} aria-hidden /> : null}
                    {TYPES.filter((t) => t.family === f.id).map((t) => (
                      <button key={t.id} className={v.chip} style={{ ["--c" as string]: f.color }} title={t.hint} onClick={() => { L.add(t.id); setAdding(false); }}><i />{t.name}</button>
                    ))}
                  </span>
                ))}
                <button className={v.ghostBtn} onClick={() => setAdding(false)}>Cancel</button>
              </div>
            ) : (
              <div className={v.addRow}><button className={v.addBtn} onClick={() => setAdding(true)}>+ Add lane</button></div>
            )}
          </div>
          {!adding && <div style={{ flex: 1 }} />}
        </div>
      </div>
    </div>
  );
}

/** Drag sideways on a tiny control to set it (keyboard: ←/→). */
function useScrub(value: number, min: number, max: number, set: (n: number) => void, step: number) {
  return {
    tabIndex: 0,
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const at = (x: number) => set(Math.round((min + ((x - r.left) / r.width) * (max - min)) / step) * step);
      at(e.clientX);
      e.currentTarget.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => at(ev.clientX);
      const el = e.currentTarget;
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", () => el.removeEventListener("pointermove", move), { once: true });
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") set(Math.max(min, value - step));
      if (e.key === "ArrowRight") set(Math.min(max, value + step));
    },
  };
}

function Gutter({ l, L }: { l: Lane; L: Lanes }) {
  const [editing, setEditing] = useState(false);
  const vol = useScrub(l.vol, -30, 6, (n) => L.vol(l.id, Math.max(-30, Math.min(6, n))), 1);
  const pan = useScrub(l.pan, -100, 100, (n) => L.pan(l.id, Math.max(-100, Math.min(100, n))), 5);
  return (
    <div className={v.gut} style={{ width: 280, height: 46 }}>
      <i className={v.colorBar} style={{ left: 14 }} />
      <div className={v.laneHead} style={{ paddingLeft: 26 }}>
        <div className={v.line1}>
          {editing ? (
            <input className={v.nameInput} defaultValue={l.name} autoFocus maxLength={40} aria-label="Lane name"
              onBlur={(e) => { L.rename(l.id, e.target.value); setEditing(false); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
          ) : (
            <button className={v.name} onDoubleClick={() => setEditing(true)} title={`${l.name} · double-click to rename, drag to reorder`}>{l.name}</button>
          )}
          <div className={v.micro}>
            <span className={v.volBar} role="slider" aria-label={`${l.name} volume`} aria-valuemin={-30} aria-valuemax={6} aria-valuenow={l.vol} aria-valuetext={fmtDb(l.vol)} title={`Volume ${fmtDb(l.vol)}`} {...vol}>
              <i style={{ width: `${((Math.max(-30, l.vol) + 30) / 36) * 100}%` }} />
            </span>
            <span className={v.panDot} role="slider" aria-label={`${l.name} pan`} aria-valuemin={-100} aria-valuemax={100} aria-valuenow={l.pan} aria-valuetext={fmtPan(l.pan)} title={`Pan ${fmtPan(l.pan)}`} {...pan}>
              <i style={{ left: `${50 + l.pan / 2}%` }} />
            </span>
          </div>
          <button className={cx(v.ms, l.mute && v.muteOn)} style={l.mute && !L.silent(l) ? { opacity: .45 } : undefined} onClick={() => L.mute(l.id)} aria-pressed={l.mute} aria-label={`Mute ${l.name}`}>M</button>
          <button className={cx(v.ms, l.solo && v.soloOn)} onClick={() => L.solo(l.id)} aria-pressed={l.solo} aria-label={`Solo ${l.name}`}>S</button>
          <button className={cx(v.more, v.hoverOnly)} onClick={() => L.remove(l.id)} aria-label={`Remove ${l.name}`} title="Remove lane">×</button>
        </div>
      </div>
    </div>
  );
}

