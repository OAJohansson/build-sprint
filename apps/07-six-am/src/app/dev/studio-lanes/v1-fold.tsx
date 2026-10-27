"use client";

// Direction 1, Fold, round 2 (picked: L194; critic round 1 = 6/10). Today's layout kept: lanes on
// top, the crate below. Every lane sits under its family row (one rule, one-lane families too); a
// family folds to one summary row. At rest a lane shows its name, M and S; hover or focus reveals
// volume and pan on their own line and a ⋯ menu (rename, move, remove). Flat clips. One accent in
// the bar (Play); bar · BPM · key as one 13 px string. Final pass: Filter knob removed (owner can ask it back).
// The crate: tabs and a small disc in one header row, the cards take the width.
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import st from "@/components/studio/studio.module.css";
import { DROP_BAR, FAMILIES, MY_SOUNDS, PLAYHEAD, TRACK, colorOf, fmtDb, fmtPan, type, type Lane, type MySound, type TypeId } from "./data";
import { LaneBody, Ruler, SoundItem, TypeList, cx, useLanes, v, type Lanes } from "./shared";

export function V1Fold({ state, worst }: { state: string; worst: boolean }) {
  const L = useLanes(worst, state === "fold" || state === "add" ? ["drums"] : []);
  const [held, setHeld] = useState<MySound | null>(state === "drop" ? MY_SOUNDS[0] : null);
  const placed = useRef(false);
  const [adding, setAdding] = useState<{ fam?: string } | null>(state === "add" ? {} : null);
  const [menu, setMenu] = useState<string | null>(null);
  const [tab, setTab] = useState("mine");
  const [scrolled, setScrolled] = useState(false);
  const reveal = state === "mix" ? "l4" : null;
  const hasTarget = held && L.lanes.some((l) => l.type === held.type);
  // The "dropped" state: Rubber sub already placed on Sub at the Break.
  useEffect(() => { if (state === "dropped" && !placed.current) { placed.current = true; L.drop("l4", MY_SOUNDS[0]); } }, [state, L]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(null); setAdding(null); } };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, []);

  return (
    <div className={cx(v.root, v.r2)}>
      <Bar2 />
      <div className={cx(v.tl, v.fadeEnd)} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
        <div className={cx(v.rowR, v.rulerRow, scrolled && v.rulerShadow)}>
          {/* The ruler's empty corner holds "+ Add lane", so it stays in view however many lanes there are. */}
          <div className={cx(v.gut, v.corner)}>
            <button className={v.addBtn} aria-expanded={!!adding} onClick={() => setAdding(adding ? null : {})}>+ Add lane</button>
            {adding ? (
              <div className={v.pop} style={{ left: 8, top: 34, width: 760 }} role="dialog" aria-label="Add a lane">
                <TypeList onPick={(t: TypeId) => { L.add(t); setAdding(null); }} />
              </div>
            ) : null}
          </div>
          <Ruler numbers dropBar={held ? DROP_BAR : null} dropColor={held ? colorOf(held.type) : undefined} /></div>
        {L.groups.map((g) => {
          const folded = L.fold.includes(g.id);
          return (
            <div key={g.id} style={{ ["--c" as string]: g.color }}>
              <div className={v.rowR}>
                <div className={v.gut} style={{ height: folded ? 34 : 20 }}>
                  <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                    <button className={cx(v.famHead, folded && v.folded)} onClick={() => L.toggleFold(g.id)} aria-expanded={!folded}>
                      <ChevronDown aria-hidden />{g.name}{folded ? <span className={v.famCount}>{g.lanes.length} {g.lanes.length === 1 ? "lane" : "lanes"}</span> : null}
                    </button>
                    <button className={v.famPlus} aria-label={`Add a ${g.name} lane`} onClick={() => setAdding({ fam: g.id })}>+</button>
                  </div>
                </div>
                {folded ? <LaneBody flat lanes={g.lanes} summary silent={L.silent} h={34} dim={!!held && held.type !== g.lanes[0].type} /> : <div className={v.famBody} />}
              </div>
              {!folded && g.lanes.map((l) => (
                <LaneRow key={l.id} l={l} L={L} reveal={reveal === l.id} menu={menu === l.id} setMenu={setMenu}
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
        <div className={v.rowR} style={{ flex: 1, minHeight: 56 }}><div className={v.gut} style={{ borderBottom: 0 }} /><div style={{ flex: 1 }} /></div>
      </div>
      <Crate tab={tab} setTab={setTab} L={L} held={held} setHeld={setHeld} />
    </div>
  );
}

/** The control bar, round 2: one accent (Play). Bar, BPM and key in 14 px mono, title colour. */
function Bar2() {
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
        <div className={v.facts}>bar {PLAYHEAD}.1 · {TRACK.bpm} bpm · {TRACK.key}</div>
        <button className={st.undo} aria-label="Undo"><svg viewBox="0 0 16 16" aria-hidden><path d="M6 3 2 7l4 4V8h4a3 3 0 0 1 0 6H8v2h2a5 5 0 0 0 0-10H6z" fill="currentColor" /></svg> <span className={st.undoWord}>Undo</span></button>
      </div>
      <SettingsLink />
    </header>
  );
}

function LaneRow({ l, L, reveal, menu, setMenu, held, onDrop }: {
  l: Lane; L: Lanes; reveal: boolean; menu: boolean; setMenu: (id: string | null) => void; held: MySound | null; onDrop: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const i = L.lanes.indexOf(l);
  const sameFam = (j: number) => L.lanes[j] && type(L.lanes[j].type).family === type(l.type).family;
  const match = held?.type === l.type;
  return (
    <div className={v.rowR} style={{ ["--c" as string]: colorOf(l.type) }}>
      <div className={cx(v.gut, v.r2Gut, reveal && v.reveal, !reveal && v.hideRest)} style={{ height: 56 }}
        onKeyDown={(e) => { if (e.altKey && e.key === "ArrowUp") L.move(l.id, -1); if (e.altKey && e.key === "ArrowDown") L.move(l.id, 1); }}>
        <i className={v.colorBar} style={{ left: 14 }} />
        <div className={v.laneHead}>
          <div className={v.line1}>
            {editing ? (
              <input className={v.nameInput} defaultValue={l.name} autoFocus maxLength={40} aria-label="Lane name"
                onBlur={(e) => { L.rename(l.id, e.target.value); setEditing(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false); }} />
            ) : (
              <button className={cx(v.name, v.r2Name)} onDoubleClick={() => setEditing(true)} onKeyDown={(e) => { if (e.key === "F2" || e.key === "Enter") setEditing(true); }} title={`${l.name} · ${type(l.type).name} · double-click to rename`}>{l.name}</button>
            )}
            <button className={cx(v.ms, v.msFirst, l.mute && v.r2MuteOn)} style={l.mute && !L.silent(l) ? { opacity: .45 } : undefined} onClick={() => L.mute(l.id)} aria-pressed={l.mute} aria-label={`Mute ${l.name}`}>M</button>
            <button className={cx(v.ms, l.solo && v.r2SoloOn)} onClick={() => L.solo(l.id)} aria-pressed={l.solo} aria-label={`Solo ${l.name}`}>S</button>
            <button className={v.more} onClick={() => setMenu(menu ? null : l.id)} aria-label={`More for ${l.name}`} aria-expanded={menu}>⋯</button>
          </div>
          <div className={v.mix}>
            <label className={v.mixItem} title="Volume">
              <input className={v.vol} type="range" min={-30} max={6} value={Math.max(-30, l.vol)} onChange={(e) => L.vol(l.id, +e.target.value)} aria-label={`${l.name} volume`} aria-valuetext={fmtDb(l.vol)} />
              <span className={v.mixVal}>{l.vol < -30 ? "−∞" : fmtDb(l.vol)}</span>
            </label>
            <label className={v.mixItem} title="Pan: left or right · double-click for centre">
              <input className={v.pan} type="range" min={-100} max={100} step={5} value={l.pan} onChange={(e) => L.pan(l.id, +e.target.value)} onDoubleClick={() => L.pan(l.id, 0)} aria-label={`${l.name} pan`} aria-valuetext={fmtPan(l.pan)} />
              <span>{fmtPan(l.pan)}</span>
            </label>
          </div>
        </div>
        {menu ? (
          <div className={cx(v.pop, v.menu)} style={{ left: 120, top: 44 }} role="menu">
            <button role="menuitem" onClick={() => { setMenu(null); setEditing(true); }}>Rename</button>
            <button role="menuitem" disabled={!sameFam(i - 1)} onClick={() => L.move(l.id, -1)}>Move up <kbd>⌥↑</kbd></button>
            <button role="menuitem" disabled={!sameFam(i + 1)} onClick={() => L.move(l.id, 1)}>Move down <kbd>⌥↓</kbd></button>
            <hr />
            <button role="menuitem" className={v.danger} onClick={() => { setMenu(null); L.remove(l.id); }}>Remove lane{l.blocks.length ? ` and ${l.blocks.length} blocks` : ""}</button>
          </div>
        ) : null}
      </div>
      <LaneBody flat lanes={[l]} silent={L.silent} h={56} dim={!!held && !match} target={match} onDrop={match ? onDrop : undefined}
        ghost={match && held ? { bar: DROP_BAR, bars: held.bars, name: held.name } : null} />
    </div>
  );
}

function Crate({ tab, setTab, L, held, setHeld }: { tab: string; setTab: (t: string) => void; L: Lanes; held: MySound | null; setHeld: (s: MySound | null) => void }) {
  return (
    <aside className={v.crate2}>
      <div className={v.crateHead}>
        <div className={v.tabs2} role="tablist">
          <button role="tab" aria-selected={tab === "mine"} className={cx(v.tab, tab === "mine" && v.tabOn)} onClick={() => setTab("mine")}>My sounds<span className={v.tabCount}>{L.library.length}</span></button>
          {FAMILIES.map((f) => <button key={f.id} role="tab" aria-selected={tab === f.id} className={cx(v.tab, tab === f.id && v.tabOn)} onClick={() => setTab(f.id)}>{f.name}</button>)}
        </div>
        <div className={v.nowPlaying} style={{ ["--c" as string]: held ? colorOf(held.type) : undefined }} aria-live="polite">
          <span className={cx(v.disc, held && v.discOn)} aria-hidden><i /></span>
          {held ? <span><b>{held.name}</b> · {held.bars} bars</span> : <span className={v.faint}>Click a sound to hear it</span>}
        </div>
      </div>
      {tab === "mine" ? (
        <div className={v.cards}>
          {L.library.map((s) => <SoundItem key={s.id} s={s} held={held?.id === s.id} onDragStart={() => setHeld(s)} onDragEnd={() => setHeld(null)} />)}
        </div>
      ) : (
        <p className={v.hint}>The built-in {FAMILIES.find((f) => f.id === tab)?.name} sounds, as in today’s crate.</p>
      )}
    </aside>
  );
}
