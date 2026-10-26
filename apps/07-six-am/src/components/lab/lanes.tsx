"use client";

// The Lab's map (S1, Listen): ruler (seek; a section click loops it), chord lane, four part lanes
// with estimated sub-layers, hover icons to hear only / mute a part (option B, L177), one dimming
// rule, and the playhead. The playhead's position comes from the CSS variable --ph on the grid, set
// by the Lab every frame, so the lanes don't re-render as it moves.
import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PartName } from "@/lib/lab/live";
import { chordCells, type LabPart, type LabSection } from "@/lib/lab/view";
import { BARS_PER_CHORD } from "@/lib/lab/chords";
import { HATS_ROW, KICK_ROW, laneBlocks } from "@/lib/lab/activity";
import type { Block } from "@/lib/map/view";
import s from "./lab.module.css";

/** What you hear (L177): everything, only some parts (headphones), or everything without some (speaker). */
export type Hear = { kind: "all" } | { kind: "only"; parts: PartName[] } | { kind: "mute"; parts: PartName[] };
export const heardParts = (h: Hear, ids: PartName[]) => ids.map((id) => h.kind === "all" || (h.kind === "only" ? h.parts.includes(id) : !h.parts.includes(id)));

const Phones = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><path d="M2.5 10V8a5.5 5.5 0 0 1 11 0v2" fill="none" stroke="currentColor" strokeWidth="1.4" /><rect x="1.8" y="9.3" width="3" height="4.6" rx="1" fill="currentColor" /><rect x="11.2" y="9.3" width="3" height="4.6" rx="1" fill="currentColor" /></svg>
);
const Speaker = ({ off }: { off?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="currentColor" />{off ? <path d="M10.5 5.5l4 5m0-5l-4 5" stroke="currentColor" strokeWidth="1.4" /> : <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.4" />}</svg>
);

/** The chip by Play while you're not hearing everything: "Only Bass ×" / "Bass muted ×". */
export function HearChip({ hear, parts, onClear }: { hear: Hear; parts: LabPart[]; onClear: () => void }) {
  if (hear.kind === "all") return null;
  const names = hear.parts.map((id) => parts.find((p) => p.id === id)?.name ?? id).join(", ");
  const text = hear.kind === "only" ? `Only ${names}` : `${names} muted`;
  return (
    <span className={s.hearChip}>
      {text}
      <button className={s.x} onClick={onClear} aria-label={`${text}: hear everything again`}>×</button>
    </span>
  );
}

const LABEL = 200;
const PART_ORDER: PartName[] = ["drums", "bass", "other", "vocals"];
const CODES: Record<string, string> = { breakdown: "Brk", build: "Bld", outro: "Out", intro: "Intro", drop: "Drop", groove: "Grv", break: "Brk", section: "Sec" };

type LanesProps = {
  bars: number;
  sections: LabSection[];
  parts: LabPart[];
  chords: (string | null)[];
  /** The separated parts' levels per bar as heard (drums, bass, other, vocals), or null. */
  levels: (number | null)[][] | null;
  hear: Hear;
  focus: PartName;
  onOnly: (id: PartName) => void;
  onMute: (id: PartName) => void;
  /** Seek to a 1-based bar; ←/→ on the ruler move 4 bars from `bar`. */
  onSeek: (bar: number) => void;
  bar: number;
  /** The looped bars (1-based, `to` exclusive), or null. */
  loop: { from: number; to: number } | null;
  onLoop: (x: LabSection) => void;
  catching: boolean;
  dimmed: boolean;
  /** Drawn inside the focus lane: the Mentor's dots, "+ Ask" and the open card (S2). */
  overlay?: ReactNode;
};

export const Lanes = memo(function Lanes(p: LanesProps) {
  const { bars } = p;
  const ruler = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState(1240);
  useEffect(() => {
    const el = ruler.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPx(e.contentRect.width || 1240));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pct = (bar: number) => `${((bar - 1) / bars) * 100}%`;
  const w = (from: number, to: number) => `${((to - from) / bars) * 100}%`;
  const seekAt = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    p.onSeek(Math.max(1, Math.min(bars, Math.floor(1 + ((e.clientX - r.left) / r.width) * bars))));
  };
  const cells = chordCells(p.chords, bars);
  // Chord names need ~24 px per 8-bar cell; narrower, only the chord at each section start is written.
  const narrow = (px * 8) / bars < 24;
  const progressions = narrow ? p.sections.map((x) => ({ ...x, text: cells.find((c) => c.from >= x.from && c.from < x.to)?.name ?? "" })).filter((x) => x.text) : [];
  const tickStep = bars > 300 ? 64 : 32;
  const ticks = Array.from({ length: Math.floor((bars - 1) / tickStep) + 1 }, (_, i) => 1 + i * tickStep);
  // A section name that doesn't fit becomes a short code, never an ellipsis (full name in its label).
  const label = (x: LabSection) => (x.label.length * 7.2 + 16 <= ((x.to - x.from) / bars) * px ? x.label : CODES[x.name.toLowerCase()] ?? x.name.slice(0, 3));
  // Every 8-bar cell (LS1-5): not heard yet (faint dash), heard without a clear chord (–), or a name.
  const allCells = p.chords.map((name, i) => ({ from: 1 + i * BARS_PER_CHORD, to: Math.min(1 + (i + 1) * BARS_PER_CHORD, bars + 1), name })).filter((c) => c.from <= bars);
  const anyHeard = p.chords.some((c) => c !== null);
  const loopedSection = p.loop ? p.sections.find((x) => p.loop!.from >= x.from && p.loop!.from < x.to) : null;
  const on = heardParts(p.hear, p.parts.map((x) => x.id));
  const head = <i className={s.playhead} data-catching={p.catching ? "" : undefined} style={{ left: "var(--ph, 0%)" }} />;
  return (
    <div className={s.grid} data-disabled={p.dimmed ? "" : undefined} style={{ gridTemplateColumns: `${LABEL}px minmax(0,1fr)`, gridTemplateRows: `46px 26px repeat(${p.parts.length}, minmax(60px, 1fr))` } as CSSProperties}>
      <div className={s.corner} />
      <div ref={ruler} className={s.ruler} onClick={seekAt} role="slider" tabIndex={0} aria-label="Playhead, bar" aria-valuemin={1} aria-valuemax={bars} aria-valuenow={Math.floor(p.bar)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); p.onSeek(Math.min(bars, Math.floor(p.bar) + 4)); }
          if (e.key === "ArrowLeft") { e.preventDefault(); p.onSeek(Math.max(1, Math.floor(p.bar) - 4)); }
        }}>
        {p.loop && <i className={s.loopBand} style={{ left: pct(p.loop.from), width: w(p.loop.from, p.loop.to) }} />}
        {p.sections.map((x) => (
          <button key={x.from} className={s.sec} style={{ left: pct(x.from), width: w(x.from, x.to) }} title={`Loop ${x.label}, bars ${x.from}–${x.to - 1}`}
            onClick={(e) => { e.stopPropagation(); p.onLoop(x); }} aria-pressed={loopedSection === x} aria-label={`Loop ${x.label}, bars ${x.from} to ${x.to - 1}`}>
            {label(x)}
          </button>
        ))}
        {ticks.map((b) => <span key={b} className={s.num} style={{ left: pct(b) }}>{b}</span>)}
        <i className={`${s.playhead} ${s.playheadTop}`} data-catching={p.catching ? "" : undefined} style={{ left: "var(--ph, 0%)" }} />
      </div>
      <div className={s.lhChord}>Chords <small>est.</small></div>
      <div className={s.chordLane} onClick={seekAt}>
        {!anyHeard && <span className={s.chordNote}>Chords fill in as you listen</span>}
        {anyHeard && allCells.map((c) => (
          <span key={c.from} className={s.chord} data-unheard={c.name === null ? "" : undefined}
            title={c.name === null ? `Not heard yet, bars ${c.from}–${c.to - 1}` : c.name ? `${c.name} (estimate), bars ${c.from}–${c.to - 1}` : `No clear chord, bars ${c.from}–${c.to - 1}`}
            style={{ left: pct(c.from), width: w(c.from, c.to) }}>{narrow ? "" : c.name === null ? "-" : c.name || "–"}</span>
        ))}
        {progressions.map((x) => <span key={x.from} className={s.prog} style={{ left: pct(x.from), width: w(x.from, x.to) }}>{x.text}</span>)}
        {head}
      </div>
      {p.parts.map((x, i) => (
        <Lane key={x.id} x={x} levels={p.levels?.[PART_ORDER.indexOf(x.id)] ?? null} bands={x.id === "drums" ? { kick: p.levels?.[KICK_ROW], hats: p.levels?.[HATS_ROW] } : undefined} on={on[i]} focus={p.focus === x.id} hear={p.hear} onOnly={p.onOnly} onMute={p.onMute} loop={p.loop} pct={pct} w={w} seekAt={seekAt} head={head}
          overlay={p.focus === x.id ? p.overlay : null} />
      ))}
    </div>
  );
});

