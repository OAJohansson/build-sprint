"use client";

// Phase 6 slice 4 (K7, L249; design round 5 in /dev/chords-r4, state "lead"): a bar of the lead on a
// grid of 16ths, one note at a time. Rows are the song key's notes (named), with "Notes outside the key"
// for the rest (locked on while the bar holds one). Tap a cell = place a note there (it replaces what
// sounds on that 16th); tap a note = pick it, then Shorter / Longer / Remove. ↺ Reset after an edit;
// × goes back to the chords. The read is weak (H4), so this grid is where the line gets fixed.
import { useEffect, useRef } from "react";
import { reveal } from "./make-chords";
import { RotateCcw, X } from "lucide-react";
import type { MelodyModel } from "./make-melody";
import c from "./chords.module.css";

const SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"], FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
const noteName = (m: number, flats: boolean) => `${(flats ? FLAT : SHARP)[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);

export function LeadPanel({ m, from }: { m: MelodyModel; from: number | null }) {
  const v = m.lead;
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") m.closeLead(); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [m]);
  // T219: the panel (header to move row) comes into view when a bar opens or a note is picked.
  const panelRef = useRef<HTMLElement>(null), movesRef = useRef<HTMLDivElement>(null);
  const open = v?.open ?? null, picked = v?.sel ?? null;
  useEffect(() => { if (open !== null) reveal(panelRef.current, picked !== null ? movesRef.current : null); }, [open, picked]);
  if (!v || v.open === null) return null;
  const bar = from !== null ? from + v.open : v.open + 1, notes = v.notes, sel = v.sel !== null ? notes[v.sel] : null;
  const nextAt = sel ? notes.filter((x) => x.at > sel.at).reduce((a, x) => Math.min(a, x.at), 16) : 16;
  return (
    <section ref={panelRef} className={`${c.panel} ${c.leadPanel}`} aria-label={`Lead, bar ${bar}: place one note at a time`}>
      <div className={c.leadHead}>
        <span className={c.where}>Lead · bar {bar}</span>
        {v.edited && <button className={c.reset} onClick={() => m.resetLead()} aria-label="Reset to Make's line" title="Back to Make's line"><RotateCcw size={14} aria-hidden /> Reset</button>}
        <span className={c.grow} />
        <label className={c.quietSwitch} title={v.outsideLocked ? "This bar holds a note outside the key" : "Show the notes that aren't in the song's key too"}>
          <input type="checkbox" checked={v.outside} disabled={v.outsideLocked} onChange={(e) => m.setOutside(e.target.checked)} /> Notes outside the key
        </label>
        <button className={c.icon} onClick={() => m.closeLead()} aria-label="Close the lead" title="Close"><X size={16} /></button>
      </div>
      <div className={c.leadGrid} data-wide={v.rows.length > 12 ? "" : undefined} role="group" aria-label={`The lead in bar ${bar}`}>
        {v.rows.map((midi) => (
          <div key={midi} className={c.leadRow} data-black={isBlack(midi) ? "" : undefined} data-out={v.keyPcs && !v.keyPcs.includes(((midi % 12) + 12) % 12) ? "" : undefined}>
            <span className={c.leadKey}>{noteName(midi, v.flats)}</span>
            <div className={c.leadCells}>
              {Array.from({ length: 16 }, (_, st) => {
                const k = notes.findIndex((n) => n.midi === midi && st >= n.at && st < n.at + n.len);
                // L-3: a note's first 16th carries a divider, so two notes of the same pitch side by side don't merge.
                return <button key={st} data-beat={st % 4 === 0 ? "" : undefined} data-on={k >= 0 ? "" : undefined} data-start={k >= 0 && notes[k].at === st ? "" : undefined} data-sel={k >= 0 && k === v.sel ? "" : undefined}
                  aria-label={`${noteName(midi, v.flats)}, 16th ${st + 1}${k >= 0 ? ", on" : ""}`} onClick={() => m.placeLead(midi, st)} />;
              })}
            </div>
          </div>
        ))}
      </div>
      {/* L-1: one fixed-height row of 32 px buttons, always in place (hidden until a note is picked), so the grid never moves */}
      <div ref={movesRef} className={c.leadMoves} data-hidden={sel ? undefined : ""} aria-hidden={sel ? undefined : true}>
        <button onClick={() => m.stretchLead(-1)} disabled={!sel || sel.len <= 1} tabIndex={sel ? 0 : -1}>Shorter</button>
        <button onClick={() => m.stretchLead(1)} disabled={!sel || sel.at + sel.len >= nextAt} tabIndex={sel ? 0 : -1} title={sel && sel.at + sel.len >= nextAt ? "The next note or the bar's end is in the way" : undefined}>Longer</button>
        <button onClick={() => m.removeLead()} disabled={!sel} tabIndex={sel ? 0 : -1}>Remove</button>
      </div>
    </section>
  );
}

/** Over the Lead row's roll: one target per bar that opens it on the grid. */
export function LeadBars({ m, from }: { m: MelodyModel; from: number | null }) {
  const v = m.lead;
  if (!v) return null;
  return (
    <div className={c.leadBars} style={{ gridTemplateColumns: `repeat(${Math.min(8, v.bars.length)}, 1fr)` }}>
      {v.bars.map((b) => (
        <button key={b.bar} aria-pressed={v.open === b.bar} data-edited={b.edited ? "" : undefined} onClick={() => (v.open === b.bar ? m.closeLead() : m.openLead(b.bar))}
          aria-label={`Lead, bar ${from !== null ? from + b.bar : b.bar + 1}: change its notes${b.edited ? " (yours)" : ""}`} />
      ))}
    </div>
  );
}
