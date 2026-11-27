"use client";

// Round 1 · Palette (owner's pick 6, L260). The chords that fit the song sit under the rows all the
// time, each with a feel word instead of I–vii. Tap a bar: first come other versions of the chord Make
// heard (same root, another flavour: the reader's usual mistake), then the song's chords. Tap one to
// hear it in the loop; it plays in Mine at once. "Edit notes" swaps the palette for the note grid.
import { useState } from "react";
import { DUB, LOST, WORST } from "../chords-directions/data";
import { BarNums, ChordCells, LeadRow } from "../chords-directions/rows";
import { NoteGrid, Shell, useChords } from "../chords-directions/shared";
import { fits, flavour, guessed, rootOf, teach, versions, type St } from "./lib";
import { HitsSwitch } from "./piano";
import r from "./r.module.css";

export function Palette({ st }: { st: St }) {
  const song = st === "notes" ? DUB : st === "worst" ? WORST : LOST;
  // notes: bar 60 edited by hand, B♭m with a C added: no exact name, so "≈ B♭m".
  const ch = useChords(song, st === "notes" ? { custom: { 3: [58, 61, 65, 72] }, names: { 2: "B♭m", 1: "E♭" } } : st === "fix" ? { names: { 2: "G7" } } : undefined);
  const [sel, setSel] = useState<number | null>(st === "fix" || st === "worst" ? 2 : st === "notes" ? 3 : null);
  const [notes, setNotes] = useState(st === "notes");
  const [all, setAll] = useState(false);
  const twins = sel === null ? [] : song.bars.map((b, i) => i).filter((i) => i !== sel && song.bars[i].read === song.bars[sel].read);
  const pick = (n: string) => { if (sel === null) return; [sel, ...(all ? twins : [])].forEach((i) => ch.pick(i, n)); };
  const cur = sel !== null ? ch.nameOf(sel) : null;
  const marks = sel !== null ? guessed(song, sel) : [];
  const chip = (n: string, sub: string, small?: boolean) => (
    <button key={n} className={r.chip} data-small={small ? "" : undefined} aria-pressed={cur === n && !ch.isCustom(sel!)} disabled={sel === null} onClick={() => pick(n)}>
      <b>{n}</b><small>{sub}</small>{marks.includes(n) && n !== cur && <i className={r.guessDot} title="One of Make's guesses" />}
    </button>
  );
  const held = sel !== null && ch.hits[sel].length === 1 && ch.hits[sel][0].len >= 12;
  const custom = sel !== null && ch.isCustom(sel);
  return (
    <Shell song={song}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={sel} onOpen={(i) => { setSel(sel === i ? null : i); setNotes(false); }} />
      <LeadRow song={song} />
      <div className={r.panel}>
        <div className={r.panelHead}>
          {sel === null ? <span className={r.hint}>Tap a bar to change its chord.</span> : (
            <>
              <span className={r.where}>Bar {song.from + sel}</span>
              <b className={r.now}>{custom ? `≈ ${cur}` : cur}</b>
              <span className={r.hint}>{custom ? "your notes, closest name" : ch.isEdited(sel) ? `Make heard ${song.bars[sel].read}` : flavour(cur!)}</span>
              <span className={r.grow} />
              {twins.length > 0 && !notes && <label className={r.check}><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> All {twins.length + 1} {song.bars[sel].read} bars</label>}
              <HitsSwitch held={held} onHeld={(h) => ch.setHits(sel, h ? [{ at: 0, len: 16 }] : song.bars[sel].hits.length > 1 ? song.bars[sel].hits : song.bars[0].hits)} />
              <button className={r.link} onClick={() => setNotes(!notes)}>{notes ? "Back to chords" : "Edit notes"}</button>
            </>
          )}
        </div>
        {notes && sel !== null ? (
          <div className={r.gridWrap}>
            <NoteGrid ch={ch} i={sel} flats={song.flats} lo={58} hi={73} rowH={5} time={false} />
            <p className={r.teach}>{custom ? teach(cur!, ch.notesOf(sel), true, song.flats) : "Tap a row to add or take away a note. The name follows."}</p>
          </div>
        ) : (
          <div className={r.groups}>
            {sel !== null && (
              <div className={r.group}>
                <span className={r.groupHead}>Other versions of {rootOf(song.bars[sel].read)}</span>
                <div className={r.chips}>{versions(song, sel, cur!).slice(0, 2).map((n) => chip(n, flavour(n), true))}</div>
              </div>
            )}
            <div className={r.group} style={{ flex: 1 }}>
              <span className={r.groupHead}>Chords that fit this song{sel !== null && <> · <i className={r.guessDot} aria-hidden /> Make&apos;s guesses</>}</span>
              <div className={r.chips}>{fits(song).map((x) => chip(x.name, x.feel))}</div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
