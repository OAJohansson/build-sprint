"use client";

// Round 1 · Ear (owner's pick 10, L260). Pick by ear, not by name. Bars Make is unsure of are
// underlined. Tap a bar: a listening strip takes the knobs' place: the track's own bar first, then Make's
// guess and the other versions of the same chord (the reader's usual mistake is the flavour). Play any,
// "Use this" keeps it. "None of these?" builds it on a small keyboard.
import { useEffect, useState } from "react";
import { DUB, LOST, WORST, voicing } from "../chords-directions/data";
import { BarNums, ChordCells, LeadRow } from "../chords-directions/rows";
import { Shell, useChords } from "../chords-directions/shared";
import { fits, flavour, teach, versions, type St } from "./lib";
import { HitsSwitch, Piano } from "./piano";
import r from "./r.module.css";

export function Ear({ st }: { st: St }) {
  const song = st === "notes" ? DUB : st === "worst" ? WORST : LOST;
  // notes: bar 60 built on the keys: B♭m with an A♭ on top, B♭m7.
  const ch = useChords(song, st === "notes" ? { custom: { 3: [58, 61, 65, 68] }, names: { 1: "E♭", 2: "B♭m" } } : undefined);
  const [open, setOpen] = useState<number | null>(st === "fix" || st === "worst" ? 2 : st === "notes" ? 3 : null);
  const [hear, setHear] = useState<string | null>(st === "fix" ? "G7" : null);
  const [keys, setKeys] = useState(st === "notes");
  const [more, setMore] = useState(false);
  useEffect(() => { if (open === null) return; const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(null); setKeys(false); } }; addEventListener("keydown", esc); return () => removeEventListener("keydown", esc); }, [open]);
  const i = open ?? 0, b = song.bars[i], cur = ch.nameOf(i);
  const cands = [b.read, ...versions(song, i, b.read)].slice(0, 3);
  const extra = more ? fits(song).filter((x) => !cands.includes(x.name)).map((x) => x.name) : [];
  const held = ch.hits[i].length === 1 && ch.hits[i][0].len >= 12;
  const fromNotes = open !== null && ch.notesOf(i).join() !== voicing(ch.names[i], ch.low).join();
  const card = (n: string, tag?: string) => (
    <div key={n} className={r.card} data-playing={hear === n ? "" : undefined} data-current={cur === n && !fromNotes ? "" : undefined}>
      <button className={r.play} onClick={() => setHear(hear === n ? null : n)} aria-label={`${hear === n ? "Stop" : "Hear"} ${n} in the loop`}>{hear === n ? "❚❚" : "▶"}</button>
      <span className={r.cardText}><b>{n}</b>{cur === n && !fromNotes ? <small className={r.inMine}>in Mine now</small> : hear === n ? <button className={r.use} onClick={() => { ch.pick(i, n); setOpen(null); setHear(null); }}>Use this</button> : <small>{tag ?? flavour(n)}</small>}</span>
    </div>
  );
  const strip = open === null ? undefined : (
    <div className={r.strip} role="region" aria-label={`Bar ${song.from + i}`}>
      <div className={r.panelHead}>
        <span className={r.where}>Bar {song.from + i}</span>
        <b className={r.ask}>{keys ? <>Build it on the keys: <span className={r.now}>{cur}</span></> : "Which one sounds like the track?"}</b>
        <span className={r.grow} />
        <HitsSwitch held={held} onHeld={(h) => ch.setHits(i, h ? [{ at: 0, len: 16 }] : b.hits.length > 1 ? b.hits : song.bars[0].hits)} />
        <button className={r.link} onClick={() => { setOpen(null); setKeys(false); }}>Close</button>
      </div>
      {keys ? (
        <>
          <Piano notes={ch.notesOf(i)} onToggle={(m) => ch.toggle(i, m)} flats={song.flats} h={60} />
          <p className={r.teach}>{teach(cur, ch.notesOf(i), ch.isCustom(i), song.flats)} <button className={r.link} onClick={() => setKeys(false)}>Back to listening</button></p>
        </>
      ) : (
        <>
          <div className={r.cards}>
            <div className={r.card} data-orig="" data-playing={hear === "orig" ? "" : undefined}>
              <button className={r.play} onClick={() => setHear(hear === "orig" ? null : "orig")} aria-label={hear === "orig" ? "Stop the track's bar" : "Hear the track's bar"}>{hear === "orig" ? "❚❚" : "▶"}</button>
              <span className={r.cardText}><b>The track</b><small>bar {song.from + i} as it is</small></span>
            </div>
            {cands.map((n, k) => card(n, k === 0 ? "Make's guess" : undefined))}
          </div>
          {extra.length > 0 && <div className={r.cards} data-more="">{extra.map((n) => card(n, fits(song).find((x) => x.name === n)?.feel))}</div>}
          <p className={r.foot}>
            <button className={r.link} aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Fewer chords" : "Other chords that fit this song"}</button>
            <button className={r.link} onClick={() => setKeys(true)}>None of these? Build it on the keys</button>
          </p>
        </>
      )}
    </div>
  );
  return (
    <Shell song={song} block={strip}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={open} onOpen={(k) => { setOpen(open === k ? null : k); setHear(null); setKeys(false); setMore(false); }}
        label={<>Chords<small>- - unsure</small></>}
        mark={(k) => <span className={song.bars[k].doubt && !ch.isEdited(k) ? r.unsure : undefined}>{ch.nameOf(k)}</span>} />
      <LeadRow song={song} />
      {open === null && <p className={r.hint} style={{ padding: "10px 0 0 88px" }}>Tap a bar to hear Make&apos;s guess against the track.</p>}
    </Shell>
  );
}
