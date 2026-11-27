"use client";

// Round 2 · Ear (L261): pick by ear, keys one tap away, "All N bars". The bar's panel opens right under
// the rows, in the band above the knob block, so the preset and knobs stay where they are (L224).
// Listening: the track's own bar, Make's guess and other versions of it (the reader's usual mistake is
// the flavour), one card style; Use this in the same place on every card. Keys: the chord on a
// keyboard, the notes named under it, the hits on the 16ths. Lead: tap a bar of the Lead row to edit
// its one-note line on the same kind of grid.
import { useEffect, useState } from "react";
import { DUB, LOST, WORST, voicing, type Song, type Step } from "../chords-directions/data";
import { BarNums, ChordCells } from "../chords-directions/rows";
import { LeadRoll, Shell, cx, s, useChords } from "../chords-directions/shared";
import v from "../chords-directions/v.module.css";
import { fits, flavour, teach, versions } from "../chords-r1/lib";
import { HitsSwitch } from "../chords-r1/piano";
import { Keys, LeadGrid, Timing, phoneRange, type LeadNote } from "./keys";
import r from "./r.module.css";

export type St = "main" | "fix" | "keys" | "timing" | "lead" | "worst";
type Open = { kind: "chord" | "lead"; bar: number } | null;

const songOf = (st: St): Song => (st === "main" || st === "fix" ? LOST : st === "worst" ? WORST : DUB);

export function Ear({ st }: { st: St }) {
  const song = songOf(st);
  const ch = useChords(song, st === "fix" ? { names: Object.fromEntries(song.bars.map((_, i) => [i, "G7"])) }
    : st === "keys" ? { custom: { 2: [58, 61, 65] } }
    : st === "timing" ? { hits: { 0: [{ at: 0, len: 2 }, { at: 3, len: 2 }, { at: 7, len: 3 }, { at: 12, len: 3 }] } } : undefined);
  const [open, setOpen] = useState<Open>(st === "fix" || st === "worst" ? { kind: "chord", bar: 2 } : st === "keys" ? { kind: "chord", bar: 2 } : st === "timing" ? { kind: "chord", bar: 0 } : st === "lead" ? { kind: "lead", bar: 2 } : null);
  const [keys, setKeys] = useState(st === "keys" || st === "timing");
  const [hear, setHear] = useState<string | null>(st === "fix" ? "G7" : null);
  const [all, setAll] = useState(st === "fix");
  const [more, setMore] = useState(false);
  const [hit, setHit] = useState<number | null>(st === "timing" ? 2 : null);
  // In the lead state, one note moved up by hand (E♭5 → D5 held longer, bar 59).
  const [lead, setLead] = useState<LeadNote[][]>(() => song.bars.map((_, b) => (song.lead ?? []).filter((n) => n.bar === b).map(({ at, len, midi }, k) => (st === "lead" && b === 2 && k === 1 ? { at, len: 3, midi: 74 } : { at, len, midi }))));
  const [leadSel, setLeadSel] = useState<number | null>(st === "lead" ? 1 : null);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  const close = () => { setOpen(null); setKeys(false); setHear(null); setMore(false); setHit(null); };
  const openBar = (kind: "chord" | "lead", bar: number) => {
    if (open && open.kind === kind && open.bar === bar) return close();
    setOpen({ kind, bar }); setKeys(false); setHear(null); setMore(false); setHit(null); setLeadSel(null);
  };
  const unsure = song.bars.some((b, i) => b.doubt && !ch.isEdited(i));
  const leadSong = { ...song, lead: lead.flatMap((ns, bar) => ns.map((n) => ({ ...n, bar }))) };

  return (
    <Shell song={song} row={open?.kind === "lead" ? "lead" : "chords"}>
      <BarNums song={song} />
      <ChordCells song={song} ch={ch} open={open?.kind === "chord" ? open.bar : null} lit={open?.kind !== "lead"} onOpen={(i) => openBar("chord", i)}
        label="Chords"
        mark={(i) => <span className={song.bars[i].doubt && !ch.isEdited(i) ? r.unsure : undefined} title={song.bars[i].doubt && !ch.isEdited(i) ? "Make isn't sure of this bar" : undefined}>{ch.nameOf(i)}</span>} />
      <LeadLine song={leadSong} open={open?.kind === "lead" ? open.bar : null} onOpen={(b) => openBar("lead", b)} />
      {open === null ? (
        <p className={r.idle}>Tap a bar to hear Make&apos;s chord against the track.{song.lead && !song.leadOff ? " Tap the Lead row to change its notes." : ""}{unsure && <> <span className={r.unsure}>Dashed</span> bars: Make isn&apos;t sure.</>}</p>
      ) : open.kind === "lead" ? (
        <LeadPanel song={song} bar={open.bar} notes={lead[open.bar]} sel={leadSel} onSel={setLeadSel}
          onNotes={(ns) => setLead((l) => l.map((x, b) => (b === open.bar ? ns : x)))}
          onReset={() => { setLead((l) => l.map((x, b) => (b === open.bar ? (song.lead ?? []).filter((n) => n.bar === b).map(({ at, len, midi }) => ({ at, len, midi })) : x))); setLeadSel(null); }} onClose={close} />
      ) : (
        <ChordPanel song={song} ch={ch} i={open.bar} keys={keys} setKeys={setKeys} hear={hear} setHear={setHear} all={all} setAll={setAll} more={more} setMore={setMore} hit={hit} setHit={setHit} onClose={close} />
      )}
    </Shell>
  );
}

