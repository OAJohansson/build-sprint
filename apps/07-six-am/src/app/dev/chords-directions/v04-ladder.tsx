"use client";

// 4 Ladder: nothing opens. Each bar shows what plays now on top and Make's next guesses under it, one
// tap away; the rest of the key is one more tap ("more"). One-chord loops get "same in every bar".
import { useState } from "react";
import { LOST } from "./data";
import { BarNums, LeadRow } from "./rows";
import { Hits, Shell, useChords, s, v, type St } from "./shared";

export function V04Ladder({ st }: { st: St }) {
  const song = LOST;
  const ch = useChords(song, st === "key" ? { names: { 2: "G7" } } : undefined);
  const [last, setLast] = useState<number | null>(st === "key" ? 2 : null);
  const [more, setMore] = useState<number | null>(null);
  const pick = (i: number, n: string) => { ch.pick(i, n); setLast(i); setMore(null); };
  const lastName = last !== null ? ch.nameOf(last) : null;
  const others = last !== null ? song.bars.filter((b, i) => i !== last && b.read === song.bars[last].read && ch.nameOf(i) !== lastName).length : 0;
  return (
    <Shell song={song}>
      <BarNums song={song} />
      <div className={v.row} data-lit="">
        <button className={v.rowName}>Chords</button>
        <div className={v.ladder}>
          {song.bars.map((b, i) => {
            const cur = ch.nameOf(i);
            const rungs = [b.read, ...b.alts.map((a) => a.name)].filter((n) => n !== cur).slice(0, 2);
            return (
              <div key={i} className={v.rung}>
                <div className={v.rungTop}><b>{cur}</b><Hits hits={ch.hits[i]} /></div>
                {(more === i ? [...rungs, ...song.keyChords.filter((c) => c !== cur && !rungs.includes(c))] : rungs).map((n) => (
                  <button key={n} className={v.rungAlt} onClick={() => pick(i, n)}>{n}{n === b.read && <small>read</small>}</button>
                ))}
                {more !== i && <button className={v.rungAlt} onClick={() => setMore(i)} aria-label={`More chords for bar ${song.from + i}`}><small>more…</small></button>}
              </div>
            );
          })}
        </div>
      </div>
      {last !== null && others > 0 && (
        <p className={v.allLine}>Bar {song.from + last} plays {lastName} now. <button className={s.ghost} onClick={() => { song.bars.forEach((b, i) => { if (b.read === song.bars[last].read) ch.pick(i, lastName!); }); }}>{lastName} in all {others + 1} bars</button></p>
      )}
      <LeadRow song={song} />
    </Shell>
  );
}
