"use client";

// Phase 6 slice 1 (K4, design round 5 in /dev/chords-r4, L261, L262): the Chords row as one tile per
// cell (a bar, or half a bar when the chord changes inside it) with its name, its hits and its bar
// number, "?" where Make isn't sure; under the rows the listening panel, always open (first on the
// first unsure bar): the Track reference button, cards for Make's guess and its next alternatives
// (tap = hear it in the loop and put it in Mine), "All N X bars", "More chords" for the key's others.
// Labels say what things are; no how-to sentences (L262). Slice 2 (K5, K6): "Piano" opens the cell on the
// keys (tap a key = a note in or out, Mine plays it at once, the closest name shows) with "When it plays"
// under them (Short hits / Held, the hits on the 16ths, tap one to move or stretch it, tap a gap to add one).
import { useEffect, useRef } from "react";
import { ArrowLeft, AudioWaveform, Check, Pause, Piano, Play, RotateCcw } from "lucide-react";
import { flavour, moveHit, parseChord, prettyChord } from "@/lib/make/chords-mine";
import { chordFacts, type Role } from "@/lib/mentor/chord-facts";
import type { MelodyModel } from "./make-melody";
import c from "./chords.module.css";

type View = NonNullable<MelodyModel["chords"]>;
type Cell = View["cells"][number];

const barLabel = (cell: Cell, from: number | null) => {
  const n = from !== null ? from + cell.bar : cell.bar + 1;
  return cell.steps < 16 && cell.startStep % 16 !== 0 ? `${n}½` : `${n}`;
};

/** Polish (reverses CS1-12b): a half-bar name in full ("F♯sus4"), allowed to break between its root and its type. */
function TileName({ name }: { name: string }) {
  const p = prettyChord(name), r = /^[A-G][♭♯]?/.exec(p)?.[0] ?? p;
  return <>{r}<wbr />{p.slice(r.length)}</>;
}

