"use client";

// Rough pieces for the combined Lab (dev only): app bar, head, Deck, transport, the controlled
// part lanes (state lives in lab.tsx so it survives the Listen/Make switch), the zoomed loop and
// the Make pieces. Data comes from context so the worst case enters at the same boundary.
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { MACROS, PRESET, type Data, type Part, type PartId, type Section } from "./data";
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
      <a className={s.back} href="#">← Analyse</a>
      <div className={s.title}>
        <h1 title={t.title}>{t.title}</h1>
        <p title={t.artist}><span className={s.artist}>{t.artist}</span> · {t.bpm}&nbsp;BPM · {t.key}</p>
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

export function Transport({ playing, onPlay, bar, loop, onClearLoop, status, disabled }: {
  playing: boolean; onPlay: () => void; bar: string; loop: Section | null; onClearLoop: () => void;
  status: ReactNode; disabled?: boolean;
}) {
  return (
    <div className={s.transport}>
      <button className={s.play} onClick={onPlay} disabled={disabled} aria-label={playing ? "Pause" : "Play"}>{playing ? "❚❚" : "▶"}</button>
      <span className={s.clock}>{bar}</span>
      <span className={s.status} aria-live="polite">{status}</span>
      {loop && (
        <span className={s.loopText}>
          ⟲ {loop.name} {loop.from}–{loop.to - 1}
          <button className={s.x} onClick={onClearLoop} aria-label={`Stop looping ${loop.name}`}>×</button>
        </span>
      )}
    </div>
  );
}

export type LaneState = Record<PartId, "solo" | "on" | "off" | "dim">;

type LanesProps = {
  st: LaneState; onSolo: (id: PartId) => void; onMute: (id: PartId) => void;
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
  // Chord names need ~24px per 8-bar cell. On long tracks the cells stay as ticks and each section
  // shows its progression once ("Am F C G"), so no chord is hidden or misplaced.
  const narrow = (TIMELINE_PX * 8) / bars < 24;
  const progressions = narrow ? d.sections.map((x) => {
    const names = d.chords.filter((c) => c.from >= x.from && c.from < x.to).map((c) => c.name);
    return { ...x, text: names.slice(0, 4).join(" ") };
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

function Lane({ x, st, bar, loop, catching, onSolo, onMute, overlay, seekAt }: LanesProps & { x: Part; seekAt: (e: React.MouseEvent<HTMLElement>) => void }) {
  const { pct, w } = useD();
  const state = st[x.id];
  const rows = x.subs.length ? x.subs : [{ name: "", blocks: x.blocks }];
  return (
    <>
      <div className={s.lh} data-st={state} style={{ "--c": x.color } as CSSProperties}>
        <div className={s.lhTop}>
          <button className={s.lhName} onClick={() => onSolo(x.id)} aria-pressed={state === "solo"}>{x.name}</button>
          <button className={s.sm} data-on={state === "solo" ? "" : undefined} onClick={() => onSolo(x.id)} aria-label={`Solo ${x.name}`} aria-pressed={state === "solo"}>S</button>
          <button className={s.sm} data-on={state === "off" ? "" : undefined} onClick={() => onMute(x.id)} aria-label={`Mute ${x.name}`} aria-pressed={state === "off"}>M</button>
        </div>
        {x.subs.length > 0 && <span className={s.subList}>{x.subs.length} layers <i>est.</i></span>}
        {/* sub-layer names sit in the gutter, each level with its row in the lane */}
        {x.subs.length > 0 && <div className={s.lhSubs} aria-hidden>{x.subs.map((y) => <span key={y.name}>{y.name}</span>)}</div>}
      </div>
      <div className={s.lane} data-st={state} onClick={seekAt}>
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
        {(() => { const [p1, q1] = pt(a0, r + 4), [p2, q2] = pt(a0, r - 4); return <line x1={p1} y1={q1} x2={p2} y2={q2} stroke="rgba(241,230,211,.45)" strokeWidth="1.5" strokeLinecap="round" />; })()}
        {value > 0.005 && <path d={`M${x0} ${y0} A${r} ${r} 0 ${a - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        <circle cx={x1} cy={y1} r="3.5" fill={color} />
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

export function PresetHead() {
  return <button className={s.presetName} aria-label={`Preset: ${PRESET.name}. Change preset`}>{PRESET.name} <span aria-hidden>▾</span></button>;
}
