"use client";

// Direction 2, Inspect (axis: select, then the bottom panel becomes the lane). The timeline holds
// only names, M and S; each family is a thin vertical rail you click to fold. Clicking a lane's
// name selects it: the panel below turns into that lane, with its name, volume, pan, move and
// remove on the left and the sounds that fit it on the right, My sounds first. Nothing selected =
// the crate. "+ Add lane" turns the panel into the 11 types in 7 columns.
import { useState } from "react";
import { MY_SOUNDS, PRESETS, colorOf, family, fmtDb, fmtPan, type, type Lane, type MySound, type TypeId } from "./data";
import { DROP_BAR } from "./data";
import { Bar, LaneBody, Ruler, SoundItem, TypeList, Wrap, cx, useLanes, v, type Lanes } from "./shared";

export function V2Inspect({ state, worst }: { state: string; worst: boolean }) {
  const L = useLanes(worst);
  const [sel, setSel] = useState<string | null>(state === "add" ? null : "l4");
  const [adding, setAdding] = useState(state === "add");
  const [held, setHeld] = useState<MySound | null>(state === "drop" ? MY_SOUNDS[0] : null);
  const lane = L.lanes.find((l) => l.id === sel) ?? null;

  return (
    <Wrap>
      <Bar />
      <div className={v.tl}>
        <div className={cx(v.rowR, v.rulerRow)}><div className={v.gut} /><Ruler dropBar={held ? DROP_BAR : null} dropColor={held ? colorOf(held.type) : undefined} /></div>
        {L.groups.map((g) => {
          const folded = L.fold.includes(g.id);
          return (
            <div key={g.id} className={v.famBlock} style={{ ["--c" as string]: g.color }}>
              <div style={{ width: 200, flex: "none", display: "flex", background: "var(--panel)" }}>
                <button className={v.rail} onClick={() => L.toggleFold(g.id)} aria-expanded={!folded} title={folded ? `Show the ${g.lanes.length} ${g.name} lanes` : `Fold ${g.name}`}>
                  <span>{g.lanes.length > 1 || folded ? g.name.slice(0, folded ? 5 : 12) : ""}</span>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {folded ? (
                    <div className={v.laneHead} style={{ height: 40, paddingLeft: 12 }}><span className={v.famCount}>{g.name} · {g.lanes.length} lanes</span></div>
                  ) : g.lanes.map((l) => (
                    <Gutter key={l.id} l={l} L={L} on={sel === l.id} onSelect={() => { setAdding(false); setSel(sel === l.id ? null : l.id); }} />
                  ))}
                </div>
              </div>
              <div className={v.famLanes}>
                {folded ? <LaneBody lanes={g.lanes} summary silent={L.silent} h={40} /> : g.lanes.map((l) => {
                  const match = held?.type === l.type;
                  return <LaneBody key={l.id} lanes={[l]} silent={L.silent} h={48} dim={!!held && !match} target={match}
                    ghost={match && held ? { bar: DROP_BAR, bars: held.bars, name: held.name } : null}
                    onDrop={match ? () => { L.drop(l.id, held!); setHeld(null); } : undefined} />;
                })}
              </div>
            </div>
          );
        })}
        <div className={v.rowR} style={{ flex: 1 }}>
          <div className={v.gut} style={{ borderBottom: 0 }}>
            <div className={v.addRow}><button className={v.addBtn} aria-expanded={adding} onClick={() => { setSel(null); setAdding(!adding); }}>+ Add lane</button></div>
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>
      {adding ? (
        <div className={v.picker2} role="dialog" aria-label="Add a lane">
          <div className={v.pickHead}><b>Add a lane</b><button className={v.ghostBtn} onClick={() => setAdding(false)}>Cancel</button></div>
          <TypeList used={L.lanes.map((l) => l.type)} onPick={(t: TypeId) => { const id = L.add(t); setAdding(false); setSel(id); }} />
        </div>
      ) : lane ? (
        <Inspector l={lane} L={L} held={held} setHeld={setHeld} onClose={() => setSel(null)} />
      ) : (
        <div className={v.inspector} style={{ gridTemplateColumns: "1fr" }}>
          <div className={v.insSounds}>
            <div className={v.insHead}><span><b>My sounds</b> · {L.library.length}</span><span>Pick a lane to see the sounds that fit it</span></div>
            <div className={v.insList}>{L.library.map((s) => <SoundItem key={s.id} s={s} onDragStart={() => setHeld(s)} onDragEnd={() => setHeld(null)} />)}</div>
          </div>
        </div>
      )}
    </Wrap>
  );
}