/** A cell's chord times: stabs as short marks, a held chord as one long bar (16ths across the cell). */
function Hits({ hits, steps, beats = true }: { hits: Cell["hits"]; steps: number; beats?: boolean }) {
  const W = steps * 10;
  return (
    <svg className={c.hits} viewBox={`0 0 ${W} 10`} preserveAspectRatio="none" aria-hidden>
      {beats && [4, 8, 12].filter((b) => b < steps).map((b) => <line key={b} x1={b * 10} x2={b * 10} y1={0} y2={10} stroke="rgba(241,230,211,.12)" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
      {hits.map((x, k) => <rect key={k} x={x.at * 10 + 0.5} y={0} width={Math.max(4, x.len * 10 - 1.5)} height={10} rx={1} fill="#23b3a5" opacity={0.9} />)}
    </svg>
  );
}

/** The Chords row's tiles: two grid columns per bar, a half-bar cell spans one. */
export function ChordTiles({ v, from, bars, onOpen }: { v: View; from: number | null; bars: number; onOpen: (i: number) => void }) {
  const cols = Math.min(bars, 8) * 2;
  return (
    <div className={c.tiles} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} data-many={bars > 8 ? "" : undefined}>
      {v.cells.map((x) => {
        const half = x.steps < 16;
        return (
          <button key={x.i} className={c.tile} style={{ gridColumn: `span ${Math.max(1, Math.round(x.steps / 8))}` }} data-unsure={x.unsure ? "" : undefined}
            data-half={half ? "" : undefined} data-edited={x.edited ? "" : undefined} aria-expanded={v.open === x.i} onClick={() => onOpen(x.i)}
            title={x.edited ? `Your pick (Make heard ${prettyChord(x.guess)})` : undefined}
            aria-label={`Bar ${barLabel(x, from)}: ${x.name ? prettyChord(x.name) : "no chord"}${x.unsure ? ", Make isn't sure" : ""}${x.edited ? `, your pick (Make heard ${prettyChord(x.guess)})` : ""}. Change chord`}>
            <span className={c.tileName}>{x.name ? (half ? <TileName name={x.name} /> : prettyChord(x.name)) : "–"}</span>
            {x.unsure && <span className={c.unsure} title="Make isn't sure of this bar" aria-hidden>?</span>}
            {x.edited && <span className={c.edited} title="your pick" aria-hidden />}
            <span className={c.tileFoot}><Hits hits={x.hits} steps={x.steps} beats={!half} /><small>{barLabel(x, from)}</small></span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * T229 (replaces T219/T223's hand-rolled scroll): bring `el` into view the standard way. Its scroll
 * margins are the sticky rows' height and the sticky A/B bar's height (each plus 8 px), read when it is
 * called, then scrollIntoView({ block: "nearest" }): nothing moves when it is already in view. Called on
 * a panel's header when the panel opens, and on the action row after a pick.
 */
export function reveal(el: HTMLElement | null) {
  if (!el) return;
  const rows = document.querySelector<HTMLElement>("[data-sticky-rows]"), ab = document.querySelector<HTMLElement>("[data-sticky-ab]");
  el.style.scrollMarginTop = `${(rows?.offsetHeight ?? 0) + 8}px`;
  el.style.scrollMarginBottom = `${(ab?.offsetHeight ?? 0) + 8}px`;
  el.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/** T228: a chord on another root than the bar's is told apart by its role in this song, in plain words. */
const ROLE_MOOD: Record<Role, string> = { home: "home", away: "lifts away", pull: "pulls home", soft: "soft stand-in", borrowed: "a surprise colour", secondary: "leads on", outside: "adds tension" };
function moodOf(n: string, barRoot: number | null, key: { key: string; scale: "major" | "minor" } | null): string {
  const p = parseChord(n);
  if (!p || !key || barRoot === null || p.root === barRoot) return flavour(n);
  const f = chordFacts({ key: key.key, scale: key.scale, chord: n });
  if (!f) return flavour(n);
  return f.role === "secondary" && f.secondaryOf ? `leads to ${f.secondaryOf.replace(/^([A-G])b/, "$1♭").replace(/^([A-G])#/, "$1♯")}` : ROLE_MOOD[f.role];
}

/** The listening panel (K4): always open on one cell. */
export function ChordPanel({ m, from, playing, onAsk }: { m: MelodyModel; from: number | null; playing: boolean; onAsk?: (q: string, bar: number) => void }) {
  const v = m.chords;
  // CS1-7, T219: when a bar opens or More opens, the panel comes into view clear of the sticky rows and A/B.
  const headRef = useRef<HTMLDivElement>(null);
  const moreOpen = !!v?.more && !v.keys, openCell = v?.open ?? -1;
  // T229: the panel's header comes into view when a bar or More opens
  useEffect(() => { if (openCell >= 0) reveal(headRef.current); }, [openCell, moreOpen]);
  if (!v) return null;
  const cell = v.cells[v.open];
  if (!cell) return null;
  const cur = cell.name, where = barLabel(cell, from);
  const list = [...cell.cards, ...(cur && !cell.cards.includes(cur) ? [cur] : [])];
  const extra = v.more ? v.keyChords.filter((n) => !list.includes(n)) : [];
  const trackOn = playing && v.hear === "orig" && m.ab === "a";
  const card = (n: string) => {
    // S2-8: the same name with the owner's own notes isn't this card's chord: say so, no ✓.
    const own = cur === n && v.ownNotes, chosen = cur === n, on = playing && v.hear === n && m.ab === "b", guess = n === cell.guess, p = prettyChord(n);
    return (
      <button key={n} className={c.choice} aria-pressed={chosen} data-playing={on ? "" : undefined} onClick={() => m.tapCard(n, playing)}
        aria-label={`${p}${own ? ", your notes" : guess ? ", Make's guess" : ""}, ${moodOf(n, parseChord(cell.guess)?.root ?? null, v.key) || "a chord"}${chosen ? ", in Mine" : ""}. ${on ? "Pause" : "Hear it in the loop and use it"}`}>
        <span className={c.glyph} aria-hidden>{on ? <Pause size={13} /> : <Play size={13} />}</span>
        <span className={c.choiceText}>
          <small className={c.guessTag}>{own ? "Your notes" : guess ? "Make's guess" : "\u00a0"}</small>
          <span className={c.choiceName}>{p}</span>
          <small className={c.mood}>{moodOf(n, parseChord(cell.guess)?.root ?? null, v.key)}</small>
        </span>
        {chosen && <Check className={c.check} size={15} strokeWidth={2.5} aria-hidden />}
      </button>
    );
  };
  const n = v.twins + 1, twinP = v.twinName ? prettyChord(v.twinName) : "";
  const allBox = v.twins > 0 && cur ? (
    <label className={c.all} title={`Every bar Make heard as ${twinP}, or playing ${prettyChord(cur)} in Mine, changes with this one`}>
      <input type="checkbox" checked={v.all} onChange={(e) => m.setAll(e.target.checked)} /> {n === 2 ? `Both bars Make heard as ${twinP}` : `All ${n} bars Make heard as ${twinP}`}
    </label>
  ) : null;
  if (v.keys) return <KeysPanel m={m} v={v} where={where} allBox={allBox} />;
  return (
    <section className={c.panel} aria-label={`Bar ${where}: pick the chord that sounds like the track`}>
      <div ref={headRef} className={c.head}>
        <span className={c.where}>Bar {where}{cur && <> · <b className={c.curName}>{prettyChord(cur)}</b></>}</span>
        <b className={c.ask}>Which one sounds like the track?</b>
      </div>
      <div className={c.strip}>
        <button className={c.track} data-playing={trackOn ? "" : undefined} onClick={() => m.tapTrack(playing)}
          aria-label={trackOn ? `Stop the track's bar ${where}` : `Hear the track's bar ${where} as it is`} title="The track, as it is">
          {trackOn ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
          <AudioWaveform size={18} aria-hidden />
          <span>Track</span>
        </button>
        <div className={c.choices} role="group" aria-label="Chords to try">{list.map(card)}</div>
      </div>
      {/* CS1-6: shown whenever twins exist, before any pick, on by default per bar; CS1-7: the tools stay put, More's cards go under them. */}
      <div className={c.tools}>
        {allBox}
        <span className={c.grow} />
        {v.keyChords.length > 0 && (
          <button className={c.chip} aria-expanded={v.more} onClick={() => m.setMore(!v.more)} aria-label={v.more ? "Fewer chords" : "More chords that fit this song's key"}>
            {v.more ? "Fewer chords" : "More chords"}
          </button>
        )}
        <button className={c.chip} onClick={() => m.setPiano(true)} aria-label="Build the chord on a piano"><Piano size={15} aria-hidden /> Piano</button>
        {/* K10: the Mentor explains the open chord (the theory facts come from code, the Mentor writes the words). */}
        {onAsk && cur && m.labChord && (
          <button className={c.chip} onClick={() => onAsk(`Why does ${prettyChord(cur)} fit here?`, m.labChord!.barNo)} aria-label={`Ask the Mentor why ${prettyChord(cur)} fits in bar ${where}`}>Why it fits</button>
        )}
      </div>
      {extra.length > 0 && <div className={`${c.choices} ${c.extra}`} role="group" aria-label="More chords in this song's key">{extra.map(card)}</div>}
    </section>
  );
}

// ── Slice 2: the piano and the timing strip (design round 5, states "keys" and "timing") ─────────────

type V = NonNullable<MelodyModel["chords"]>;
const SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"], FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
const pcName = (m: number, flats: boolean) => (flats ? FLAT : SHARP)[((m % 12) + 12) % 12];
const noteName = (m: number, flats: boolean) => `${pcName(m, flats)}${Math.floor(m / 12) - 1}`;
const white = (m: number, d: -1 | 1) => { while (isBlack(m)) m += d; return m; };
/** Desktop: C3–E5, widened to hold the chord. */
const deskRange = (notes: number[]): [number, number] => [white(Math.min(48, ...notes.map((x) => x - 2)), -1), white(Math.max(76, ...notes.map((x) => x + 2)), 1)];
/** Phone: one and a half octaves from just under the chord (the prototype's phoneRange). */
const phoneRange = (notes: number[]): [number, number] => { const lo = white((notes.length ? Math.min(...notes) : 60) - 2, -1); return [lo, white(lo + 18, 1)]; };

function Keys({ notes, onToggle, lo, hi, flats, className }: { notes: number[]; onToggle: (m: number) => void; lo: number; hi: number; flats: boolean; className?: string }) {
  const all = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
  const whites = all.filter((x) => !isBlack(x)), blacks = all.filter(isBlack);
  const x = (m: number) => (isBlack(m) ? (whites.indexOf(m - 1) + 1) / whites.length : (whites.indexOf(m) + 0.5) / whites.length) * 100;
  return (
    <div className={`${c.keysWrap} ${className ?? ""}`}>
      <div className={c.keys} role="group" aria-label="The chord's notes on a keyboard">
        {whites.map((m) => <button key={m} className={c.white} data-midi={m} data-on={notes.includes(m) ? "" : undefined} aria-pressed={notes.includes(m)} aria-label={noteName(m, flats)} onClick={() => onToggle(m)} />)}
        {blacks.map((m) => <button key={m} className={c.black} data-midi={m} style={{ left: `${x(m)}%`, width: `${(0.62 / whites.length) * 100}%` }} data-on={notes.includes(m) ? "" : undefined} aria-pressed={notes.includes(m)} aria-label={noteName(m, flats)} onClick={() => onToggle(m)} />)}
      </div>
      <div className={c.keyNames} aria-hidden>
        {all.filter((m) => notes.includes(m) || (m % 12 === 0 && !notes.some((n) => Math.abs(n - m) <= 2))).map((m) => (
          <span key={m} style={{ left: `${x(m)}%` }} data-on={notes.includes(m) ? "" : undefined}>{notes.includes(m) ? pcName(m, flats) : noteName(m, flats)}</span>
        ))}
      </div>
    </div>
  );
}

const MOVES = [["earlier", "Earlier"], ["later", "Later"], ["shorter", "Shorter"], ["longer", "Longer"], ["remove", "Remove"]] as const;

function Timing({ m, t, sel }: { m: MelodyModel; t: V["timing"]; sel: number | null }) {
  const steps = t.steps, at = (st: number) => t.hits.findIndex((x) => st >= x.at && st < x.at + x.len);
  const beats = Array.from({ length: Math.max(1, Math.round(steps / 4)) }, (_, b) => b + 1);
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef<{ k: number; moved: boolean } | null>(null);
  const stepAt = (x: number) => { const r = strip.current?.getBoundingClientRect(); return r ? Math.max(0, Math.min(steps - 1, Math.floor(((x - r.left) / r.width) * steps))) : null; };
  const h = sel !== null ? t.hits[sel] : null;
  // N-1: on a short window, the moves come into view when a hit is picked.
  const movesRef = useRef<HTMLSpanElement>(null);
  const picked = h !== null;
  useEffect(() => {
    if (!picked) return;
    reveal(movesRef.current);
  }, [picked]);
  const why = (op: (typeof MOVES)[number][0]) => {
    if (!h || sel === null || moveHit(t.hits, sel, op, steps)) return undefined;
    return op === "longer" ? "No room: the hits after it already reach the bar's end" : op === "earlier" ? "Already at the bar's start, or the hit before is in the way"
      : op === "later" ? "The bar ends here, or the next hit is in the way" : op === "shorter" ? "Already one 16th long" : undefined;
  };
  return (
    <div className={c.timing}>
      <span className={c.label}>When it plays</span>
      <div className={c.presets} role="group" aria-label="Start from">
        <button aria-pressed={t.preset === "short"} onClick={() => m.presetHits("short")}>Short hits</button>
        <button aria-pressed={t.preset === "held"} onClick={() => m.presetHits("held")}>Held</button>
      </div>
      <div className={c.strip16}>
        <div ref={strip} className={c.sixteenths} style={{ gridTemplateColumns: `repeat(${steps}, 1fr)` }} role="group" aria-label="When it plays, in 16ths">
          {Array.from({ length: steps }, (_, st) => <i key={st} data-beat={st % 4 === 0 ? "" : undefined} />)}
          {Array.from({ length: steps }, (_, st) => at(st) < 0 && (
            <button key={`e${st}`} className={c.empty} style={{ left: `${(st / steps) * 100}%`, width: `${100 / steps}%` }} aria-label={`Add a hit on 16th ${st + 1}`} onClick={() => m.hitOp("add", st)} />
          ))}
          {t.hits.map((x, k) => (
            // S2-4b: a stable key, so the hit keeps focus while arrow keys move it
            <button key={`h${k}`} className={c.hit} data-sel={sel === k ? "" : undefined} style={{ left: `${((x.at + (x.off ?? 0)) / steps) * 100}%`, width: `${(Math.min(x.len, steps - x.at) / steps) * 100}%` }}
              aria-pressed={sel === k} aria-label={`Hit on 16th ${x.at + 1}, ${Math.round(x.len * 100) / 100} sixteenths long. Drag, or arrow keys to move`}
              // S2-4: drag along the 16ths (pointer events); a press without a move selects it.
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { k, moved: false }; if (sel !== k) m.hitOp("select", k); }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d || d.k !== k || sel !== k) return; // moves once the selection has landed
                const st = stepAt(e.clientX);
                if (st !== null && st !== x.at && m.hitOp("to", st)) d.moved = true;
              }}
              onPointerUp={() => { drag.current = null; }}
              onKeyDown={(e) => {
                if (sel !== k || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
                e.preventDefault();
                m.hitOp(e.key === "ArrowLeft" ? "earlier" : "later");
              }} />
          ))}
        </div>
        <div className={c.beats} style={{ gridTemplateColumns: `repeat(${beats.length}, 1fr)` }} aria-hidden>{beats.map((b) => <span key={b}>{b}</span>)}</div>
      </div>
      {h && sel !== null && (
        <span ref={movesRef} className={c.moves}>
          {MOVES.map(([op, label]) => { const no = why(op); return <button key={op} onClick={() => m.hitOp(op)} disabled={!!no} title={no}>{label}</button>; })}
        </span>
      )}
    </div>
  );
}

function KeysPanel({ m, v, where, allBox }: { m: MelodyModel; v: V; where: string; allBox: React.ReactNode }) {
  const cell = v.cells[v.open], cur = cell.name;
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") m.setPiano(false); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [m]);
  const [dlo, dhi] = deskRange(v.notes), [plo, phi] = phoneRange(v.notes);
  const headRef = useRef<HTMLDivElement>(null);
  useEffect(() => { reveal(headRef.current); }, [v.open]);
  return (
    <section className={c.panel} aria-label={`Bar ${where} on the keys`}>
      <div ref={headRef} className={c.head}>
        <button className={c.icon} onClick={() => m.setPiano(false)} aria-label="Back to the chords" title="Back"><ArrowLeft size={16} /></button>
        <span className={c.where}>Bar {where}</span>
        <b className={c.title} title={v.ownNotes ? "Your notes; the closest chord name" : undefined}>{cur ? `· ${prettyChord(cur)}${v.ownNotes ? ", your notes" : ""}` : "–"}</b>
        {v.resetAny && <button className={c.reset} onClick={() => m.resetCell()} aria-label={v.resetCount > 1 ? `Reset all ${v.resetCount} bars to Make's chords and times` : `Reset to Make's ${prettyChord(cell.guess)}`} title={v.resetCount > 1 ? `Back to Make's chords and times in all ${v.resetCount} bars` : `Back to Make's ${prettyChord(cell.guess)}`}><RotateCcw size={14} aria-hidden /> {v.resetCount > 1 ? `Reset ${v.resetCount} bars` : "Reset"}</button>}
        <span className={c.grow} />
        {allBox}
      </div>
      <Keys notes={v.notes} onToggle={(x) => m.toggleNote(x)} lo={dlo} hi={dhi} flats={v.flats} className={c.deskKeys} />
      <Keys notes={v.notes} onToggle={(x) => m.toggleNote(x)} lo={plo} hi={phi} flats={v.flats} className={c.phoneKeys} />
      <Timing m={m} t={v.timing} sel={v.sel} />
    </section>
  );
}
