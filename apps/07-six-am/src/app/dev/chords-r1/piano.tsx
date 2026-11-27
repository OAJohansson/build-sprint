"use client";

// A small piano keyboard (dev only): the chord's notes lit; tap a key to add or take away a note.
import { isBlack, noteName } from "../chords-directions/data";
import r from "./r.module.css";

export function Piano({ notes, onToggle, lo = 48, hi = 76, flats, h = 68 }: { notes: number[]; onToggle: (m: number) => void; lo?: number; hi?: number; flats: boolean; h?: number }) {
  const all = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
  const whites = all.filter((m) => !isBlack(m)), blacks = all.filter(isBlack);
  const at = (m: number) => whites.indexOf(m - 1) + 1;
  const label = (m: number) => noteName(m, flats).replace(/\d/, "");
  return (
    <div className={r.kb} style={{ height: h }} role="group" aria-label="The chord's notes on a keyboard">
      {whites.map((m) => (
        <button key={m} className={r.white} data-on={notes.includes(m) ? "" : undefined} aria-pressed={notes.includes(m)} aria-label={noteName(m, flats)} onClick={() => onToggle(m)}>
          {notes.includes(m) ? label(m) : m % 12 === 0 ? noteName(m, flats) : ""}
        </button>
      ))}
      {blacks.map((m) => (
        <button key={m} className={r.black} style={{ left: `${(at(m) / whites.length) * 100}%`, width: `${(0.6 / whites.length) * 100}%`, marginLeft: `${(-0.3 / whites.length) * 100}%` }}
          data-on={notes.includes(m) ? "" : undefined} aria-pressed={notes.includes(m)} aria-label={noteName(m, flats)} onClick={() => onToggle(m)}>
          {notes.includes(m) ? label(m) : ""}
        </button>
      ))}
    </div>
  );
}

/** Short hits or held (the reader may read a pad as repeated stabs, U-1): one switch per bar. */
export function HitsSwitch({ held, onHeld }: { held: boolean; onHeld: (h: boolean) => void }) {
  return (
    <div className={r.seg} role="group" aria-label="How the chord plays in this bar">
      <button aria-pressed={!held} onClick={() => onHeld(false)}>Short hits</button>
      <button aria-pressed={held} onClick={() => onHeld(true)}>Held</button>
    </div>
  );
}
