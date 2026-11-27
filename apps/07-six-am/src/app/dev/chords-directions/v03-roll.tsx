"use client";

// 3 Roll: the chords are always a piano roll, one block per bar with its name on top. Notes switch on
// and off right in the roll (no "open" step); the name is a small menu of guesses and the key's chords.
// An edited bar keeps its notes and shows "≈" with the closest name.
import { useState } from "react";
import { DUB, isBlack, noteName } from "./data";
import { LeadRow } from "./rows";
import { Shell, useChords, v, type St } from "./shared";

const LO = 56, HI = 74;

export function V03Roll({ st }: { st: St }) {
  const song = DUB;
  // Key state: bar 60 edited by hand, B♭m with a C added: no exact name, so "≈ B♭m".
  const ch = useChords(song, st === "key" ? { custom: { 3: [58, 61, 65, 72] }, names: { 2: "B♭m" } } : undefined);
  const [menu, setMenu] = useState<number | null>(null);
  const rows = Array.from({ length: HI - LO + 1 }, (_, k) => HI - k);
  return (
    <Shell song={song}>
      <div className={v.row} data-lit="">
        <button className={v.rowName}>Chords<small>tap a square to switch a note</small></button>
        <div className={v.roll}>
          {song.bars.map((_, i) => {
            const notes = ch.notesOf(i), hits = ch.hits[i], on = (stp: number) => hits.some((x) => stp >= x.at && stp < x.at + x.len);
            const custom = ch.isCustom(i);
            return (
              <div key={i} className={v.rollBar} style={{ position: "relative" }}>
                <button className={v.rollName} aria-haspopup="menu" aria-expanded={menu === i} onClick={() => setMenu(menu === i ? null : i)}>
                  {custom ? <>≈ {ch.nameOf(i)}<small>yours</small></> : ch.nameOf(i)} <i aria-hidden>▾</i>
                </button>
                <div className={v.rollGrid} style={{ ["--n" as string]: rows.length }}>
                  {rows.map((m) => (
                    <div key={m} className={v.rollRow} role="button" tabIndex={0} aria-pressed={notes.includes(m)} aria-label={`Bar ${song.from + i}, ${noteName(m, true)}`} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ch.toggle(i, m); } }} data-black={isBlack(m) ? "" : undefined} onClick={() => ch.toggle(i, m)} title={`${noteName(m, true)}: tap to switch on or off`}>
                      {Array.from({ length: 16 }, (_, k) => <i key={k} data-on={notes.includes(m) && on(k) ? "" : undefined} data-mine={custom ? "" : undefined} />)}
                    </div>
                  ))}
                </div>
                {menu === i && (
                  <div className={v.menu} role="menu" style={i > 5 ? { right: 0 } : { left: 0 }}>
                    {[song.bars[i].read, ...song.bars[i].alts.map((a) => a.name)].map((n, k) => (
                      <button key={n} role="menuitemradio" aria-checked={ch.nameOf(i) === n} onClick={() => { ch.pick(i, n); setMenu(null); }}>{n}<small>{k === 0 ? "first read" : `guess ${k + 1}`}</small></button>
                    ))}
                    <hr />
                    {song.keyChords.filter((c) => c !== song.bars[i].read && !song.bars[i].alts.some((a) => a.name === c)).map((n) => (
                      <button key={n} role="menuitemradio" aria-checked={ch.nameOf(i) === n} onClick={() => { ch.pick(i, n); setMenu(null); }}>{n}<small>in {song.keyShort}</small></button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <LeadRow song={song} />
    </Shell>
  );
}