function Lane({ x, levels, bands, on, focus, hear, onOnly, onMute, loop, pct, w, seekAt, head, overlay }: {
  x: LabPart; levels: (number | null)[] | null; bands?: Record<string, (number | null)[] | undefined>; on: boolean; focus: boolean; hear: Hear; onOnly: (id: PartName) => void; onMute: (id: PartName) => void;
  loop: { from: number; to: number } | null; pct: (b: number) => string; w: (a: number, b: number) => string;
  seekAt: (e: React.MouseEvent<HTMLElement>) => void; head: React.ReactNode; overlay: ReactNode;
}) {
  const state = on ? "on" : "dim";
  const f = focus ? "" : undefined;
  const only = hear.kind === "only" && hear.parts.includes(x.id);
  const muted = hear.kind === "mute" && hear.parts.includes(x.id);
  // LS1-N1: bars heard come from the separated part itself; the rest keep the map's estimate, faint.
  // LS1-N7: the drums' sub-rows (kick, hats) each get their own heard band when there is one.
  const part = levels ?? [];
  const rowLevels = (name: string) => { const b = bands?.[name]; return b && b.some((v) => v !== null) ? b : null; };
  const banded = x.subs.length > 0 && x.subs.every((y) => rowLevels(y.name));
  const heard = banded ? [] : laneBlocks(part, []).heard;
  const rows: { name: string; blocks: Block[]; heard: Block[] }[] = (x.subs.length ? x.subs : [{ name: "", blocks: x.blocks }]).map((y) => {
    const lv = banded ? rowLevels(y.name)! : part;
    const r = laneBlocks(lv, y.blocks);
    return { ...y, blocks: r.estimate, heard: banded ? r.heard : [] };
  });
  return (
    <>
      <div className={s.lh} data-st={state} data-focus={f} style={{ "--c": x.color } as CSSProperties}>
        <div className={s.lhTop}>
          <span className={s.lhName}>{x.name}</span>
          {/* Hover (or keyboard focus) shows the two icons; a lit one stays. */}
          <button className={s.hearIcon} data-lit={only ? "" : undefined} aria-pressed={only}
            onClick={() => onOnly(x.id)} aria-label={`Hear only ${x.name}`} title={`Hear only ${x.name}`}><Phones /></button>
          <button className={s.hearIcon} data-lit={muted ? "" : undefined} aria-pressed={muted}
            onClick={() => onMute(x.id)} aria-label={`Mute ${x.name}`} title={`Mute ${x.name}`}><Speaker off={muted} /></button>
        </div>
        <span className={s.subList} title="Estimated from the sound">{x.subs.length > 1 ? <>{x.subs.length} layers <i>est.</i></> : <>{x.hint} <i>est.</i></>}</span>
        {x.subs.length > 0 && <div className={s.lhSubs} aria-hidden>{x.subs.map((y) => <span key={y.name}>{y.name}</span>)}</div>}
      </div>
      <div className={s.lane} data-st={state} data-focus={f} onClick={seekAt}>
        {loop && <i className={s.loopShade} style={{ left: pct(loop.from), width: w(loop.from, loop.to) }} />}
        <div className={s.subs}>
          {rows.map((y, i) => (
            <div key={i} className={s.subRow}>
              {y.blocks.map((b) => (
                <span key={b.from} className={s.subBlock} data-est="" data-maybe={b.level === "maybe" ? "" : undefined}
                  title={`${y.name || x.name}, bars ${b.from}–${b.to - 1} (${b.level === "maybe" ? "maybe, " : ""}estimated; not heard yet)`}
                  style={{ left: pct(b.from), width: w(b.from, b.to), "--c": x.color } as CSSProperties} />
              ))}
              {y.heard.map((b) => (
                <span key={`h${b.from}`} className={s.subBlock} data-maybe={b.level === "maybe" ? "" : undefined}
                  title={`${y.name}, bars ${b.from}–${b.to - 1} (${b.level === "maybe" ? "quiet, " : ""}heard)`}
                  style={{ left: pct(b.from), width: w(b.from, b.to), "--c": x.color } as CSSProperties} />
              ))}
            </div>
          ))}
          {heard.length > 0 && (
            <div className={s.heardRow}>
              {heard.map((b) => (
                <span key={b.from} className={s.subBlock} data-maybe={b.level === "maybe" ? "" : undefined}
                  title={`${x.name}, bars ${b.from}–${b.to - 1} (${b.level === "maybe" ? "quiet, " : ""}heard)`}
                  style={{ left: pct(b.from), width: w(b.from, b.to), "--c": x.color } as CSSProperties} />
              ))}
            </div>
          )}
        </div>
        {head}
        {overlay}
      </div>
    </>
  );
}
