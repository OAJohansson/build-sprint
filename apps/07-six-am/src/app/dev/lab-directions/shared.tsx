"use client";

// Shared rough pieces for the Lab directions: the app bar, the track head, the Deck status, the
// part lanes (the map's timeline with four separated parts) and a knob. Dev only.
import { useState, type CSSProperties, type ReactNode } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { NOW, PARTS, SECTIONS, SOLO, TRACK, pct, w, type Part, type PartId } from "./data";
import s from "./lab.module.css";

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
        <p>{TRACK.artist} · {TRACK.bpm} BPM · {TRACK.key} · {TRACK.length} · {TRACK.bars} bars</p>
      </div>
      <div className={s.actions}>{children}</div>
    </div>
  );
}

/** The Deck: where SoundCloud plays (a separate window). Connected, playing, parts ~5 s behind. */
export function Deck({ look = "line" }: { look?: "line" | "pill" | "block" }) {
  const [playing, setPlaying] = useState(true);
  if (look === "block")
    return (
      <div className={s.deckBlock}>
        <div className={s.deckRow}><i className={s.dot} /> <b>Deck</b> connected</div>
        <div className={s.deckRow}>
          <button className={s.round} onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause the Deck" : "Play the Deck"}>{playing ? "❚❚" : "▶"}</button>
          <span className={s.muted}>bar {NOW.bar} · {NOW.clock} · you hear it 5 s late</span>
        </div>
      </div>
    );
  return (
    <div className={look === "pill" ? s.deckPill : s.deckLine}>
      <i className={s.dot} aria-hidden />
      <span>Deck {playing ? "playing" : "paused"}</span>
      <button className={s.textBtn} onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button>
    </div>
  );
}

export type LaneState = Record<PartId, "solo" | "on" | "off">;
export const soloState = (id: PartId = SOLO): LaneState =>
  Object.fromEntries(PARTS.map((p) => [p.id, p.id === id ? "solo" : "off"])) as LaneState;

/** The map's timeline with the four parts. Click a name to solo it. */
export function Lanes({
  state, onSolo, laneH = 84, label = 128, sm = true, only, compact,
}: {
  state: LaneState; onSolo?: (id: PartId) => void; laneH?: number; label?: number; sm?: boolean; only?: PartId[]; compact?: boolean;
}) {
  const parts = only ? PARTS.filter((p) => only.includes(p.id)) : PARTS;
  return (
    <div className={s.grid} style={{ gridTemplateColumns: label ? `${label}px minmax(0,1fr)` : "minmax(0,1fr)", gridTemplateRows: `${compact ? 30 : 44}px repeat(${parts.length}, ${laneH}px)` } as CSSProperties}>
      {label ? <div className={s.corner}>{compact ? "" : "Parts"}</div> : null}
      <div className={s.ruler}>
        {SECTIONS.map((x, i) => (
          <span key={i} className={s.sec} style={{ left: pct(x.from), width: w(x.from, x.to) }}>{x.name}</span>
        ))}
        {!compact && [1, 33, 65, 97, 129, 161, 193, 225].map((b) => <span key={b} className={s.num} style={{ left: pct(b) }}>{b}</span>)}
        <i className={`${s.playhead} ${s.playheadTop}`} style={{ left: pct(NOW.bar) }} />
      </div>
      {parts.map((p) => <Lane key={p.id} p={p} st={state[p.id]} onSolo={onSolo} sm={sm} head={!!label} />)}
    </div>
  );
}

function Lane({ p, st, onSolo, sm, head }: { p: Part; st: "solo" | "on" | "off"; onSolo?: (id: PartId) => void; sm: boolean; head: boolean }) {
  return (
    <>
      {head && <button className={s.lh} data-st={st} style={{ "--c": p.color } as CSSProperties} onClick={() => onSolo?.(p.id)} aria-pressed={st === "solo"}>
        {sm && <span className={s.sm}>{st === "solo" ? "solo" : st === "off" ? "muted" : ""}</span>}
        {p.name}
      </button>}
      <div className={s.lane} data-st={st}>
        {SECTIONS.slice(1).map((x) => <i key={x.from} className={s.secLine} style={{ left: pct(x.from) }} />)}
        {p.blocks.map(([a, b]) => <span key={a} className={s.block} style={{ left: pct(a), width: w(a, b), "--c": p.color } as CSSProperties} />)}
        <i className={s.playhead} style={{ left: pct(NOW.bar) }} />
      </div>
    </>
  );
}

/** A tiny one-line overview of the track: sections, playhead. */
export function Strip({ part }: { part?: Part }) {
  return (
    <div className={s.strip}>
      {SECTIONS.map((x, i) => <span key={i} className={s.stripSec} style={{ left: pct(x.from), width: w(x.from, x.to) }}>{x.name}</span>)}
      {part?.blocks.map(([a, b]) => <span key={a} className={s.stripBlock} style={{ left: pct(a), width: w(a, b), background: part.color }} />)}
      <i className={s.playhead} style={{ left: pct(NOW.bar) }} />
    </div>
  );
}

export function Knob({ name, value, hint, size = 56 }: { name: string; value: number; hint?: string; size?: number }) {
  const a0 = -135, a = a0 + 270 * value, r = size / 2 - 4, c = size / 2;
  const pt = (deg: number) => [c + r * Math.sin((deg * Math.PI) / 180), c - r * Math.cos((deg * Math.PI) / 180)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a), [xe, ye] = pt(135);
  return (
    <div className={s.knob}>
      <svg width={size} height={size} aria-hidden>
        <path d={`M${x0} ${y0} A${r} ${r} 0 1 1 ${xe} ${ye}`} fill="none" stroke="#2c2622" strokeWidth="3" strokeLinecap="round" />
        <path d={`M${x0} ${y0} A${r} ${r} 0 ${a - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`} fill="none" stroke="#f1e6d3" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span>{name}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export const part = (id: PartId) => PARTS.find((p) => p.id === id)!;
export { s };
