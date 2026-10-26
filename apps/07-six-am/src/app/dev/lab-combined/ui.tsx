"use client";

// Rough pieces for the combined Lab (dev only): app bar, head, Deck, transport, the controlled
// part lanes (state lives in lab.tsx so it survives the Listen/Make switch), the zoomed loop and
// the Make pieces. Data comes from context so the worst case enters at the same boundary.
import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { MACROS, PRESET, PRESETS, clock, type Data, type Part, type PartId, type Section } from "./data";
import s from "./lab.module.css";

export { s };

const Ctx = createContext<Data | null>(null);
export const DataProvider = Ctx.Provider;
export function useD() {
  const d = useContext(Ctx)!;
  const bars = d.track.bars;
  return {
    d,
    pct: (bar: number) => `${((bar - 1) / bars) * 100}%`,
    w: (from: number, to: number) => `${((to - from) / bars) * 100}%`,
    part: (id: PartId) => d.parts.find((p) => p.id === id)!,
    sectionAt: (bar: number) => d.sections.find((x) => bar >= x.from && bar < x.to) ?? d.sections[0],
    /** "Drop 1", "Drop 2" when a section name repeats; the plain name otherwise. */
    secName: (x: Section) => {
      const same = d.sections.filter((y) => y.name === x.name);
      return same.length > 1 ? `${x.name} ${same.indexOf(same.find((y) => y.from === x.from)!) + 1}` : x.name;
    },
  };
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={s.root}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}><SettingsLink /></div>
      </header>
      {children}
    </div>
  );
}

export function Head({ children }: { children?: ReactNode }) {
  const { d } = useD();
  const t = d.track;
  return (
    <div className={s.head}>
      <a className={s.back} href="#">← All tracks</a>
      <div className={s.title}>
        <h1 title={t.title}>{t.title}</h1>
        <p className={s.facts1} title={`${t.artist} · ${t.bpm} BPM · key ${t.key}`}><span className={s.artist}>{t.artist}</span><span>&nbsp;· {t.bpm}&nbsp;BPM · key {t.key}</span></p>
      </div>
      <div className={s.actions}>{children}</div>
    </div>
  );
}

export type DeckState = "closed" | "sharing" | "loading" | "ready";

export function DeckDot({ deck }: { deck: DeckState }) {
  const on = deck === "ready" || deck === "loading";
  return (
    <span className={s.deck} title="SoundCloud plays in the small Six AM Deck window; you hear the parts here">
      <i className={on ? s.dot : s.dotOff} aria-hidden />
      <span className={s.muted}>{on ? "Deck on" : "Deck off"}</span>
    </span>
  );
}

/** Position as a time and a place ("3:06 · in Drop 1", bar beside it), status, and the loop chip
 *  (only while a loop is on). */
export function Transport({ playing, onPlay, bar, loop, onClearLoop, status, disabled }: {
  playing: boolean; onPlay: () => void; bar: number; loop: Section | null; onClearLoop: () => void;
  status: ReactNode; disabled?: boolean;
}) {
  const { d, sectionAt, secName } = useD();
  const t = (b: number) => clock(b, d.track.bpm);
  return (
    <div className={s.transport}>
      <button className={s.play} onClick={onPlay} disabled={disabled} aria-label={playing ? "Pause" : "Play"}>{playing ? "❚❚" : "▶"}</button>
      <span className={s.clock}>{t(bar)} · in {secName(sectionAt(bar))} <small>bar {bar}</small></span>
      <span className={s.status} aria-live="polite">{status}</span>
      {loop && (
        <span className={s.loopChip}>
          Looping {secName(loop)} · {t(loop.from)}–{t(loop.to)}
          <button className={s.x} onClick={onClearLoop} aria-label={`Stop looping ${secName(loop)}`}>×</button>
        </span>
      )}
    </div>
  );
}

