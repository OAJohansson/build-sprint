"use client";

// Round 2 pieces (dev only): the keyboard (unlit keys dim, lit notes carry the light, names under the
// keys), the timing strip (hits on the 16ths: tap to add, tap one to pick it, then move or stretch it)
// and the lead grid (a one-note line: one note per 16th).
import type { Step } from "../chords-directions/data";
import { isBlack, noteName } from "../chords-directions/data";
import r from "./r.module.css";

export function Keys({ notes, onToggle, lo, hi, flats, className }: { notes: number[]; onToggle: (m: number) => void; lo: number; hi: number; flats: boolean; className?: string }) {
  const all = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
  const whites = all.filter((m) => !isBlack(m)), blacks = all.filter(isBlack);
  const x = (m: number) => (isBlack(m) ? (whites.indexOf(m - 1) + 1) / whites.length : (whites.indexOf(m) + 0.5) / whites.length) * 100;
  const name = (m: number) => noteName(m, flats).replace(/-?\d+$/, "");
  return (
    <div className={`${r.keysWrap} ${className ?? ""}`}>
      <div className={r.keys} role="group" aria-label="The chord's notes on a keyboard">
        {whites.map((m) => (
          <button key={m} className={r.white} data-on={notes.includes(m) ? "" : undefined} aria-pressed={notes.includes(m)} aria-label={noteName(m, flats)} onClick={() => onToggle(m)} />
        ))}
        {blacks.map((m) => (
          <button key={m} className={r.black} style={{ left: `${x(m)}%`, width: `${(0.62 / whites.length) * 100}%` }} data-on={notes.includes(m) ? "" : undefined}
            aria-pressed={notes.includes(m)} aria-label={noteName(m, flats)} onClick={() => onToggle(m)} />
        ))}
      </div>
      <div className={r.keyNames} aria-hidden>
        {all.filter((m) => notes.includes(m) || (m % 12 === 0 && !notes.some((n) => Math.abs(n - m) <= 2))).map((m) => (
          <span key={m} style={{ left: `${x(m)}%` }} data-on={notes.includes(m) ? "" : undefined}>{notes.includes(m) ? name(m) : noteName(m, flats)}</span>
        ))}
      </div>
    </div>
  );
}

/** One and a half octaves around the chord, for the phone. */
export function phoneRange(notes: number[]): [number, number] {
  let lo = Math.min(...notes) - 2;
  while (isBlack(lo)) lo -= 1;
  let hi = lo + 18;
  while (isBlack(hi)) hi += 1; // never end on a black key (it would hang past the edge)
  return [lo, hi];
}

/** Hits on the 16ths. Tap an empty 16th to add a hit there; tap a hit to pick it; move or stretch it. */
export function Timing({ hits, sel, onSel, onHits, label = "When it plays", lead }: { hits: Step[]; sel: number | null; onSel: (k: number | null) => void; onHits: (h: Step[]) => void; label?: string; lead?: React.ReactNode }) {
  const at = (st: number) => hits.findIndex((x) => st >= x.at && st < x.at + x.len);
  const h = sel !== null ? hits[sel] : null;
  const free = (from: number, len: number, skip: number) => from >= 0 && from + len <= 16 && hits.every((x, k) => k === skip || from + len <= x.at || from >= x.at + x.len);
  const set = (k: number, nx: Step) => onHits(hits.map((x, j) => (j === k ? nx : x)));
  return (
    <div className={r.timing}>
      <span className={r.label}>{label}</span>
      {lead}
      <div className={r.sixteenths} role="group" aria-label={`${label}, in 16ths`}>
        {Array.from({ length: 16 }, (_, st) => <i key={st} data-beat={st % 4 === 0 ? "" : undefined} />)}
        {Array.from({ length: 16 }, (_, st) => at(st) < 0 && (
          <button key={`e${st}`} className={r.empty} style={{ left: `${(st / 16) * 100}%` }} aria-label={`Add a hit on 16th ${st + 1}`} onClick={() => { onHits([...hits, { at: st, len: 1 }].sort((a, b) => a.at - b.at)); onSel(null); }} />
        ))}
        {hits.map((x, k) => (
          <button key={`h${x.at}`} className={r.hit} data-sel={sel === k ? "" : undefined} style={{ left: `${(x.at / 16) * 100}%`, width: `${(x.len / 16) * 100}%` }}
            aria-pressed={sel === k} aria-label={`Hit on 16th ${x.at + 1}, ${x.len} long`} onClick={() => onSel(sel === k ? null : k)} />
        ))}
      </div>
      {h && sel !== null ? (
        <span className={r.moves}>
          <button onClick={() => free(h.at - 1, h.len, sel) && set(sel, { ...h, at: h.at - 1 })} disabled={!free(h.at - 1, h.len, sel)}>Earlier</button>
          <button onClick={() => free(h.at + 1, h.len, sel) && set(sel, { ...h, at: h.at + 1 })} disabled={!free(h.at + 1, h.len, sel)}>Later</button>
          <button onClick={() => set(sel, { ...h, len: h.len - 1 })} disabled={h.len <= 1}>Shorter</button>
          <button onClick={() => free(h.at, h.len + 1, sel) && set(sel, { ...h, len: h.len + 1 })} disabled={!free(h.at, h.len + 1, sel)}>Longer</button>
          <button onClick={() => { onHits(hits.filter((_, j) => j !== sel)); onSel(null); }}>Remove</button>
        </span>
      ) : <span className={r.faint}>Tap a hit to move it.</span>}
    </div>
  );
}

/** The lead in one bar: a row per note (names on the left), 16 columns. One note at a time. */
export type LeadNote = { at: number; len: number; midi: number };
export function LeadGrid({ notes, lo, hi, flats, sel, onSel, onNotes }: { notes: LeadNote[]; lo: number; hi: number; flats: boolean; sel: number | null; onSel: (k: number | null) => void; onNotes: (n: LeadNote[]) => void }) {
  const rows = Array.from({ length: hi - lo + 1 }, (_, k) => hi - k);
  const place = (midi: number, st: number) => {
    const hit = notes.findIndex((n) => st >= n.at && st < n.at + n.len);
    if (hit >= 0 && notes[hit].midi === midi) { onSel(sel === hit ? null : hit); return; }
    // one note at a time: the new note replaces whatever sounds on that 16th
    const rest = notes.filter((n) => !(st >= n.at && st < n.at + n.len));
    const next = [...rest, { at: st, len: 1, midi }].sort((a, b) => a.at - b.at);
    onNotes(next);
    onSel(next.findIndex((n) => n.at === st));
  };
  return (
    <div className={r.leadGrid} role="group" aria-label="The lead in this bar">
      {rows.map((m) => (
        <div key={m} className={r.leadRow} data-black={isBlack(m) ? "" : undefined}>
          <span className={r.leadKey}>{noteName(m, flats)}</span>
          <div className={r.leadCells}>
            {Array.from({ length: 16 }, (_, st) => {
              const k = notes.findIndex((n) => n.midi === m && st >= n.at && st < n.at + n.len);
              return <button key={st} data-beat={st % 4 === 0 ? "" : undefined} data-on={k >= 0 ? "" : undefined} data-sel={k >= 0 && k === sel ? "" : undefined}
                aria-label={`${noteName(m, flats)}, 16th ${st + 1}${k >= 0 ? ", on" : ""}`} onClick={() => place(m, st)} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
