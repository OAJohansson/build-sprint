"use client";

// Copied from lab-directions-2 for the combined Listen/Make prototype (dev only). Shared rough pieces: app bar, track head, the Deck,
// the transport, the part lanes (4 soloable parts with estimated sub-layers, a chord lane, a
// section loop, click to seek), the Mentor exchange, and the Make pieces (preset, macros, A/B,
// Match it, save). Each direction stages these differently.
import { useState, type CSSProperties, type ReactNode } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import {
  ASK, CHORDS, LOOP, MACROS, MEASURED, MENTOR, NOW, PARTS, PRESET, SAVE_NAME, SAVE_TAGS, SECTIONS, SOLO, SUGGEST, TRACK,
  lpct, lw, pct, w, type Part, type PartId,
} from "./data";
import s from "./lab.module.css";

export { s };
export const part = (id: PartId) => PARTS.find((p) => p.id === id)!;

export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${s.root} ${className ?? ""}`}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}><SettingsLink /></div>
      </header>
      {children}
    </div>
  );
}

export function TrackHead({ children, small }: { children?: ReactNode; small?: boolean }) {
  return (
    <div className={s.head}>
      <a className={s.back} href="#">← Analyse</a>
      <div className={s.title}>
        <h1 className={small ? s.h1small : undefined}>{TRACK.title}</h1>
        <p>{TRACK.artist} · {TRACK.bpm} BPM · {TRACK.key} · {TRACK.length}</p>
      </div>
      <div className={s.actions}>{children}</div>
    </div>
  );
}

/** The Deck: the small window where SoundCloud plays. Off → open it; connected → a quiet dot. */
export function Deck({ connected = true }: { connected?: boolean }) {
  const [on, setOn] = useState(connected);
  if (!on)
    return (
      <span className={s.deck}>
        <i className={s.dotOff} aria-hidden />
        <span className={s.muted}>Deck closed</span>
        <button className={s.ghost} onClick={() => setOn(true)}>Open the Deck</button>
      </span>
    );
  return (
    <span className={s.deck} title="SoundCloud plays in the Six AM Deck window; you hear the parts">
      <i className={s.dot} aria-hidden />
      <span className={s.muted}>Deck connected</span>
    </span>
  );
}

/** Play/pause (drives the Deck), clock, loop chip. `catching` shows the after-seek state. */
export function Transport({ catching, compact }: { catching?: boolean; compact?: boolean }) {
  const [playing, setPlaying] = useState(true);
  const [loop, setLoop] = useState(true);
  return (
    <div className={s.transport}>
      <button className={s.play} onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>{playing ? "❚❚" : "▶"}</button>
      <span className={s.clock}>{NOW.clock} <span className={s.faint}>/ {TRACK.length}</span></span>
      {!compact && <span className={s.muted}>bar {NOW.bar} · {NOW.section} · {NOW.chord}</span>}
      {loop && <button className={s.loopChip} onClick={() => setLoop(false)} aria-label="Stop looping">⟲ {LOOP.name} · bars {LOOP.from}–{LOOP.to - 1} ×</button>}
      {catching && <span className={s.catching}>catching up…</span>}
    </div>
  );
}

export type LaneState = Record<PartId, "solo" | "on" | "off" | "dim">;
export const soloState = (id: PartId = SOLO): LaneState =>
  Object.fromEntries(PARTS.map((p) => [p.id, p.id === id ? "solo" : "dim"])) as LaneState;

type LanesProps = {
  laneH?: number; label?: number; subs?: "all" | "solo" | "none"; chords?: boolean; only?: PartId[];
  compact?: boolean; extra?: ReactNode; extraH?: number; onMake?: () => void;
};

/** The map's timeline: ruler with sections and the loop, a chord lane, four part lanes. Click the
 *  ruler or a lane to seek ("catching up…"), a section name to loop it, a part name to solo. */
export function Lanes({ laneH = 84, label = 148, subs = "all", chords = true, only, compact, extra, extraH = 0, onMake }: LanesProps) {
  const [st, setSt] = useState<LaneState>(soloState());
  const [bar, setBar] = useState(NOW.bar);
  const [loop, setLoop] = useState<{ from: number; to: number } | null>(LOOP);
  const [catching, setCatching] = useState(false);
  const parts = only ? PARTS.filter((p) => only.includes(p.id)) : PARTS;
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setBar(Math.max(1, Math.round(1 + ((e.clientX - r.left) / r.width) * TRACK.bars)));
    setCatching(true);
    setTimeout(() => setCatching(false), 1800); // shortcut: the real one waits for separation (~5 s)
  };
  const solo = (id: PartId) => setSt(st[id] === "solo" ? (Object.fromEntries(PARTS.map((p) => [p.id, "on"])) as LaneState) : soloState(id));
  const mute = (id: PartId) => setSt({ ...st, [id]: st[id] === "off" ? "on" : "off" });
  const rows = [compact ? 30 : 46, ...(chords ? [26] : []), ...parts.map(() => laneH), ...(extra ? [extraH] : [])];
  return (
    <div className={s.grid} style={{ gridTemplateColumns: label ? `${label}px minmax(0,1fr)` : "minmax(0,1fr)", gridTemplateRows: rows.map((r) => r + "px").join(" ") } as CSSProperties}>
      {label ? <div className={s.corner}>{catching ? <span className={s.catching}>catching up…</span> : compact ? "" : "Parts"}</div> : null}
      <div className={s.ruler} onClick={seek}>
        {loop && <i className={s.loopBand} style={{ left: pct(loop.from), width: w(loop.from, loop.to) }} />}
        {SECTIONS.map((x, i) => (
          <button key={i} className={s.sec} style={{ left: pct(x.from), width: w(x.from, x.to) }}
            onClick={(e) => { e.stopPropagation(); setLoop(loop?.from === x.from ? null : { from: x.from, to: x.to }); }}
            aria-pressed={loop?.from === x.from} title="Loop this section">
            {loop?.from === x.from ? "⟲ " : ""}{x.name}
          </button>
        ))}
        {!compact && [1, 33, 65, 97, 129, 161, 193, 225].map((b) => <span key={b} className={s.num} style={{ left: pct(b) }}>{b}</span>)}
        <i className={`${s.playhead} ${s.playheadTop}`} style={{ left: pct(bar) }} />
      </div>
      {chords && <>
        {label ? <div className={s.lhChord}>Chords <small>est.</small></div> : null}
        <div className={s.chordLane} onClick={seek}>
          {CHORDS.map((c) => <span key={c.from} className={s.chord} style={{ left: pct(c.from), width: w(c.from, c.to) }}>{c.name}</span>)}
          <i className={s.playhead} style={{ left: pct(bar) }} />
        </div>
      </>}
      {parts.map((p) => (
        <Lane key={p.id} p={p} st={st[p.id]} onMake={onMake} bar={bar} loop={loop} head={!!label} onSeek={seek} onSolo={solo} onMute={mute}
          showSubs={subs === "all" || (subs === "solo" && st[p.id] === "solo")} />
      ))}
      {extra}
    </div>
  );
}

function Lane({ p, st, bar, loop, head, showSubs, onSeek, onSolo, onMute, onMake }: {
  onMake?: () => void; p: Part; st: "solo" | "on" | "off" | "dim"; bar: number; loop: { from: number; to: number } | null; head: boolean; showSubs: boolean;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void; onSolo: (id: PartId) => void; onMute: (id: PartId) => void;
}) {
  return (
    <>
      {head && (
        <div className={s.lh} data-st={st} style={{ "--c": p.color } as CSSProperties}>
          <div className={s.lhTop}>
            <button className={s.lhName} onClick={() => onSolo(p.id)} aria-pressed={st === "solo"}>{p.name}</button>
            <button className={s.sm} data-on={st === "solo" ? "" : undefined} onClick={() => onSolo(p.id)} aria-label={`Solo ${p.name}`}>S</button>
            <button className={s.sm} data-on={st === "off" ? "" : undefined} onClick={() => onMute(p.id)} aria-label={`Mute ${p.name}`}>M</button>
          </div>
          {showSubs && <span className={s.subList}>{p.subs.map((x) => x.name).join(" · ")} <i>est.</i></span>}
          {onMake && st === "solo" && <button className={s.makeLink} onClick={onMake}>Make a {p.name.toLowerCase()} like this →</button>}
        </div>
      )}
      <div className={s.lane} data-st={st} onClick={onSeek}>
        {loop && <i className={s.loopShade} style={{ left: pct(loop.from), width: w(loop.from, loop.to) }} />}
        {SECTIONS.slice(1).map((x) => <i key={x.from} className={s.secLine} style={{ left: pct(x.from) }} />)}
        {showSubs ? (
          <div className={s.subs}>
            {p.subs.map((x) => (
              <div key={x.name} className={s.subRow}>
                {x.blocks.map(([a, b]) => <span key={a} className={s.subBlock} style={{ left: pct(a), width: w(a, b), "--c": p.color } as CSSProperties} />)}
              </div>
            ))}
          </div>
        ) : (
          p.blocks.map(([a, b]) => <span key={a} className={s.block} style={{ left: pct(a), width: w(a, b), "--c": p.color } as CSSProperties} />)
        )}
        <i className={s.playhead} style={{ left: pct(bar) }} />
      </div>
    </>
  );
}

/** A one-line overview of the song: sections, the soloed part, the loop and the playhead. */
export function Strip({ p = part(SOLO) }: { p?: Part }) {
  return (
    <div className={s.strip}>
      <i className={s.loopBand} style={{ left: pct(LOOP.from), width: w(LOOP.from, LOOP.to) }} />
      {SECTIONS.map((x, i) => <span key={i} className={s.stripSec} style={{ left: pct(x.from), width: w(x.from, x.to) }}>{x.name}</span>)}
      {p.blocks.map(([a, b]) => <span key={a} className={s.stripBlock} style={{ left: pct(a), width: w(a, b), background: p.color }} />)}
      <i className={s.playhead} style={{ left: pct(NOW.bar) }} />
    </div>
  );
}

/** Part chips: solo one part (a compact alternative to lane headers). */
export function PartChips({ withSubs }: { withSubs?: boolean }) {
  const [on, setOn] = useState<PartId>(SOLO);
  return (
    <div className={s.chips}>
      {PARTS.map((p) => (
        <button key={p.id} className={s.chip} aria-pressed={p.id === on} onClick={() => setOn(p.id)} style={{ "--c": p.color } as CSSProperties}>
          {p.name}{withSubs && p.id === on && <small> {p.subs.map((x) => x.name).join(" · ")} est.</small>}
        </button>
      ))}
    </div>
  );
}

export function Knob({ name, value, hint, sug, size = 56 }: { name: string; value: number; hint?: string; sug?: number; size?: number }) {
  const a0 = -135, a = a0 + 270 * value, r = size / 2 - 4, c = size / 2;
  const pt = (deg: number, rr = r) => [c + rr * Math.sin((deg * Math.PI) / 180), c - rr * Math.cos((deg * Math.PI) / 180)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a), [xe, ye] = pt(135);
  const sa = sug !== undefined ? a0 + 270 * sug : null;
  return (
    <div className={s.knob}>
      <svg width={size} height={size} aria-hidden>
        <path d={`M${x0} ${y0} A${r} ${r} 0 1 1 ${xe} ${ye}`} fill="none" stroke="#2c2622" strokeWidth="3" strokeLinecap="round" />
        <path d={`M${x0} ${y0} A${r} ${r} 0 ${a - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`} fill="none" stroke="#f1e6d3" strokeWidth="3" strokeLinecap="round" />
        {sa !== null && (() => { const [p1, q1] = pt(sa, r + 4), [p2, q2] = pt(sa, r - 4); return <line x1={p1} y1={q1} x2={p2} y2={q2} stroke="#f2b134" strokeWidth="2" strokeLinecap="round" />; })()}
      </svg>
      <span>{name}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Macros({ size = 56, n = 6, tight }: { size?: number; n?: number; tight?: boolean }) {
  return <div className={s.macros} style={tight ? { flexWrap: "nowrap", gap: 8 } : undefined}>{MACROS.slice(0, n).map((k) => <Knob key={k.name} {...k} size={size} />)}</div>;
}

/** Level-matched A/B: the soloed part's loop vs your sound. */
export function AB({ big }: { big?: boolean }) {
  const [ab, setAb] = useState<"orig" | "mine">("orig");
  return (
    <div className={s.abWrap}>
      <div className={big ? s.abBig : s.ab} role="group" aria-label="Compare">
        <button aria-pressed={ab === "orig"} onClick={() => setAb("orig")}>A · Original bass</button>
        <button aria-pressed={ab === "mine"} onClick={() => setAb("mine")}>B · Mine</button>
      </div>
      <span className={s.faint}>level-matched</span>
    </div>
  );
}

export function PresetHead() {
  return (
    <div className={s.preset}>
      <button className={s.presetName}>{PRESET.name} ▾</button>
      <span className={s.tags}>{PRESET.tags.map((t) => <i key={t}>{t}</i>)}</span>
    </div>
  );
}

/** "Match it" (AI patch matching, local) and the quieter AI loop. */
export function MatchRow({ loopLabel = "Loop from words" }: { loopLabel?: string }) {
  return (
    <div className={s.matchRow}>
      <button className={s.ghost}>✦ Match it</button>
      <button className={s.textBtn}>{loopLabel}</button>
    </div>
  );
}

export function Suggest() {
  return <p className={s.suggest}><span className={s.tick} aria-hidden /> Mentor: {SUGGEST}</p>;
}

export function SaveRow({ stacked }: { stacked?: boolean }) {
  return (
    <div className={stacked ? s.saveStack : s.save}>
      <input className={s.input} defaultValue={SAVE_NAME} aria-label="Name" />
      <span className={s.tags}>{SAVE_TAGS.map((t) => <i key={t}>{t}</i>)}</span>
      <button className={s.gold}>Save to library</button>
    </div>
  );
}

/** One Mentor exchange, aware of what's soloed and where. */
export function Mentor({ short, context = true, input = true }: { short?: boolean; context?: boolean; input?: boolean }) {
  return (
    <div className={s.mentorBox}>
      {context && <span className={s.ctx}>Mentor · hearing Bass alone · Drop · bar {NOW.bar}</span>}
      <p className={s.you}>{ASK}</p>
      <p className={s.mentor}>{short ? "Short A1 notes between the kicks, gone before the next one. That gap is the bounce. I can't hear tone, only pitch, timing and loudness." : MENTOR}</p>
      <span className={s.tags}>{MEASURED.map((t) => <i key={t}>{t}</i>)}</span>
      {input && <input className={s.ask} placeholder="Ask about the bass…" aria-label="Ask the Mentor" />}
    </div>
  );
}

/** The looping section, zoomed: the soloed part's estimated sub-layers and the chords. */
export function Zoom({ height = 120 }: { height?: number }) {
  const p = part(SOLO);
  const inLoop = (bl: [number, number][]) => bl.filter(([a, b]) => b > LOOP.from && a < LOOP.to).map(([a, b]) => [Math.max(a, LOOP.from), Math.min(b, LOOP.to)] as const);
  return (
    <div className={s.zoom} style={{ height }}>
      <div className={s.zoomRow}>
        <span className={s.zoomLabel}>chords <i>est.</i></span>
        {CHORDS.filter((c) => c.from >= LOOP.from && c.from < LOOP.to).map((c) => <span key={c.from} className={s.zoomChord} style={{ left: lpct(c.from), width: lw(c.from, c.to) }}>{c.name}</span>)}
      </div>
      {p.subs.map((x) => (
        <div key={x.name} className={s.zoomRow} style={{ flex: 2 }}>
          <span className={s.zoomLabel}>{x.name} <i>est.</i></span>
          {inLoop(x.blocks).map(([a, b]) => <span key={a} className={s.zoomBlock} style={{ left: lpct(a), width: lw(a, b), background: p.color }} />)}
        </div>
      ))}
      <div className={s.zoomHeadBox}><i className={s.zoomHead} style={{ left: lpct(NOW.bar) }} /></div>
    </div>
  );
}