function Gutter({ l, L, on, onSelect }: { l: Lane; L: Lanes; on: boolean; onSelect: () => void }) {
  return (
    <div className={cx(v.gut2, on && v.selected)} style={{ height: 48, width: "100%", ["--c" as string]: colorOf(l.type) }} onClick={onSelect}>
      <div className={v.laneHead} style={{ paddingLeft: 12 }}>
        <div className={v.line1}>
          <button className={v.name} style={{ cursor: "pointer" }} aria-pressed={on} title={`${l.name} · ${type(l.type).name}`}>{l.name}</button>
          <button className={cx(v.ms, l.mute && v.muteOn)} style={l.mute && !L.silent(l) ? { opacity: .45 } : undefined} onClick={(e) => { e.stopPropagation(); L.mute(l.id); }} aria-pressed={l.mute} aria-label={`Mute ${l.name}`}>M</button>
          <button className={cx(v.ms, l.solo && v.soloOn)} onClick={(e) => { e.stopPropagation(); L.solo(l.id); }} aria-pressed={l.solo} aria-label={`Solo ${l.name}`}>S</button>
        </div>
      </div>
    </div>
  );
}

function Inspector({ l, L, held, setHeld, onClose }: { l: Lane; L: Lanes; held: MySound | null; setHeld: (s: MySound | null) => void; onClose: () => void }) {
  const i = L.lanes.indexOf(l);
  const same = (j: number) => L.lanes[j] && type(L.lanes[j].type).family === type(l.type).family;
  const mine = L.library.filter((s) => s.type === l.type);
  const others = L.library.filter((s) => s.type !== l.type);
  const presets = PRESETS[l.type] ?? [];
  return (
    <div className={v.inspector} style={{ ["--c" as string]: colorOf(l.type) }}>
      <div className={v.insLane}>
        <div className={v.insTitle}>
          <input key={l.id} defaultValue={l.name} maxLength={40} aria-label="Lane name" onBlur={(e) => L.rename(l.id, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
          <span>{type(l.type).name === family(type(l.type).family).name ? `${type(l.type).name} lane` : `${family(type(l.type).family).name} · ${type(l.type).name}`}</span>
        </div>
        <label className={v.slider}>Volume<input type="range" min={-30} max={6} value={Math.max(-30, l.vol)} onChange={(e) => L.vol(l.id, +e.target.value)} aria-valuetext={fmtDb(l.vol)} /><em>{fmtDb(l.vol)}</em></label>
        <label className={v.slider}>Pan<input type="range" min={-100} max={100} step={5} value={l.pan} onChange={(e) => L.pan(l.id, +e.target.value)} onDoubleClick={() => L.pan(l.id, 0)} aria-valuetext={fmtPan(l.pan)} /><em>{fmtPan(l.pan)}</em></label>
        <div className={v.insActions}>
          <button className={v.ghostBtn} disabled={!same(i - 1)} onClick={() => L.move(l.id, -1)}>Move up</button>
          <button className={v.ghostBtn} disabled={!same(i + 1)} onClick={() => L.move(l.id, 1)}>Move down</button>
          <button className={cx(v.ghostBtn, v.danger)} onClick={() => { L.remove(l.id); onClose(); }}>Remove lane</button>
        </div>
      </div>
      <div className={v.insSounds}>
        <div className={v.insHead}><span>Sounds for <b>{l.name}</b> · drag onto the lane, or Add at bar {DROP_BAR}</span><button className={v.ghostBtn} onClick={onClose} aria-label="Close lane">×</button></div>
        <div className={v.insList}>
          {mine.map((s) => <SoundItem key={s.id} s={s} held={held?.id === s.id} onDragStart={() => setHeld(s)} onDragEnd={() => setHeld(null)}
            action={<button className={v.addHere} onClick={() => L.drop(l.id, s)}>Add</button>} />)}
          {presets.map((p) => (
            <div key={p.name} className={v.sound} style={{ ["--c" as string]: colorOf(l.type) }} draggable>
              <div className={v.soundMeta}><b>{p.name}</b><em>{p.vibe}</em><span>Built in · {p.bars} bars</span></div>
            </div>
          ))}
          {others.length && !mine.length ? <p className={v.hint}>None of My sounds is a {type(l.type).name}.</p> : null}
        </div>
      </div>
    </div>
  );
}

