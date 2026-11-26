"use client";

// 6 Palette: the key's seven chords sit under the rows all the time, numbered as in the key (I–vii).
// Select a bar (or drag across several), and the palette marks Make's guesses 1–3 for it; tap a chord
// to paint it into the selected bars. Chords outside the key that Make heard show at the end.
import { useState } from "react";
import { DUB } from "./data";
import { BarNums, LeadRow } from "./rows";
import { Hits, Shell, useChords, s, v, type St } from "./shared";

const ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

export function V06Palette({ st }: { st: St }) {
  const song = DUB;
  const ch = useChords(song);
  const [sel, setSel] = useState<number[]>(st === "key" ? [2, 3] : []);
  const first = sel[0] ?? null;
  const ranked = first === null ? [] : [song.bars[first].read, ...song.bars[first].alts.map((a) => a.name)];
  const outside = ranked.filter((n) => !song.keyChords.includes(n));
  const paint = (n: string) => sel.forEach((i) => ch.pick(i, n));
  const tap = (i: number, e: React.MouseEvent) => {
    if (e.shiftKey && first !== null) { const a = Math.min(first, i), b = Math.max(first, i); setSel(Array.from({ length: b - a + 1 }, (_, k) => a + k)); }
    else setSel(sel.length === 1 && sel[0] === i ? [] : [i]);
  };
  const chip = (n: string, sub: string) => {
    const r = ranked.indexOf(n);
    return (
      <button key={n} className={v.chip} data-rank={r >= 0 ? "" : undefined} aria-pressed={sel.length > 0 && sel.every((i) => ch.nameOf(i) === n)} onClick={() => paint(n)} disabled={!sel.length}>
        <b>{n}</b><small>{sub}{r >= 0 && <em> · guess {r + 1}</em>}</small>
      </button>
    );
  };
  return (
    <Shell song={song}>
      <BarNums song={song} />
      <div className={v.row} data-lit="">
        <button className={v.rowName}>Chords</button>
        <div className={v.bars8}>
          {song.bars.map((_, i) => (
            <button key={i} className={v.cell} aria-pressed={sel.includes(i)} onClick={(e) => tap(i, e)}>
              <span className={v.cellName}>{ch.nameOf(i)}</span>
              {ch.isEdited(i) && <i className={v.edited} />}
              <Hits hits={ch.hits[i]} />
            </button>
          ))}
        </div>
      </div>
      <LeadRow song={song} />
      <div className={v.palHead}>
        <span>{sel.length ? `Bars ${song.from + sel[0]}${sel.length > 1 ? `–${song.from + sel[sel.length - 1]}` : ""}: tap a chord to play it there. Make's guesses are numbered.` : "Chords in A♭ major. Select a bar, or shift-tap to select several."}</span>
        {sel.length === 1 && <button className={v.link}>Notes and times</button>}
      </div>
      <div className={v.palette}>
        {song.keyChords.map((n, k) => chip(n, ROMAN[k]))}
        {outside.length > 0 && <span className={s.faint} style={{ alignSelf: "center", padding: "0 4px" }}>also heard</span>}
        {outside.map((n) => chip(n, "heard"))}
      </div>
    </Shell>
  );
}
