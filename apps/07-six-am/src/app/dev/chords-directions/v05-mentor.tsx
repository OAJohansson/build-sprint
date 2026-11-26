"use client";

// 5 Mentor: tapping a bar turns the Mentor rail into that bar's chord choice. Each guess comes with
// one plain line on how it sounds and where it sits in the key (K10), so the pick and the "why" are
// in one place. "Notes" opens the note grid in the rail.
import { useState } from "react";
import { LOST } from "./data";
import { BarNums, ChordCells, LeadRow } from "./rows";
import { Name, NoteGrid, Shell, useChords, s, v, type St } from "./shared";

const WHY: Record<string, string> = {
  G: "The home chord of G major: settled, bright.",
  G7: "G with an F on top: bluesier, it leans forward. The F is borrowed from outside the key.",
  Gsus4: "G with C instead of B: open, waiting to fall back to G.",
  Em: "G's relative minor: same notes but one, darker.",
  Am: "ii of G major: soft, moves on easily.", Bm: "iii: close to G, a little sadder.", C: "IV: lifts away from home.", D: "V: pulls back to G.", "F♯dim": "vii°: tense, rare in house.",
};

export function V05Mentor({ st }: { st: St }) {
  const song = LOST;
  const ch = useChords(song, st === "key" ? { names: { 2: "G7" } } : undefined);
  const [open, setOpen] = useState<number | null>(st === "key" ? 2 : null);
  const [notes, setNotes] = useState(false);
  const rail = open === null ? undefined : (
    <>
      <span className={s.ctx}>Mentor, on bar {song.from + open}</span>
      <div className={v.railPick}>
        <div className={v.railHead}><b><Name n={ch.nameOf(open)} /></b><span className={v.quiet}>Make read {song.bars[open].read}</span></div>
        {notes ? <NoteGrid ch={ch} i={open} flats={false} lo={53} hi={72} rowH={9} /> : (
          <>
            {[song.bars[open].read, ...song.bars[open].alts.map((a) => a.name)].map((n) => (
              <button key={n} className={v.railOpt} aria-pressed={ch.nameOf(open) === n} onClick={() => ch.pick(open, n)}>
                <b>{n}</b><span>{WHY[n]}</span>
              </button>
            ))}
            <span className={v.faintText}>Other chords in G major</span>
            <div className={v.railKeys}>{song.keyChords.filter((c) => !["G", "Em"].includes(c)).map((n) => <button key={n} aria-pressed={ch.nameOf(open) === n} onClick={() => ch.pick(open, n)}>{n}</button>)}</div>
          </>
        )}
        <div style={{ display: "flex", gap: 16 }}>
          <button className={v.link} onClick={() => setNotes(!notes)}>{notes ? "Back to chords" : "Notes and times"}</button>
          <button className={v.link} onClick={() => { setOpen(null); setNotes(false); }}>Back to the Mentor</button>
        </div>
      </div>
    </>
  );
  return (
    <Shell song={song} rail={rail}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={open} onOpen={(i) => setOpen(open === i ? null : i)} />
      <LeadRow song={song} />
    </Shell>
  );
}
