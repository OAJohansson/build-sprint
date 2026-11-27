"use client";

// Rows shared by several directions: bar numbers, a chords row of cells, a lead row (live or off).
import type { ReactNode } from "react";
import type { Song } from "./data";
import { Hits, LeadRoll, cx, s, v, type Chords } from "./shared";

export function BarNums({ song }: { song: Song }) {
  // break-ui: a 16-bar loop wraps into two lines of 8; the numbers then go inside the cells.
  if (song.bars.length > 8) return null;
  return (
    <div className={v.barNums} aria-hidden>
      <span />
      <div className={v.bars8}>{song.bars.map((_, i) => <span key={i}>{song.from + i}</span>)}</div>
    </div>
  );
}

export function ChordCells({ song, ch, open, onOpen, mark, lit = true, label }: {
  song: Song; ch: Chords; open: number | null; onOpen: (i: number) => void; mark?: (i: number) => ReactNode; lit?: boolean; label?: ReactNode;
}) {
  return (
    <div className={v.row} data-lit={lit ? "" : undefined} data-many={song.bars.length > 8 ? "" : undefined}>
      <button className={v.rowName}>{label ?? "Chords"}</button>
      <div className={v.bars8}>
        {song.bars.map((_, i) => (
          <button key={i} className={v.cell} aria-expanded={open === i} onClick={() => onOpen(i)} aria-label={`Bar ${song.from + i}: ${ch.nameOf(i)}. Change chord`}>
            <span className={v.cellName}>{mark ? mark(i) : ch.nameOf(i)}</span>
            <small className={v.cellNo}>{song.from + i}</small>
            {ch.isEdited(i) && <i className={v.edited} title="Changed by you" />}
            <Hits hits={ch.hits[i]} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function LeadRow({ song, lit, editBar, onClick }: { song: Song; lit?: boolean; editBar?: number | null; onClick?: () => void }) {
  if (song.leadOff) {
    return (
      <div className={v.row} data-lit={lit ? "" : undefined} style={{ height: 52 }}>
        <button className={v.rowName} onClick={onClick}>Lead <span className={v.off}>off</span></button>
        <div className={v.offLine}>
          <LeadRoll song={song} off h={30} />
          <span className={cx(v.deskOnly)}>{song.leadOff}</span>
          <button className={s.textBtn}>Play anyway</button>
        </div>
      </div>
    );
  }
  return (
    <div className={v.row} data-lit={lit ? "" : undefined} style={{ height: 56 }}>
      <button className={v.rowName} onClick={onClick}>Lead</button>
      <div style={{ padding: "6px 8px 6px 0", minWidth: 0 }}><LeadRoll song={song} lit={lit} h={44} editBar={editBar} /></div>
    </div>
  );
}
