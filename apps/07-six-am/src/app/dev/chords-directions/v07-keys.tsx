"use client";

// 7 Keyboard: under the rows, a real piano keyboard shows the selected bar's notes lit. Tap a key to
// add or take away a note; the name above follows ("G7, from your notes"). The guesses sit beside it
// as one column, and a strip of 16ths under the keys moves the hits.
import { useState } from "react";
import { LOST, isBlack, noteName, voicing } from "./data";
import { BarNums, ChordCells } from "./rows";
import { Name, Shell, useChords, s, v, type St } from "./shared";

const LO = 48, HI = 76; // C3–E5

export function V07Keys({ st }: { st: St }) {
  const song = LOST;
  // Key state: bar 71 read as G; the F4 key tapped on: G7 from the owner's notes.
  const ch = useChords(song, st === "key" ? { custom: { 2: [...voicing("G", 55), 65] } } : undefined);
  const [sel, setSel] = useState(2);
  const notes = ch.notesOf(sel), hits = ch.hits[sel];
  const whites = Array.from({ length: HI - LO + 1 }, (_, k) => LO + k).filter((m) => !isBlack(m));
  const blacks = Array.from({ length: HI - LO + 1 }, (_, k) => LO + k).filter(isBlack);
  const wIdx = (m: number) => whites.indexOf(m - 1) + 1;
  const fromNotes = notes.join() !== voicing(ch.names[sel], ch.low).join();
  return (
    <Shell song={song}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={sel} onOpen={setSel} />
      <div className={v.kbWrap}>
        <div>
          <div className={v.kbHead}>
            <span className={s.drLabel}>Bar {song.from + sel}</span>
            <b><Name n={ch.nameOf(sel)} /></b>
            <span className={v.quiet}>{fromNotes ? "from your notes" : `as Make read it`}</span>
            {fromNotes && <button className={v.link} style={{ marginLeft: "auto" }} onClick={() => ch.reset(sel)}>Back to Make&apos;s read</button>}
          </div>
          <div className={v.kb} role="group" aria-label="Notes in this chord">
            {whites.map((m) => (
              <button key={m} className={v.white} data-on={notes.includes(m) ? "" : undefined} aria-pressed={notes.includes(m)} onClick={() => ch.toggle(sel, m)} aria-label={noteName(m, false)}>
                {notes.includes(m) || m % 12 === 0 ? noteName(m, false) : ""}
              </button>
            ))}
            {blacks.map((m) => (
              <button key={m} className={v.black} style={{ left: `${(wIdx(m) / whites.length) * 100}%` }} data-on={notes.includes(m) ? "" : undefined} aria-pressed={notes.includes(m)} onClick={() => ch.toggle(sel, m)} aria-label={noteName(m, false)}>
                {notes.includes(m) ? noteName(m, false).replace(/\d/, "") : ""}
              </button>
            ))}
          </div>
          <div className={v.kbTime}>
            <div className={v.timeRow} style={{ gridTemplateColumns: "88px minmax(0,1fr)" }}>
              <span className={v.timeLabel}>when it plays</span>
              <div className={v.timeCells}>
                {Array.from({ length: 16 }, (_, k) => (
                  <button key={k} data-on={hits.some((x) => x.at === k) ? "" : undefined} data-beat={k % 4 === 0 ? "" : undefined} aria-label={`16th ${k + 1}`}
                    onClick={() => ch.setHits(sel, hits.some((x) => x.at === k) ? hits.filter((x) => x.at !== k) : [...hits, { at: k, len: 1 }].sort((a, b) => a.at - b.at))} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={v.side}>
          <span className={v.pickHead}>Make&apos;s guesses</span>
          {[song.bars[sel].read, ...song.bars[sel].alts.map((a) => a.name)].map((n) => (
            <button key={n} className={v.pick} aria-pressed={ch.nameOf(sel) === n && !fromNotes} onClick={() => ch.pick(sel, n)}><span className={v.pickName}>{n}</span></button>
          ))}
          <button className={v.link} style={{ alignSelf: "flex-start" }}>Other chords in G major</button>
        </div>
      </div>
    </Shell>
  );
}
