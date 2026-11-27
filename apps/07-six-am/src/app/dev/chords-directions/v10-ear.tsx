"use client";

// 10 Ear: pick by ear, not by name. Bars Make is unsure of are underlined. Tap a bar: a listening strip
// covers the knobs for a moment, the original bar first, then each guess with how close it measures to
// it; tap one to hear it, "Use this" to keep it.
import { useState } from "react";
import { LOST } from "./data";
import { BarNums, ChordCells, LeadRow } from "./rows";
import { Shell, useChords, s, v, type St } from "./shared";

export function V10Ear({ st }: { st: St }) {
  const song = LOST;
  const ch = useChords(song);
  const [open, setOpen] = useState<number | null>(st === "key" ? 2 : null);
  const [hear, setHear] = useState<string | null>(st === "key" ? "G7" : null);
  const b = open !== null ? song.bars[open] : null;
  const cands = b ? [{ name: b.read, score: 0.98 }, ...b.alts] : [];
  return (
    <Shell song={song}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={open} onOpen={(i) => { setOpen(open === i ? null : i); setHear(null); }}
        mark={(i) => <span className={song.bars[i].doubt && !ch.isEdited(i) ? v.unsure : undefined} title={song.bars[i].doubt ? "Make isn't sure of this bar" : undefined}>{ch.nameOf(i)}</span>} />
      <LeadRow song={song} />
      {open !== null && b && (
        <div className={v.ear} style={{ top: 118 }} role="dialog" aria-label={`Bar ${song.from + open}`}>
          <div className={v.earHead}>
            <span className={s.drLabel}>Bar {song.from + open}</span>
            <b>Which one sounds like the track?</b>
            <button className={v.link} onClick={() => setOpen(null)}>Close</button>
          </div>
          <div className={v.earRow}>
            {cands.slice(0, 4).map((c) => (
              <div key={c.name} className={v.cand} data-playing={hear === c.name ? "" : undefined} data-current={ch.nameOf(open) === c.name ? "" : undefined}>
                <span className={v.candTop}><button className={v.playDot} onClick={() => setHear(hear === c.name ? null : c.name)} aria-label={`${hear === c.name ? "Stop" : "Hear"} ${c.name} in the loop`}>{hear === c.name ? "❚❚" : "▶"}</button><b>{c.name}</b>{c.name === b.read && <small className={v.faintText}>first read</small>}</span>
                <span className={v.meter} aria-hidden><i style={{ width: `${Math.round(c.score * 100)}%` }} /></span>
                <span className={v.candFoot}><span>{Math.round(c.score * 100)} close</span>{hear === c.name && ch.nameOf(open) !== c.name && <button className={s.textBtn} onClick={() => { ch.pick(open, c.name); setOpen(null); }}>Use this</button>}</span>
              </div>
            ))}
          </div>
          <span className={v.faintText}>Playing in the loop with the drums, then the original bar, back and forth. Other chords in G major: <button className={v.link}>show</button></span>
        </div>
      )}
    </Shell>
  );
}
