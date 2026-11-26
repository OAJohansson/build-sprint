"use client";

// Phase 6 slice 1 (K4, design round 5 in /dev/chords-r4, L261, L262): the Chords row as one tile per
// cell (a bar, or half a bar when the chord changes inside it) with its name, its hits and its bar
// number, "?" where Make isn't sure; under the rows the listening panel, always open (first on the
// first unsure bar): the Track reference button, cards for Make's guess and its next alternatives
// (tap = hear it in the loop and put it in Mine), "All N X bars", "More chords" for the key's others.
// Labels say what things are; no how-to sentences (L262). Piano is hidden until slice 2 (T172).
import { AudioWaveform, Check, Pause, Play } from "lucide-react";
import { flavour, prettyChord } from "@/lib/make/chords-mine";
import type { MelodyModel } from "./make-melody";
import c from "./chords.module.css";

type View = NonNullable<MelodyModel["chords"]>;
type Cell = View["cells"][number];

const barLabel = (cell: Cell, from: number | null) => {
  const n = from !== null ? from + cell.bar : cell.bar + 1;
  return cell.steps < 16 && cell.startStep % 16 !== 0 ? `${n}½` : `${n}`;
};

/** A cell's chord times: stabs as short marks, a held chord as one long bar (16ths across the cell). */
function Hits({ hits, steps }: { hits: Cell["hits"]; steps: number }) {
  const W = steps * 10;
  return (
    <svg className={c.hits} viewBox={`0 0 ${W} 10`} preserveAspectRatio="none" aria-hidden>
      {[4, 8, 12].filter((b) => b < steps).map((b) => <line key={b} x1={b * 10} x2={b * 10} y1={0} y2={10} stroke="rgba(241,230,211,.12)" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
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
        const name = x.name ? prettyChord(x.name) : "–";
        return (
          <button key={x.i} className={c.tile} style={{ gridColumn: `span ${Math.max(1, Math.round(x.steps / 8))}` }} data-unsure={x.unsure ? "" : undefined}
            aria-expanded={v.open === x.i} onClick={() => onOpen(x.i)}
            aria-label={`Bar ${barLabel(x, from)}: ${x.name ? prettyChord(x.name) : "no chord"}${x.unsure ? ", Make isn't sure" : ""}. Change chord`}>
            <span className={c.tileName}>{name}</span>
            {x.unsure && <span className={c.unsure} title="Make isn't sure of this bar" aria-hidden>?</span>}
            <span className={c.tileFoot}><Hits hits={x.hits} steps={x.steps} /><small>{barLabel(x, from)}</small></span>
          </button>
        );
      })}
    </div>
  );
}

/** The listening panel (K4): always open on one cell. */
export function ChordPanel({ m, from, playing }: { m: MelodyModel; from: number | null; playing: boolean }) {
  const v = m.chords;
  if (!v) return null;
  const cell = v.cells[v.open];
  if (!cell) return null;
  const cur = cell.name, where = barLabel(cell, from);
  const list = [...cell.cards, ...(cur && !cell.cards.includes(cur) ? [cur] : [])];
  const extra = v.more ? v.keyChords.filter((n) => !list.includes(n)) : [];
  const trackOn = playing && v.hear === "orig" && m.ab === "a";
  const card = (n: string) => {
    const chosen = cur === n, on = playing && v.hear === n && m.ab === "b", guess = n === cell.guess, p = prettyChord(n);
    return (
      <button key={n} className={c.choice} aria-pressed={chosen} data-playing={on ? "" : undefined} onClick={() => m.tapCard(n, playing)}
        aria-label={`${p}${guess ? ", Make's guess" : ""}, ${flavour(n) || "a chord"}${chosen ? ", in Mine" : ""}. ${on ? "Pause" : "Hear it in the loop and use it"}`}>
        <span className={c.glyph} aria-hidden>{on ? <Pause size={13} /> : <Play size={13} />}</span>
        <span className={c.choiceText}>
          <small className={c.guessTag}>{guess ? "Make's guess" : "\u00a0"}</small>
          <span className={c.choiceName}>{p}</span>
          <small className={c.mood}>{flavour(n)}</small>
        </span>
        {chosen && <Check className={c.check} size={15} strokeWidth={2.5} aria-hidden />}
      </button>
    );
  };
  const n = v.twins + 1, curP = cur ? prettyChord(cur) : "";
  return (
    <section className={c.panel} aria-label={`Bar ${where}: pick the chord that sounds like the track`}>
      <div className={c.head}>
        <span className={c.where}>Bar {where}</span>
        <b className={c.ask}>Which one sounds like the track?</b>
      </div>
      <div className={c.strip}>
        <button className={c.track} data-playing={trackOn ? "" : undefined} onClick={() => m.tapTrack(playing)}
          aria-label={trackOn ? `Stop the track's bar ${where}` : `Hear the track's bar ${where} as it is`} title="The track, as it is">
          {trackOn ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
          <AudioWaveform size={18} aria-hidden />
          <span>Track</span>
        </button>
        <div className={c.choices} role="group" aria-label="Chords to try">{[...list, ...extra].map(card)}</div>
      </div>
      <div className={c.tools}>
        {v.twins > 0 && cur && (
          <label className={c.all} title={`Every bar playing ${curP} in Mine changes with this one`}>
            <input type="checkbox" checked={v.all} onChange={(e) => m.setAll(e.target.checked)} /> {n === 2 ? `Both ${curP} bars` : `All ${n} ${curP} bars`}
          </label>
        )}
        <span className={c.grow} />
        {v.keyChords.length > 0 && (
          <button className={c.chip} aria-expanded={v.more} onClick={() => m.setMore(!v.more)} aria-label={v.more ? "Fewer chords" : "More chords that fit this song's key"}>
            {v.more ? "Fewer chords" : "More chords"}
          </button>
        )}
      </div>
    </section>
  );
}
