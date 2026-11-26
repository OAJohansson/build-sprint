"use client";

// 8 Clips: chords as clips on one lane with a 16th grid, like a DAW: a chord that holds for two bars
// is one clip, its hits drawn inside. Select a clip: handles move its start and end by 16ths, and a
// bar above it names the chord (a menu), its start and length, and opens its notes.
import { useState } from "react";
import { DUB } from "./data";
import { BarNums, LeadRow } from "./rows";
import { Hits, PickList, Shell, useChords, v, type St } from "./shared";

type Clip = { name: string; from: number; len: number; bar: number }; // in 16ths from the loop start

export function V08Clips({ st }: { st: St }) {
  const song = DUB;
  const ch = useChords(song, { names: { 1: "E♭", 2: "B♭m" } });
  const [clips, setClips] = useState<Clip[]>(() => {
    const out: Clip[] = [];
    song.bars.forEach((_, i) => {
      const n = i === 1 ? "E♭" : i === 2 ? "B♭m" : song.bars[i].read, prev = out[out.length - 1];
      if (prev && prev.name === n) prev.len += 16; else out.push({ name: n, from: i * 16, len: 16, bar: i });
    });
    if (st === "key") { out[1].from -= 1; out[1].len += 1; out[0].len -= 1; } // E♭ comes in a 16th early
    return out;
  });
  const [sel, setSel] = useState<number | null>(st === "key" ? 1 : null);
  const [menu, setMenu] = useState(st === "key");
  const pct = (x: number) => `${(x / 128) * 100}%`;
  const nudge = (k: number, edge: "start" | "end", d: number) => setClips((cs) => cs.map((c, j) => {
    if (j === k) return edge === "start" ? { ...c, from: c.from + d, len: c.len - d } : { ...c, len: c.len + d };
    if (edge === "start" && j === k - 1) return { ...c, len: c.len + d };
    if (edge === "end" && j === k + 1) return { ...c, from: c.from + d, len: c.len - d };
    return c;
  }));
  const c = sel !== null ? clips[sel] : null;
  const where = (x: number) => `${song.from + Math.floor(x / 16)}.${Math.floor((x % 16) / 4) + 1}${x % 4 ? `.${(x % 4) + 1}` : ""}`;
  return (
    <Shell song={song}>
      <BarNums song={song} />
      <div className={v.row} data-lit="">
        <button className={v.rowName}>Chords</button>
        <div className={v.lane}>
          {clips.map((x, k) => {
            const bars = Array.from({ length: Math.ceil(x.len / 16) }, (_, b) => ch.hits[Math.min(7, x.bar + b)]);
            return (
              <button key={k} className={v.clip} aria-pressed={sel === k} style={{ left: pct(x.from), width: pct(x.len) }} onClick={() => { setSel(sel === k ? null : k); setMenu(false); }}>
                <b>{x.name}</b>
                <span style={{ display: "flex", gap: 4 }}>{bars.map((h, b) => <Hits key={b} hits={h} />)}</span>
              </button>
            );
          })}
          {c && sel !== null && <>
            <button className={v.handle} style={{ left: pct(c.from) }} aria-label="Move the start" onClick={() => nudge(sel, "start", -1)} />
            <button className={v.handle} style={{ left: pct(c.from + c.len) }} aria-label="Move the end" onClick={() => nudge(sel, "end", 1)} />
          </>}
        </div>
      </div>
      {c && sel !== null ? (
        <div className={v.clipBar} style={{ position: "relative", zIndex: 5 }}>
          <button className={v.chordBtn} aria-haspopup="dialog" aria-expanded={menu} onClick={() => setMenu(!menu)}>{c.name} ▾</button>
          <span>starts {where(c.from)}{c.from % 16 ? ", a 16th early" : ""} · {c.len % 16 === 0 ? `${c.len / 16} bar${c.len > 16 ? "s" : ""}` : `${Math.floor(c.len / 16) ? `${Math.floor(c.len / 16)} bar and ` : ""}${c.len % 16} sixteenth${c.len % 16 > 1 ? "s" : ""}`}</span>
          <span className={v.faintText}>drag the white edges to move it by 16ths</span>
          <button className={v.link} style={{ marginLeft: "auto" }}>Notes</button>
          {menu && (
            <div className={v.pop} style={{ top: 48, left: 88 }}>
              <PickList song={song} ch={{ ...ch, nameOf: () => c.name, pick: (_i: number, n: string) => { setClips((cs) => cs.map((y, j) => (j === sel ? { ...y, name: n } : y))); setMenu(false); } }} i={c.bar} />
            </div>
          )}
        </div>
      ) : <p className={v.clipBar}><span className={v.faintText}>Tap a chord to change it, move it or open its notes.</span></p>}
      <LeadRow song={song} />
    </Shell>
  );
}
