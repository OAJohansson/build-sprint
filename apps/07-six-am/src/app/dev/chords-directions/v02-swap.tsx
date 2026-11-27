"use client";

// 2 Swap: the rows stay as they are; tapping a bar swaps the knob block for the bar's editor (guesses
// on the left, the note grid with its 16ths on the right) in the same place. Done brings the knobs back.
import { useState } from "react";
import { DUB } from "./data";
import { BarNums, ChordCells, LeadRow } from "./rows";
import { Name, NoteGrid, PickList, Shell, useChords, s, v, type St } from "./shared";

export function V02Swap({ st }: { st: St }) {
  const song = DUB;
  const ch = useChords(song);
  const [open, setOpen] = useState<number | null>(st === "key" ? 2 : null);
  const editor = open === null ? undefined : (
    <div className={v.editor}>
      <div className={v.editorHead}>
        <span className={s.drLabel}>Bar {song.from + open}</span>
        <b><Name n={ch.nameOf(open)} /></b>
        <span className={v.quiet}>{ch.isCustom(open) ? "your notes, closest name" : `Make read ${song.bars[open].read}`}</span>
        <button className={s.ghost} onClick={() => setOpen(null)}>Done</button>
      </div>
      <PickList song={song} ch={ch} i={open} cols={4} />
      <NoteGrid ch={ch} i={open} flats={song.flats} lo={55} hi={74} rowH={8} wide />
    </div>
  );
  return (
    <Shell song={song} block={editor}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={open} onOpen={(i) => setOpen(open === i ? null : i)} />
      <LeadRow song={song} />
    </Shell>
  );
}