/** Who you hear: All, one part, or (Shift-click) two; "only" or "without" them. */
export type Hear = { parts: PartId[]; mode: "only" | "without" };
export function HearBar({ hear, setHear, disabled }: { hear: Hear; setHear: (h: Hear) => void; disabled?: boolean }) {
  const { d } = useD();
  const pick = (id: PartId, add: boolean) => {
    if (add && hear.parts.length && !hear.parts.includes(id)) return setHear({ ...hear, parts: [...hear.parts, id].slice(-2) });
    setHear({ ...hear, parts: hear.parts.length === 1 && hear.parts[0] === id ? [] : [id] });
  };
  return (
    <div className={s.hearBar} data-disabled={disabled ? "" : undefined}>
      <span className={s.hearLabel} id="hear-label">Hear</span>
      <div className={s.hearSeg} role="group" aria-labelledby="hear-label">
        <button aria-pressed={hear.parts.length === 0} onClick={() => setHear({ ...hear, parts: [] })} disabled={disabled}>All</button>
        {d.parts.map((p) => (
          <button key={p.id} aria-pressed={hear.parts.includes(p.id)} style={{ "--c": p.color } as CSSProperties} disabled={disabled}
            onClick={(e) => pick(p.id, e.shiftKey)} title="Shift-click to pick two">
            <i aria-hidden />{p.name}
          </button>
        ))}
      </div>
      <div className={s.hearMode} role="group" aria-label="Only or without">
        <button aria-pressed={hear.mode === "only"} onClick={() => setHear({ ...hear, mode: "only" })} disabled={disabled}>only</button>
        <button aria-pressed={hear.mode === "without"} onClick={() => setHear({ ...hear, mode: "without" })} disabled={disabled}>without</button>
      </div>
      <span className={s.hearNow} aria-live="polite">{hearText(hear, d.parts)}</span>
    </div>
  );
}
export function hearText(h: Hear, parts: Part[]) {
  if (!h.parts.length) return "Everything";
  const names = h.parts.map((id) => parts.find((p) => p.id === id)!.name.toLowerCase()).join(" and ");
  return h.mode === "only" ? `Only the ${names}` : `Everything without the ${names}`;
}

/** "on": you hear it (in its colour); "dim": you don't (neutral, the same for every lane). */
export type LaneState = Record<PartId, "on" | "dim">;

type LanesProps = {
  st: LaneState; focus: PartId;
  bar: number; onSeek: (bar: number) => void; catching: boolean;
  loop: Section | null; onLoop: (x: Section) => void;
  overlay?: (id: PartId) => ReactNode; disabled?: boolean;
};

const LABEL = 200;
export const TIMELINE_PX = 1240; // shortcut: the 1440 layout's timeline width, used to pick label sizes; measure it if the Lab gets other widths.
const CODES: Record<string, string> = { breakdown: "Brk", "interlude (long version)": "Int", interlude: "Int", "beatless outro": "Out 2", build: "Bld", outro: "Out", intro: "Intro", drop: "Drop" };

/** The map's timeline, filling the space below the head. Click to seek, a section to loop it, a
 *  part name to solo it. ←/→ on the ruler seek by 4 bars. */
export function Lanes(p: LanesProps) {
  const { d, pct, w } = useD();
  const bars = d.track.bars;
  const px = (from: number, to: number) => ((to - from) / bars) * TIMELINE_PX;
  const seekAt = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    p.onSeek(Math.max(1, Math.min(bars, Math.round(1 + ((e.clientX - r.left) / r.width) * bars))));
  };
  // Chord names need ~24px per 8-bar cell. On long tracks the cells stay as ticks with the chord on
  // hover, and only the chord at each section start is written.
  const narrow = (TIMELINE_PX * 8) / bars < 24;
  const progressions = narrow ? d.sections.map((x) => {
    const names = d.chords.filter((c) => c.from >= x.from && c.from < x.to).map((c) => c.name);
    return { ...x, text: names[0] ?? "" };
  }).filter((x) => x.text) : [];
  const tickStep = bars > 300 ? 64 : 32;
  const ticks = Array.from({ length: Math.floor((bars - 1) / tickStep) + 1 }, (_, i) => 1 + i * tickStep);
  // A section name that doesn't fit its width becomes a short fixed code, never an ellipsis.
  const label = (x: Section) => (x.name.length * 7.2 + 16 <= px(x.from, x.to) ? x.name : CODES[x.name.toLowerCase()] ?? x.name.slice(0, 3));
  return (
    <div className={s.grid} data-disabled={p.disabled ? "" : undefined} style={{ gridTemplateColumns: `${LABEL}px minmax(0,1fr)`, gridTemplateRows: `46px 26px repeat(${d.parts.length}, minmax(60px, 1fr))` } as CSSProperties}>
      <div className={s.corner} />
      <div className={s.ruler} onClick={seekAt} role="slider" tabIndex={0} aria-label="Playhead" aria-valuemin={1} aria-valuemax={bars} aria-valuenow={p.bar}
        onKeyDown={(e) => { if (e.key === "ArrowRight") p.onSeek(Math.min(bars, p.bar + 4)); if (e.key === "ArrowLeft") p.onSeek(Math.max(1, p.bar - 4)); }}>
        {p.loop && <i className={s.loopBand} style={{ left: pct(p.loop.from), width: w(p.loop.from, p.loop.to) }} />}
        {d.sections.map((x, i) => (
          <button key={i} className={s.sec} style={{ left: pct(x.from), width: w(x.from, x.to) }} title={`Loop ${x.name}, bars ${x.from}–${x.to - 1}`}
            onClick={(e) => { e.stopPropagation(); p.onLoop(x); }} aria-pressed={p.loop?.from === x.from} aria-label={`Loop ${x.name}, bars ${x.from} to ${x.to - 1}`}>
            {label(x)}
          </button>
        ))}
        {ticks.map((b) => <span key={b} className={s.num} style={{ left: pct(b) }}>{b}</span>)}
        <i className={`${s.playhead} ${s.playheadTop}`} data-catching={p.catching ? "" : undefined} style={{ left: pct(p.bar) }} />
      </div>
      <div className={s.lhChord}>Chords <small>est.</small></div>
      <div className={s.chordLane} onClick={seekAt}>
        {d.chords.map((c) => <span key={c.from} className={s.chord} title={`${c.name}, bars ${c.from}–${c.to - 1}`} style={{ left: pct(c.from), width: w(c.from, c.to) }}>{narrow ? "" : c.name}</span>)}
        {progressions.map((x) => <span key={x.from} className={s.prog} style={{ left: pct(x.from), width: w(x.from, x.to) }}>{x.text}</span>)}
        <i className={s.playhead} data-catching={p.catching ? "" : undefined} style={{ left: pct(p.bar) }} />
      </div>
      {d.parts.map((x) => <Lane key={x.id} x={x} {...p} seekAt={seekAt} />)}
    </div>
  );
}

