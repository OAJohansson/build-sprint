"use client";

// Direction 1, Fold (axis: in place, revealed on hover). Today's Studio layout kept: lanes on top,
// the crate below. A family with 2+ lanes gets a thin header that folds it to one summary row; a
// family with one lane is just that lane. At rest a lane shows its name, M and S. Hovering or
// focusing the lane reveals volume and pan (one small slider each) and a ⋯ menu (rename, move,
// remove). "+ Add lane" lists the 11 types by family. The crate gains a "My sounds" tab; holding
// a library sound lights the lane of its type and dims the rest.
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAMILIES, MY_SOUNDS, colorOf, fmtDb, fmtPan, type, type Lane, type MySound, type TypeId } from "./data";
import { DROP_BAR } from "./data";
import { Bar, LaneBody, Ruler, SoundItem, TypeList, Wrap, cx, useLanes, v, type Lanes } from "./shared";

export function V1Fold({ state, worst }: { state: string; worst: boolean }) {
  const L = useLanes(worst, state === "add" ? ["drums"] : []);
  const [held, setHeld] = useState<MySound | null>(state === "drop" ? MY_SOUNDS[0] : null);
  const [adding, setAdding] = useState<{ fam?: string } | null>(state === "add" ? {} : null);
  const [menu, setMenu] = useState<string | null>(null);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(null); setAdding(null); } };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, []);
  const [tab, setTab] = useState("mine");
  const reveal = state === "main" ? "l4" : null;
  const hasTarget = held && L.lanes.some((l) => l.type === held.type);

  return (
    <Wrap>
      <Bar />
      <div className={v.tl}>
        <div className={cx(v.rowR, v.rulerRow)}><div className={v.gut} style={{ borderBottom: "1px solid var(--line)" }} /><Ruler dropBar={held ? DROP_BAR : null} dropColor={held ? colorOf(held.type) : undefined} /></div>
        {L.groups.map((g) => {
          const folded = L.fold.includes(g.id);
          const multi = g.lanes.length > 1;
          return (
            <div key={g.id} style={{ ["--c" as string]: g.color }}>
              {multi ? (
                <div className={v.rowR}>
                  <div className={v.gut} style={{ height: folded ? 36 : 26 }}>
                    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                      <button className={cx(v.famHead, folded && v.folded)} onClick={() => L.toggleFold(g.id)} aria-expanded={!folded}>
                        <ChevronDown aria-hidden /><i className={v.famDot} />{g.name}<span className={v.famCount}>{g.lanes.length} lanes</span>
                      </button>
                      <button className={v.famPlus} aria-label={`Add a ${g.name} lane`} onClick={() => setAdding({ fam: g.id })}>+</button>
                    </div>
                  </div>
                  {folded ? <LaneBody lanes={g.lanes} summary silent={L.silent} h={36} dim={!!held && held.type !== g.lanes[0].type} /> : <div className={v.famBody} />}
                </div>
              ) : null}
              {!folded && g.lanes.map((l) => (
                <LaneRow key={l.id} l={l} L={L} reveal={reveal === l.id} menu={menu === l.id} setMenu={setMenu} indent={multi}
                  held={held} onDrop={() => { if (held) L.drop(l.id, held); setHeld(null); }} />
              ))}
            </div>
          );
        })}
        {held && !hasTarget ? (
          <div className={v.rowR} style={{ ["--c" as string]: colorOf(held.type) }}>
            <div className={v.gut} /><div className={v.newDrop}>Drop here for a new {type(held.type).name} lane</div>
          </div>
        ) : null}
        <div className={v.rowR} style={{ flex: 1 }}>
          <div className={v.gut} style={{ borderBottom: 0 }}>
            <div className={v.addRow}>
              <button className={v.addBtn} aria-expanded={!!adding} onClick={() => setAdding(adding ? null : {})}>+ Add lane</button>
            </div>
            {adding ? (
              <div className={cx(v.pop, v.popUp)} style={{ left: 12, bottom: 48, width: 760 }} role="dialog" aria-label="Add a lane">
                <TypeList used={L.lanes.map((l) => l.type)} onPick={(t: TypeId) => { L.add(t); setAdding(null); }} />
              </div>
            ) : null}
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>
      <Crate tab={tab} setTab={setTab} L={L} held={held} setHeld={setHeld} />
    </Wrap>
  );
}