/** The Lead row: off (doubtful) with Play anyway, or the line with one tap target per bar. */
function LeadLine({ song, open, onOpen }: { song: Song; open: number | null; onOpen: (b: number) => void }) {
  if (song.leadOff) {
    return (
      <div className={v.row} style={{ height: 52 }}>
        <span className={v.rowName}>Lead <span className={v.off}>off</span></span>
        <div className={v.offLine}>
          <LeadRoll song={song} off h={30} />
          <span className={v.deskOnly}>{song.leadOff}</span>
          <button className={s.textBtn}>Play anyway</button>
        </div>
      </div>
    );
  }
  if (!song.lead) return null;
  return (
    <div className={v.row} data-lit={open !== null ? "" : undefined} style={{ height: 56 }}>
      <span className={v.rowName}>Lead</span>
      <div className={r.leadLine}>
        <LeadRoll song={song} lit={open !== null} h={44} editBar={open} />
        <div className={r.leadHits}>
          {song.bars.map((_, b) => <button key={b} aria-pressed={open === b} aria-label={`Lead, bar ${song.from + b}: change its notes`} onClick={() => onOpen(b)} />)}
        </div>
      </div>
    </div>
  );
}

function ChordPanel({ song, ch, i, keys, setKeys, hear, setHear, all, setAll, more, setMore, hit, setHit, onClose }: {
  song: Song; ch: ReturnType<typeof useChords>; i: number; keys: boolean; setKeys: (b: boolean) => void; hear: string | null; setHear: (n: string | null) => void;
  all: boolean; setAll: (b: boolean) => void; more: boolean; setMore: (b: boolean) => void; hit: number | null; setHit: (k: number | null) => void; onClose: () => void;
}) {
  const b = song.bars[i], cur = ch.nameOf(i), notes = ch.notesOf(i), hits = ch.hits[i];
  const twins = song.bars.map((_, k) => k).filter((k) => k !== i && song.bars[k].read === b.read);
  const fromNotes = notes.join() !== voicing(ch.names[i], ch.low).join();
  const held = hits.length === 1 && hits[0].len >= 12;
  const cands = [b.read, ...versions(song, i, b.read)].slice(0, 3);
  const extra = more ? fits(song).filter((x) => !cands.includes(x.name)) : [];
  const use = (n: string) => [i, ...(all ? twins : [])].forEach((k) => ch.pick(k, n));
  const setHeld = (h: boolean) => { ch.setHits(i, h ? [{ at: 0, len: 16 }] : b.hits.length > 1 ? b.hits : song.bars[0].hits); setHit(null); };
  const card = (n: string, sub: string, orig?: boolean) => {
    const inMine = !orig && cur === n && !fromNotes;
    const key = orig ? "orig" : n;
    return (
      <div key={key} className={r.card} data-playing={hear === key ? "" : undefined}>
        <button className={r.play} onClick={() => setHear(hear === key ? null : key)} aria-label={`${hear === key ? "Stop" : "Hear"} ${orig ? "the track's bar" : `${n} in the loop`}`}>{hear === key ? "❚❚" : "▶"}</button>
        <span className={r.cardText}><b>{orig ? "The track" : n}</b><small>{sub}</small></span>
        <span className={r.slot}>{orig ? null : inMine ? <span className={r.tag}>in Mine now</span> : <button className={r.use} onClick={() => use(n)}>Use this</button>}</span>
      </div>
    );
  };
  return (
    <section className={r.panel} aria-label={`Bar ${song.from + i}`}>
      <div className={r.head}>
        <span className={r.where}>Bar {song.from + i}</span>
        {keys ? <>
          <b className={r.title}>{cur}</b>
          <span className={r.sentence}>{(() => { const x = teach(cur, notes, fromNotes && ch.isCustom(i), song.flats); return x.startsWith(`${cur} is `) ? x.slice(cur.length + 1) : x; })()}</span>
          {(fromNotes || ch.isEdited(i)) && <button className={r.link} onClick={() => { ch.reset(i); setHit(null); }}>Back to Make&apos;s {b.read}</button>}
        </> : <>
          <b className={r.ask}>Which one sounds like the track?</b>
          {b.doubt && !ch.isEdited(i) && <span className={r.hintText}>Make isn&apos;t sure of this bar</span>}
        </>}
        <span className={r.grow} />
        {!keys && <HitsSwitch held={held} onHeld={setHeld} />}
        {keys && <button className={r.link} onClick={() => setKeys(false)}>Back to listening</button>}
        <button className={r.link} onClick={onClose}>Close</button>
      </div>
      {keys ? (
        <>
          <Keys notes={notes} onToggle={(m) => ch.toggle(i, m)} lo={48} hi={76} flats={song.flats} className={v.deskOnly} />
          <Keys notes={notes} onToggle={(m) => ch.toggle(i, m)} lo={phoneRange(notes)[0]} hi={phoneRange(notes)[1]} flats={song.flats} className={r.phoneKeys} />
          <Timing hits={hits} sel={hit} onSel={setHit} onHits={(h) => ch.setHits(i, h)} lead={<HitsSwitch held={held} onHeld={setHeld} />} />
        </>
      ) : (
        <>
          <div className={r.cards}>
            {card("", `bar ${song.from + i} as it is`, true)}
            {cands.map((n, k) => card(n, k === 0 ? `Make's guess · ${flavour(n)}` : flavour(n)))}
          </div>
          {extra.length > 0 && <div className={r.cards} data-more="">{extra.map((x) => card(x.name, x.feel))}</div>}
          <p className={r.foot}>
            {twins.length > 0 && <label className={r.check}><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Use it in all {twins.length + 1} {b.read} bars</label>}
            <span className={r.grow} />
            <button className={r.link} aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Fewer chords" : "Other chords that fit this song"}</button>
            <button className={r.link} onClick={() => setKeys(true)}>None of these? Build it on the keys</button>
          </p>
        </>
      )}
    </section>
  );
}