function Lane({ x, st, focus, bar, loop, catching, overlay, seekAt }: LanesProps & { x: Part; seekAt: (e: React.MouseEvent<HTMLElement>) => void }) {
  const { pct, w } = useD();
  const state = st[x.id];
  const f = focus === x.id ? "" : undefined;
  const rows = x.subs.length ? x.subs : [{ name: "", blocks: x.blocks }];
  return (
    <>
      <div className={s.lh} data-st={state} data-focus={f} style={{ "--c": x.color } as CSSProperties}>
        <span className={s.lhName}>{x.name}</span>
        {x.subs.length > 0 && <span className={s.subList}>{x.subs.length} layers <i>est.</i></span>}
        {/* sub-layer names sit in the gutter, each level with its row in the lane */}
        {x.subs.length > 0 && <div className={s.lhSubs} aria-hidden>{x.subs.map((y) => <span key={y.name}>{y.name}</span>)}</div>}
      </div>
      <div className={s.lane} data-st={state} data-focus={f} onClick={seekAt}>
        {loop && <i className={s.loopShade} style={{ left: pct(loop.from), width: w(loop.from, loop.to) }} />}
        <div className={s.subs}>
          {rows.map((y, i) => (
            <div key={i} className={s.subRow}>
              {y.blocks.map(([a, b]) => <span key={a} className={s.subBlock} style={{ left: pct(a), width: w(a, b), "--c": x.color } as CSSProperties} />)}
            </div>
          ))}
        </div>
        <i className={s.playhead} data-catching={catching ? "" : undefined} style={{ left: pct(bar) }} />
        {overlay?.(x.id)}
      </div>
    </>
  );
}

