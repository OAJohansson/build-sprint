"use client";

// Round 1 · Keyboard (owner's pick 7, L260). A piano keyboard under the rows shows the tapped bar's
// chord; tap keys to change it and the name follows, with one plain line saying what the notes are.
// Beside it, other versions of the same chord first (the reader's usual mistake is the flavour, not
// the root), then the song's chords on request. Timing hides behind "Change timing".
import { useState } from "react";
import { DUB, LOST, WORST, voicing } from "../chords-directions/data";
import { BarNums, ChordCells, LeadRow } from "../chords-directions/rows";
import { Shell, useChords } from "../chords-directions/shared";
import { fits, flavour, rootOf, teach, versions, type St } from "./lib";
import { HitsSwitch, Piano } from "./piano";
import r from "./r.module.css";

export function Keyboard({ st }: { st: St }) {
  const song = st === "notes" ? DUB : st === "worst" ? WORST : LOST;
  // notes: bar 59 read B♭sus2; C taken off and D♭ put on by hand: B♭m "from your notes".
  const ch = useChords(song, st === "notes" ? { custom: { 2: [58, 61, 65] } } : st === "fix" ? { names: { 2: "G7" } } : undefined);
  const [sel, setSel] = useState<number | null>(st === "main" ? null : 2);
  const [more, setMore] = useState(false);
  const [timing, setTiming] = useState(false);
  const i = sel ?? 0, notes = ch.notesOf(i), hits = ch.hits[i];
  const fromNotes = sel !== null && notes.join() !== voicing(ch.names[i], ch.low).join();
  const cur = ch.nameOf(i);
  const held = hits.length === 1 && hits[0].len >= 12;
  const opt = (n: string, sub: string) => (
    <button key={n} className={r.chip} data-small="" aria-pressed={cur === n && !fromNotes} onClick={() => ch.pick(i, n)}>
      <b>{n}</b><small>{sub}</small>
    </button>
  );
  return (
    <Shell song={song}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={sel} onOpen={(k) => { setSel(sel === k ? null : k); setMore(false); setTiming(false); }} />
      <LeadRow song={song} />
      {sel === null ? (
        <div className={r.panel}><div className={r.panelHead}><span className={r.hint}>Tap a bar to see its chord on the keys.</span></div></div>
      ) : (
        <div className={r.kbPanel}>
          <div>
            <div className={r.panelHead}>
              <span className={r.where}>Bar {song.from + i}</span>
              <b className={r.now}>{cur}</b>
              <span className={r.hint}>{fromNotes ? "from your notes" : ch.isEdited(i) ? `Make heard ${song.bars[i].read}` : "as Make heard it"}</span>
              <span className={r.grow} />
              <HitsSwitch held={held} onHeld={(h) => ch.setHits(i, h ? [{ at: 0, len: 16 }] : song.bars[i].hits.length > 1 ? song.bars[i].hits : song.bars[0].hits)} />
              <button className={r.link} aria-expanded={timing} onClick={() => setTiming(!timing)}>Timing</button>
            </div>
            <Piano notes={notes} onToggle={(m) => ch.toggle(i, m)} flats={song.flats} h={52} />
            <p className={r.teach}>{teach(cur, notes, fromNotes && ch.isCustom(i), song.flats)}{(fromNotes || ch.isEdited(i)) && <> <button className={r.link} onClick={() => ch.reset(i)}>Back to Make&apos;s {song.bars[i].read}</button></>}</p>
            <div className={r.under}>
              {timing && (
                <div className={r.steps} role="group" aria-label="When the chord plays, in 16ths">
                  {Array.from({ length: 16 }, (_, k) => (
                    <button key={k} data-on={hits.some((x) => k >= x.at && k < x.at + x.len) ? "" : undefined} data-beat={k % 4 === 0 ? "" : undefined} aria-label={`16th ${k + 1}`}
                      onClick={() => ch.setHits(i, hits.some((x) => x.at === k) ? hits.filter((x) => x.at !== k) : [...hits, { at: k, len: 1 }].sort((a, b) => a.at - b.at))} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={r.side}>
            <span className={r.groupHead}>Other versions of {rootOf(song.bars[i].read)}</span>
            <div className={r.chips2}>{[song.bars[i].read, ...versions(song, i, song.bars[i].read)].filter((n) => n !== cur || !fromNotes).slice(0, 4).map((n) => opt(n, flavour(n)))}</div>
            <button className={r.link} aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Fewer chords" : "Other chords that fit this song"}</button>
            {more && <div className={r.chips2}>{fits(song).filter((x) => rootOf(x.name) !== rootOf(song.bars[i].read)).map((x) => opt(x.name, x.feel))}</div>}
          </div>
        </div>
      )}
    </Shell>
  );
}
