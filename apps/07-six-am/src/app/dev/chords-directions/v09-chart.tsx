"use client";

// 9 Chart: the loop as a musician's chord chart (a lead sheet): four bars a line, chord symbols in the
// serif, the hits as marks under each, the lead as a thin line above. Tap a bar and Make's other
// guesses appear pencilled above its symbol; the key's other chords line up under the chart.
import { useState } from "react";
import { DUB } from "./data";
import { Name, NoteGrid, Shell, useChords, v, type St } from "./shared";

export function V09Chart({ st }: { st: St }) {
  const song = DUB;
  const ch = useChords(song);
  const [sel, setSel] = useState<number | null>(st === "key" ? 1 : null);
  const [notes, setNotes] = useState(false);
  const lead = song.lead ?? [];
  const lo = Math.min(...lead.map((n) => n.midi)), hi = Math.max(...lead.map((n) => n.midi));
  const line = (a: number) => (
    <div className={v.chartLine} key={a}>
      {[a, a + 1, a + 2, a + 3].map((i) => {
        const b = song.bars[i];
        return (
          <div key={i} className={v.measure} role="button" tabIndex={0} aria-pressed={sel === i} aria-label={`Bar ${song.from + i}: ${ch.nameOf(i)}`} onClick={() => setSel(sel === i ? null : i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(sel === i ? null : i); } }}>
            <span className={v.barNo}>{song.from + i}</span>
            {sel === i && (
              <span className={v.pencil}>
                {[b.read, ...b.alts.map((x) => x.name)].filter((n) => n !== ch.nameOf(i)).map((n) => (
                  <button key={n} onClick={(e) => { e.stopPropagation(); ch.pick(i, n); }}><Name n={n} /></button>
                ))}
              </span>
            )}
            <div className={v.leadDots} aria-hidden style={sel === i ? { visibility: "hidden" } : undefined}>
              {lead.filter((n) => n.bar === i).map((n, k) => <i key={k} style={{ left: `${(n.at / 16) * 100}%`, width: `${(n.len / 16) * 100}%`, top: `${((hi - n.midi) / (hi - lo)) * 20}px` }} />)}
            </div>
            <span className={v.sym}><Name n={ch.nameOf(i)} />{ch.isEdited(i) && <small>changed</small>}</span>
            <svg className={v.slashes} viewBox="0 0 160 8" preserveAspectRatio="none" aria-hidden>
              {ch.hits[i].map((x) => <rect key={x.at} x={x.at * 10} y={0} width={Math.max(3, x.len * 10 - 2)} height={x.len > 4 ? 3 : 8} fill="var(--muted)" />)}
            </svg>
          </div>
        );
      })}
    </div>
  );
  return (
    <Shell song={song}>
      {notes && sel !== null ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className={v.quiet}>Bar {song.from + sel} · {ch.nameOf(sel)} · <button className={v.link} onClick={() => setNotes(false)}>Back to the chart</button></span>
          <NoteGrid ch={ch} i={sel} flats lo={57} hi={74} rowH={10} wide />
        </div>
      ) : (
        <>
          <div className={v.chart}>{line(0)}{line(4)}</div>
          <div className={v.chartFoot}>
            {sel !== null ? <>
              <span>Bar {song.from + sel}: tap a pencilled chord above it, or one in {song.keyShort}:</span>
              {song.keyChords.filter((c) => c !== ch.nameOf(sel)).map((n) => <button key={n} onClick={() => ch.pick(sel, n)}><Name n={n} /></button>)}
              <button className={v.link} style={{ border: 0, font: "500 12px var(--f-mono)" }} onClick={() => setNotes(true)}>Notes</button>
            </> : <span>Tap a bar to change its chord. The teal line is the lead.</span>}
          </div>
        </>
      )}
    </Shell>
  );
}