function LaneRow({ l, L, reveal, menu, setMenu, indent, held, onDrop }: {
  l: Lane; L: Lanes; reveal: boolean; menu: boolean; setMenu: (id: string | null) => void; indent: boolean;
  held: MySound | null; onDrop: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const i = L.lanes.indexOf(l);
  const sameFam = (j: number) => L.lanes[j] && type(L.lanes[j].type).family === type(l.type).family;
  const match = held?.type === l.type;
  return (
    <div className={v.rowR} style={{ ["--c" as string]: colorOf(l.type) }}>
      <div className={cx(v.gut, reveal && v.reveal, !reveal && v.hideRest)} style={{ height: 52 }}
        onKeyDown={(e) => { if (e.altKey && e.key === "ArrowUp") L.move(l.id, -1); if (e.altKey && e.key === "ArrowDown") L.move(l.id, 1); }}>
        <i className={v.colorBar} style={indent ? { left: 10 } : undefined} />
        <div className={v.laneHead} style={indent ? { paddingLeft: 24 } : undefined}>
          <div className={v.line1}>
            {editing ? (
              <input className={v.nameInput} defaultValue={l.name} autoFocus maxLength={40} aria-label="Lane name"
                onBlur={(e) => { L.rename(l.id, e.target.value); setEditing(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false); }} />
            ) : (
              <button className={v.name} onDoubleClick={() => setEditing(true)} onKeyDown={(e) => { if (e.key === "F2" || e.key === "Enter") setEditing(true); }} title={`${l.name} · ${type(l.type).name} · double-click to rename`}>{l.name}</button>
            )}
            <button className={cx(v.ms, l.mute && v.muteOn)} style={l.mute && !L.silent(l) ? { opacity: .45 } : undefined} onClick={() => L.mute(l.id)} aria-pressed={l.mute} aria-label={`Mute ${l.name}`}>M</button>
            <button className={cx(v.ms, l.solo && v.soloOn)} onClick={() => L.solo(l.id)} aria-pressed={l.solo} aria-label={`Solo ${l.name}`}>S</button>
            <button className={v.more} onClick={() => setMenu(menu ? null : l.id)} aria-label={`More for ${l.name}`} aria-expanded={menu}>⋯</button>
          </div>
          <div className={v.mix}>
            <label className={v.mixItem} title="Volume">
              <input className={v.vol} type="range" min={-30} max={6} value={Math.max(-30, l.vol)} onChange={(e) => L.vol(l.id, +e.target.value)} aria-label={`${l.name} volume`} aria-valuetext={fmtDb(l.vol)} />
              <span className={v.mixVal}>{fmtDb(l.vol)}</span>
            </label>
            <label className={v.mixItem} title="Pan: left or right">
              <input className={v.pan} type="range" min={-100} max={100} step={5} value={l.pan} onChange={(e) => L.pan(l.id, +e.target.value)} onDoubleClick={() => L.pan(l.id, 0)} aria-label={`${l.name} pan`} aria-valuetext={fmtPan(l.pan)} />
              <span>{fmtPan(l.pan)}</span>
            </label>
          </div>
        </div>
        {menu ? (
          <div className={cx(v.pop, v.menu)} style={{ left: 120, top: 40 }} role="menu">
            <button role="menuitem" onClick={() => { setMenu(null); setEditing(true); }}>Rename</button>
            <button role="menuitem" disabled={!sameFam(i - 1)} onClick={() => L.move(l.id, -1)}>Move up <kbd>⌥↑</kbd></button>
            <button role="menuitem" disabled={!sameFam(i + 1)} onClick={() => L.move(l.id, 1)}>Move down <kbd>⌥↓</kbd></button>
            <hr />
            <button role="menuitem" className={v.danger} onClick={() => { setMenu(null); L.remove(l.id); }}>Remove lane{l.blocks.length ? ` and ${l.blocks.length} blocks` : ""}</button>
          </div>
        ) : null}
      </div>
      <LaneBody lanes={[l]} silent={L.silent} h={52} dim={!!held && !match} target={match} onDrop={match ? onDrop : undefined}
        ghost={match && held ? { bar: DROP_BAR, bars: held.bars, name: held.name } : null} />
    </div>
  );
}

function Crate({ tab, setTab, L, held, setHeld }: { tab: string; setTab: (t: string) => void; L: Lanes; held: MySound | null; setHeld: (s: MySound | null) => void }) {
  const show = held ?? null;
  return (
    <aside className={v.crate}>
      <div className={v.deck} style={{ ["--c" as string]: show ? colorOf(show.type) : undefined }}>
        <div className={v.record}><i /></div>
        <div style={{ minWidth: 0 }}><b>{show ? show.name : "—"}</b><em>{show ? `${show.bars} bars · from ${show.from}` : "Click a sound to hear it"}</em></div>
      </div>
      <div className={v.browse}>
        <div className={v.tabs} role="tablist">
          <button role="tab" aria-selected={tab === "mine"} className={cx(v.tab, tab === "mine" && v.tabOn)} onClick={() => setTab("mine")}>My sounds<span className={v.tabCount}>{L.library.length}</span></button>
          {FAMILIES.map((f) => <button key={f.id} role="tab" aria-selected={tab === f.id} className={cx(v.tab, tab === f.id && v.tabOn)} onClick={() => setTab(f.id)}>{f.name}</button>)}
        </div>
        {tab === "mine" ? (
          <div className={v.grid3}>
            {L.library.map((s) => (
              <SoundItem key={s.id} s={s} held={held?.id === s.id} onDragStart={() => setHeld(s)} onDragEnd={() => setHeld(null)} />
            ))}
          </div>
        ) : (
          <p className={v.hint}>The built-in {FAMILIES.find((f) => f.id === tab)?.name} sounds, as in today’s crate.</p>
        )}
      </div>
    </aside>
  );
}