function LeadPanel({ song, bar, notes, sel, onSel, onNotes, onReset, onClose }: { song: Song; bar: number; notes: LeadNote[]; sel: number | null; onSel: (k: number | null) => void; onNotes: (n: LeadNote[]) => void; onReset: () => void; onClose: () => void }) {
  const n = sel !== null ? notes[sel] : null;
  const len = (d: number) => n && sel !== null && onNotes(notes.map((x, k) => (k === sel ? { ...x, len: Math.max(1, Math.min(16 - x.at, x.len + d)) } : x)));
  return (
    <section className={cx(r.panel, r.leadPanel)} aria-label={`Lead, bar ${song.from + bar}`}>
      <div className={r.head}>
        <span className={r.where}>Lead · bar {song.from + bar}</span>
        <b className={r.ask}>Tap a square to place a note</b>
        <span className={r.hintText}>one note at a time, like a hummed line</span>
        <span className={r.grow} />
        <button className={r.link} onClick={onReset}>Back to Make&apos;s line</button>
        <button className={r.link} onClick={onClose}>Close</button>
      </div>
      <div className={r.leadBody}><LeadGrid notes={notes} lo={69} hi={78} flats={song.flats} sel={sel} onSel={onSel} onNotes={onNotes} />
      <div className={r.leadSide}>
        <span className={r.label}>{n ? `This note` : "Notes"}</span>
        {n ? (
          <span className={r.moves}>
            <button onClick={() => len(-1)} disabled={n.len <= 1}>Shorter</button>
            <button onClick={() => len(1)} disabled={n.at + n.len >= 16}>Longer</button>
            <button onClick={() => { onNotes(notes.filter((_, k) => k !== sel)); onSel(null); }}>Remove</button>
          </span>
        ) : <span className={r.faint}>Tap a note to make it longer or shorter.</span>}
      </div></div>
    </section>
  );
}

export type { Step };
