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
      {loop && <button className={s.loopChip} onClick={onClearLoop} aria-label={`Stop looping ${loop.name}`}>⟲ {loop.name} · {loop.from}–{loop.to - 1} <span aria-hidden>×</span></button>}
    </div>
  );
}

export type LaneState = Record<PartId, "solo" | "on" | "off" | "dim">;

type LanesProps = {
  st: LaneState; onSolo: (id: PartId) => void; onMute: (id: PartId) => void;
  bar: number; onSeek: (bar: number) => void; catching: boolean;
  loop: Section | null; onLoop: (x: Section) => void;
  overlay?: (id: PartId) => ReactNode; after?: { id: PartId; node: ReactNode } | null;
  onMake?: () => void; disabled?: boolean;
};

const LABEL = 200;

/** The map's timeline, filling the space below the head. Click to seek, a section to loop it, a
 *  part name to solo it. ←/→ on the ruler seek by 4 bars. */
export function Lanes(p: LanesProps) {
  const { d, pct, w } = useD();
  const bars = d.track.bars;
  const seekAt = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    p.onSeek(Math.max(1, Math.min(bars, Math.round(1 + ((e.clientX - r.left) / r.width) * bars))));
  };
  // Chord names need ~24px per 8-bar cell. On long tracks the cells stay as ticks and each section
  // shows its progression once ("Am F C G"), so no chord is hidden or misplaced.
  const narrow = (1240 * 8) / bars < 24;
  const progressions = narrow ? d.sections.map((x) => {
    const names = d.chords.filter((c) => c.from >= x.from && c.from < x.to).map((c) => c.name);
    return { ...x, text: names.slice(0, 4).join(" ") };
  }).filter((x) => x.text) : [];
  const tickStep = bars > 300 ? 64 : 32;
  const ticks = Array.from({ length: Math.floor((bars - 1) / tickStep) + 1 }, (_, i) => 1 + i * tickStep);
  const rows = ["46px", "26px"];
  d.parts.forEach((x) => { rows.push("minmax(60px, 1fr)"); if (p.after?.id === x.id) rows.push("auto"); });
  return (
    <div className={s.grid} data-disabled={p.disabled ? "" : undefined} style={{ gridTemplateColumns: `${LABEL}px minmax(0,1fr)`, gridTemplateRows: rows.join(" ") } as CSSProperties}>
      <div className={s.corner} />
      <div className={s.ruler} onClick={seekAt} role="slider" tabIndex={0} aria-label="Playhead" aria-valuemin={1} aria-valuemax={bars} aria-valuenow={p.bar}
        onKeyDown={(e) => { if (e.key === "ArrowRight") p.onSeek(Math.min(bars, p.bar + 4)); if (e.key === "ArrowLeft") p.onSeek(Math.max(1, p.bar - 4)); }}>
        {p.loop && <i className={s.loopBand} style={{ left: pct(p.loop.from), width: w(p.loop.from, p.loop.to) }} />}
        {d.sections.map((x, i) => (
          <button key={i} className={s.sec} style={{ left: pct(x.from), width: w(x.from, x.to) }} title={`Loop ${x.name}, bars ${x.from}–${x.to - 1}`}
            onClick={(e) => { e.stopPropagation(); p.onLoop(x); }} aria-pressed={p.loop?.from === x.from}>
            {x.name}
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
      {d.parts.map((x) => (
        <Lane key={x.id} x={x} {...p} seekAt={seekAt} last={p.after?.id === x.id} />
      ))}
    </div>
  );
}

function Lane({ x, st, bar, loop, catching, onSolo, onMute, onMake, overlay, after, seekAt, last }: LanesProps & { x: Part; seekAt: (e: React.MouseEvent<HTMLElement>) => void; last: boolean }) {
  const { pct, w } = useD();
  const state = st[x.id];
  const subs = x.subs.length ? x.subs : null;
  return (
    <>
      <div className={s.lh} data-st={state} style={{ "--c": x.color } as CSSProperties}>
        <div className={s.lhTop}>
          <button className={s.lhName} onClick={() => onSolo(x.id)} aria-pressed={state === "solo"}>{x.name}</button>
          <button className={s.sm} data-on={state === "solo" ? "" : undefined} onClick={() => onSolo(x.id)} aria-label={`Solo ${x.name}`} aria-pressed={state === "solo"}>S</button>
          <button className={s.sm} data-on={state === "off" ? "" : undefined} onClick={() => onMute(x.id)} aria-label={`Mute ${x.name}`} aria-pressed={state === "off"}>M</button>
        </div>
        <span className={s.subList}>{subs ? <>{subs.map((y) => y.name).join(" · ")} <i>est.</i></> : <i>no layers found</i>}</span>
        {onMake && state === "solo" && <button className={s.makeLink} onClick={onMake}>Make a {x.name.toLowerCase()} like this →</button>}
      </div>
      <div className={s.lane} data-st={state} onClick={seekAt}>
        {loop && <i className={s.loopShade} style={{ left: pct(loop.from), width: w(loop.from, loop.to) }} />}
        <div className={s.subs}>
          {(subs ?? [{ name: "", blocks: x.blocks }]).map((y, i) => (
            <div key={i} className={s.subRow}>
              {y.blocks.map(([a, b]) => <span key={a} className={s.subBlock} style={{ left: pct(a), width: w(a, b), "--c": x.color } as CSSProperties} />)}
            </div>
          ))}
        </div>
        <i className={s.playhead} data-catching={catching ? "" : undefined} style={{ left: pct(bar) }} />
        {overlay?.(x.id)}
      </div>
      {last && after?.node}
    </>
  );
}

/** The looping section, zoomed: one part's estimated sub-layers and the chords. */
export function Zoom({ id, sec, bar }: { id: PartId; sec: Section; bar: number }) {
  const { d, part } = useD();
  const p = part(id);
  const lpct = (b: number) => `${((b - sec.from) / (sec.to - sec.from)) * 100}%`;
  const lw = (a: number, b: number) => `${((b - a) / (sec.to - sec.from)) * 100}%`;
  const clip = (bl: [number, number][]) => bl.filter(([a, b]) => b > sec.from && a < sec.to).map(([a, b]) => [Math.max(a, sec.from), Math.min(b, sec.to)] as const);
  const rows = p.subs.length ? p.subs : [{ name: p.name.toLowerCase(), blocks: p.blocks }];
  return (
    <div className={s.zoom}>
      <div className={s.zoomHeadBox}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => <i key={i} className={s.zoomBarLine} style={{ left: `${(i / 8) * 100}%` }} />)}
      </div>
      <div className={s.zoomRow}>
        <span className={s.zoomLabel}>chords <i>est.</i></span>
        {d.chords.filter((c) => c.from >= sec.from && c.from < sec.to).map((c) => <span key={c.from} className={s.zoomChord} style={{ left: lpct(c.from), width: lw(c.from, Math.min(c.to, sec.to)) }}>{c.name}</span>)}
      </div>
      {rows.map((x) => (
        <div key={x.name} className={s.zoomRow} style={{ flex: 2 }}>
          <span className={s.zoomLabel}>{x.name} {p.subs.length ? <i>est.</i> : null}</span>
          {clip(x.blocks).map(([a, b]) => <span key={a} className={s.zoomBlock} style={{ left: lpct(a), width: lw(a, b), background: p.color }} />)}
        </div>
      ))}
      <div className={s.zoomHeadBox}>
        {bar >= sec.from && bar < sec.to && <i className={s.zoomHead} style={{ left: lpct(bar) }} />}
      </div>
    </div>
  );
}