/** The looping section as a short strip: chords, bar numbers, and the part's sub-layers. */
export function LoopStrip({ id, sec, bar }: { id: PartId; sec: Section; bar: number }) {
  const { d, part } = useD();
  const p = part(id);
  const len = sec.to - sec.from;
  const lpct = (b: number) => `${((b - sec.from) / len) * 100}%`;
  const lw = (a: number, b: number) => `${((b - a) / len) * 100}%`;
  const clip = (bl: [number, number][]) => bl.filter(([a, b]) => b > sec.from && a < sec.to).map(([a, b]) => [Math.max(a, sec.from), Math.min(b, sec.to)] as const);
  const rows = p.subs.length ? p.subs : [{ name: "", blocks: p.blocks }];
  const step = len > 32 ? 8 : 4;
  return (
    <div className={s.loopStrip} aria-label={`${p.name} alone, ${sec.name}, bars ${sec.from} to ${sec.to - 1}`}>
      <div className={s.lsRow} data-kind="chords">
        <span className={s.lsLabel}>chords est.</span>
        <div className={s.lsTrack}>
          {d.chords.filter((c) => c.from >= sec.from && c.from < sec.to).map((c) => <span key={c.from} className={s.lsChord} style={{ left: lpct(c.from) }}>{c.name}</span>)}
        </div>
      </div>
      <div className={s.lsRow} data-kind="bars">
        <span className={s.lsLabel}>bars</span>
        <div className={s.lsTrack}>
          {Array.from({ length: Math.ceil(len / step) }, (_, i) => sec.from + i * step).map((b) => <span key={b} className={s.lsNum} style={{ left: lpct(b) }}>{b}</span>)}
        </div>
      </div>
      {rows.map((x, i) => (
        <div key={i} className={s.lsRow}>
          <span className={s.lsLabel}>{x.name ? `${x.name} est.` : p.name.toLowerCase()}</span>
          <div className={s.lsTrack}>
            {clip(x.blocks).map(([a, b]) => <span key={a} className={s.lsClip} style={{ left: lpct(a), width: lw(a, b), background: p.color }} />)}
          </div>
        </div>
      ))}
      <div className={s.lsHeadBox} aria-hidden>{bar >= sec.from && bar < sec.to && <i className={s.zoomHead} style={{ left: lpct(bar) }} />}</div>
    </div>
  );
}

export function Knob({ name, value, hint, sug, size = 56, color = "#f1e6d3" }: { name: string; value: number; hint?: string; sug?: number; size?: number; color?: string }) {
  const a0 = -135, a = a0 + 270 * value, r = size / 2 - 4, c = size / 2;
  const pt = (deg: number, rr = r) => [c + rr * Math.sin((deg * Math.PI) / 180), c - rr * Math.cos((deg * Math.PI) / 180)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a), [xe, ye] = pt(135);
  const sa = sug !== undefined ? a0 + 270 * sug : null;
  return (
    <div className={s.knob} role="slider" tabIndex={0} aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-valuetext={hint}>
      <svg width={size} height={size} aria-hidden>
        <path d={`M${x0} ${y0} A${r} ${r} 0 1 1 ${xe} ${ye}`} fill="none" stroke="rgba(241,230,211,.25)" strokeWidth="2" strokeLinecap="round" />
        {value <= 0.005 && <circle cx={x0} cy={y0} r="2" fill={color} />}
        {value > 0.005 && <path d={`M${x0} ${y0} A${r} ${r} 0 ${a - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {sa !== null && (() => { const [p1, q1] = pt(sa, r + 4), [p2, q2] = pt(sa, r - 4); return <line x1={p1} y1={q1} x2={p2} y2={q2} stroke="#f2b134" strokeWidth="2.5" strokeLinecap="round" />; })()}
      </svg>
      <span>{name}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Macros({ size = 64, color }: { size?: number; color?: string }) {
  return <div className={s.macros}>{MACROS.map((k) => <Knob key={k.name} {...k} size={size} color={color} />)}</div>;
}

export function AB({ partName, ab, setAb }: { partName: string; ab: "a" | "b"; setAb: (x: "a" | "b") => void }) {
  return (
    <div className={s.abWrap}>
      <div className={s.ab} role="group" aria-label="Compare at the same loudness">
        <button aria-pressed={ab === "a"} onClick={() => setAb("a")}>A · Original {partName}</button>
        <button aria-pressed={ab === "b"} onClick={() => setAb("b")}>B · Mine</button>
      </div>
      <span className={s.faint}>same loudness</span>
    </div>
  );
}

/** The preset name opens a menu of tagged starting points; describing one in words is its last item. */
export function PresetHead({ partName, initialOpen = false }: { partName: string; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <div className={s.preset}>
      <button className={s.presetName} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        aria-label={`Preset: ${PRESET.name}. Change preset`}>{PRESET.name} <span aria-hidden>▾</span></button>
      {open && (
        <div className={s.menu} role="menu" aria-label="Presets">
          {PRESETS.map((x) => (
            <button key={x.name} role="menuitemradio" aria-checked={x.name === PRESET.name} className={s.menuItem} onClick={() => setOpen(false)}>
              <span className={s.menuCheck} aria-hidden>{x.name === PRESET.name ? "✓" : ""}</span>
              <span>{x.name}</span>
              <small>{x.tags.join(" · ")}</small>
            </button>
          ))}
          <i className={s.menuRule} aria-hidden />
          <button role="menuitem" className={s.menuItem} onClick={() => setOpen(false)}>
            <span className={s.menuCheck} aria-hidden />
            <span>Describe a {partName} in words…</span>
          </button>
        </div>
      )}
    </div>
  );
}
