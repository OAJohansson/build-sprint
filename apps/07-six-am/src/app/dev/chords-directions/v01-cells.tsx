"use client";

// 1 Cells: Phase 5's Fold rows with one cell per bar (name over its stabs). Tap a cell: a popover under
// it with Make's guesses and the key's chords; "Edit notes" turns the same popover into the note grid.
import { useEffect, useState } from "react";
import { LOST, WORST } from "./data";
import { BarNums, ChordCells, LeadRow } from "./rows";
import { NoteGrid, PickList, Shell, useChords, v, type St } from "./shared";

export function V01Cells({ st }: { st: St }) {
  const song = st === "worst" ? WORST : LOST;
  const ch = useChords(song);
  const [open, setOpen] = useState<number | null>(st === "key" ? 2 : null);
  const [notes, setNotes] = useState(false);
  useEffect(() => { if (open === null) return; const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); }; addEventListener("keydown", esc); return () => removeEventListener("keydown", esc); }, [open]);
  const left = open === null ? 0 : `calc(88px + ${open} * ((100% - 88px - 8px + 6px) / 8))`;
  return (
    <Shell song={song}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={open} onOpen={(i) => { setOpen(open === i ? null : i); setNotes(false); }} />
      <LeadRow song={song} />
      {open !== null && (
        <div className={v.pop} style={{ top: 118, left: open > 4 ? `calc(${left} - 380px + 100% / 8)` : left }} role="dialog" aria-label={`Bar ${song.from + open}`}>
          <div className={v.popHead}>
            <b>Bar {song.from + open} · {ch.nameOf(open)}</b>
            <span>{ch.isCustom(open) ? "your notes" : ""}</span>
            <button className={v.link} onClick={() => setOpen(null)}>Done</button>
          </div>
          {notes ? <NoteGrid ch={ch} i={open} flats={song.flats} lo={53} hi={72} rowH={8} /> : <PickList song={song} ch={ch} i={open} />}
          <div className={v.popFoot}>
            <button className={v.link} onClick={() => setNotes(!notes)}>{notes ? "Back to chords" : "Edit notes and times"}</button>
            {ch.isEdited(open) && <button className={v.link} onClick={() => ch.reset(open)}>Back to Make&apos;s read</button>}
          </div>
        </div>
      )}
    </Shell>
  );
}