export function Knob({ name, value, hint, sug, size = 56 }: { name: string; value: number; hint?: string; sug?: number; size?: number }) {
  const a0 = -135, a = a0 + 270 * value, r = size / 2 - 4, c = size / 2;
  const pt = (deg: number, rr = r) => [c + rr * Math.sin((deg * Math.PI) / 180), c - rr * Math.cos((deg * Math.PI) / 180)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a), [xe, ye] = pt(135);
  const sa = sug !== undefined ? a0 + 270 * sug : null;
  return (
    <div className={s.knob} role="slider" tabIndex={0} aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-valuetext={hint}>
      <svg width={size} height={size} aria-hidden>
        <path d={`M${x0} ${y0} A${r} ${r} 0 1 1 ${xe} ${ye}`} fill="none" stroke="#2c2622" strokeWidth="3" strokeLinecap="round" />
        <path d={`M${x0} ${y0} A${r} ${r} 0 ${a - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`} fill="none" stroke="#f1e6d3" strokeWidth="3" strokeLinecap="round" />
        {sa !== null && (() => { const [p1, q1] = pt(sa, r + 4), [p2, q2] = pt(sa, r - 4); return <line x1={p1} y1={q1} x2={p2} y2={q2} stroke="#f2b134" strokeWidth="2.5" strokeLinecap="round" />; })()}
      </svg>
      <span>{name}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Macros({ size = 64 }: { size?: number }) {
  return <div className={s.macros}>{MACROS.map((k) => <Knob key={k.name} {...k} size={size} />)}</div>;
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
  return (
    <div className={s.preset}>
      <button className={s.presetName} aria-label={`Preset: ${PRESET.name}. Change preset`}>{PRESET.name} <span aria-hidden>▾</span></button>
      <span className={s.tags}>{PRESET.tags.map((t) => <i key={t}>{t}</i>)}</span>
    </div>
  );
}
