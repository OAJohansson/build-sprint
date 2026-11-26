"use client";

// Round 3 · Ear polish (critic round 2 at 8/10, no re-score). One fixed band for the bar's panel in every
// state, so the knob block never moves; the room scrolls rather than covering the knobs. Chord names
// are never cut (the bar number sits small in the tile's corner); unsure bars have a dashed tile border.
// Cards are shorter with "Use this" pinned to the bottom. Keys: one undo under the keys, Short hits /
// Held as presets, beats numbered. Lead: the song key's notes by default, "All notes" to add your own.
import { useEffect, useState } from "react";
import { DUB, LOST, WORST, voicing, type Song } from "../chords-directions/data";
import { Hits, LeadRoll, Shell, cx, s, useChords } from "../chords-directions/shared";
import v from "../chords-directions/v.module.css";
import { fits, flavour, teach, versions } from "../chords-r1/lib";
import { Keys, LeadGrid, Presets, Timing, phoneRange, type LeadNote } from "./keys";
import r from "./r.module.css";

export type St = "main" | "fix" | "keys" | "timing" | "lead" | "worst";
type Open = { kind: "chord" | "lead"; bar: number } | null;
type Ch = ReturnType<typeof useChords>;

const songOf = (st: St): Song => (st === "main" || st === "fix" ? LOST : st === "worst" ? WORST : DUB);
/** The read pattern if it has hits, else the song's first bar (a held bar's "Short hits"). */
const shortOf = (song: Song, i: number) => (song.bars[i].hits.length > 1 ? song.bars[i].hits : song.bars[0].hits);

export function Ear({ st }: { st: St }) {
  const song = songOf(st);
  const ch = useChords(song, st === "fix" ? { names: Object.fromEntries(song.bars.map((_, i) => [i, "G7"])) }
    : st === "keys" ? { custom: { 2: [58, 61, 65] } }
    : st === "timing" ? { hits: { 0: [{ at: 0, len: 2 }, { at: 3, len: 2 }, { at: 7, len: 3 }, { at: 12, len: 3 }] } } : undefined);
  const [open, setOpen] = useState<Open>(st === "fix" || st === "worst" || st === "keys" ? { kind: "chord", bar: 2 } : st === "timing" ? { kind: "chord", bar: 0 } : st === "lead" ? { kind: "lead", bar: 2 } : null);
  const [keys, setKeys] = useState(st === "keys" || st === "timing");
  const [hear, setHear] = useState<string | null>(st === "fix" ? "G7" : null);
  const [all, setAll] = useState(st === "fix");
  const [more, setMore] = useState(false);
  const [hit, setHit] = useState<number | null>(st === "timing" ? 2 : null);
  // In the lead state, one note moved up by hand (D♭5 → E♭5, held longer, bar 59).
  const [lead, setLead] = useState<LeadNote[][]>(() => song.bars.map((_, b) => (song.lead ?? []).filter((n) => n.bar === b).map(({ at, len, midi }, k) => (st === "lead" && b === 2 && k === 1 ? { at, len: 3, midi: 75 } : { at, len, midi }))));
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
  const unsure = (i: number) => !!song.bars[i].doubt && !ch.isEdited(i);
  const anyUnsure = song.bars.some((_, i) => unsure(i));
  const leadSong = { ...song, lead: lead.flatMap((ns, bar) => ns.map((n) => ({ ...n, bar }))) };

  return (
    <Shell song={song} row={open?.kind === "lead" ? "lead" : "chords"} sticky={false}>
      <div className={v.row} data-lit={open?.kind !== "lead" ? "" : undefined}>
        <span className={v.rowName}>Chords</span>
        <div className={r.tiles} data-many={song.bars.length > 8 ? "" : undefined}>
          {song.bars.map((_, i) => (
            <button key={i} className={r.tile} aria-expanded={open?.kind === "chord" && open.bar === i} data-unsure={unsure(i) ? "" : undefined}
              aria-label={`Bar ${song.from + i}: ${ch.nameOf(i)}${unsure(i) ? ", Make isn't sure" : ""}. Change chord`} onClick={() => openBar("chord", i)}>
              <span className={r.tileName}>{ch.nameOf(i)}</span>
              <span className={r.tileFoot}><Hits hits={ch.hits[i]} /><small>{song.from + i}</small></span>
            </button>
          ))}
        </div>
      </div>
      <LeadLine song={leadSong} open={open?.kind === "lead" ? open.bar : null} onOpen={(b) => openBar("lead", b)} />
      <div className={r.band}>
        {open === null ? (
          <p className={r.idle}>Tap a bar to hear Make&apos;s chord against the track.{song.lead && !song.leadOff ? " Tap the Lead row to change its notes." : ""}{anyUnsure && " Bars with a dashed edge: Make isn't sure."}</p>
        ) : open.kind === "lead" ? (
          <LeadPanel song={song} bar={open.bar} notes={lead[open.bar]} sel={leadSel} onSel={setLeadSel}
            onNotes={(ns) => setLead((l) => l.map((x, b) => (b === open.bar ? ns : x)))}
            onReset={() => { setLead((l) => l.map((x, b) => (b === open.bar ? (song.lead ?? []).filter((n) => n.bar === b).map(({ at, len, midi }) => ({ at, len, midi })) : x))); setLeadSel(null); }} onClose={close} />
        ) : (
          <ChordPanel song={song} ch={ch} i={open.bar} unsure={unsure(open.bar)} keys={keys} setKeys={setKeys} hear={hear} setHear={setHear} all={all} setAll={setAll} more={more} setMore={setMore} hit={hit} setHit={setHit} onClose={close} />
        )}
      </div>
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

function ChordPanel({ song, ch, i, unsure, keys, setKeys, hear, setHear, all, setAll, more, setMore, hit, setHit, onClose }: {
  song: Song; ch: Ch; i: number; unsure: boolean; keys: boolean; setKeys: (b: boolean) => void; hear: string | null; setHear: (n: string | null) => void;
  all: boolean; setAll: (b: boolean) => void; more: boolean; setMore: (b: boolean) => void; hit: number | null; setHit: (k: number | null) => void; onClose: () => void;
}) {
  const b = song.bars[i], cur = ch.nameOf(i), notes = ch.notesOf(i), hits = ch.hits[i];
  const twins = song.bars.map((_, k) => k).filter((k) => k !== i && song.bars[k].read === b.read);
  const fromNotes = notes.join() !== voicing(ch.names[i], ch.low).join();
  const cands = [b.read, ...versions(song, i, b.read)].slice(0, 3);
  const extra = more ? fits(song).filter((x) => !cands.includes(x.name)) : [];
  const use = (n: string) => [i, ...(all ? twins : [])].forEach((k) => ch.pick(k, n));
  const short = shortOf(song, i);
  const card = (n: string, mood: string, opts: { orig?: boolean; guess?: boolean } = {}) => {
    const inMine = !opts.orig && cur === n && !fromNotes;
    const key = opts.orig ? "orig" : n;
    return (
      <div key={key} className={r.card} data-playing={hear === key ? "" : undefined}>
        <span className={r.cardTop}>
          <button className={r.play} onClick={() => setHear(hear === key ? null : key)} aria-label={`${hear === key ? "Stop" : "Hear"} ${opts.orig ? "the track's bar" : `${n} in the loop`}`}>{hear === key ? "❚❚" : "▶"}</button>
          <b>{opts.orig ? "The track" : n}</b>
          {opts.guess && <small className={r.guess}>Make&apos;s guess</small>}
        </span>
        <span className={r.cardFoot}>
          <small>{mood}</small>
          {opts.orig ? null : inMine ? <span className={r.tag}>in Mine now</span> : <button className={r.use} onClick={() => use(n)}>Use this</button>}
        </span>
      </div>
    );
  };
  if (keys) {
    const t = teach(cur, notes, fromNotes && ch.isCustom(i), song.flats);
    const [plo, phi] = phoneRange(notes);
    return (
      <section className={r.panel} aria-label={`Bar ${song.from + i} on the keys`}>
        <div className={r.head}>
          <span className={r.where}>Bar {song.from + i}</span>
          <b className={r.title}>{cur}</b>
          <span className={r.sentence}>{t.startsWith(`${cur} is `) ? t.slice(cur.length + 1) : t}</span>
          <span className={r.grow} />
          <button className={r.link} onClick={() => { setKeys(false); setHit(null); }}>Back to listening</button>
        </div>
        <Keys notes={notes} onToggle={(m) => ch.toggle(i, m)} lo={48} hi={76} flats={song.flats} className={v.deskOnly} />
        <Keys notes={notes} onToggle={(m) => ch.toggle(i, m)} lo={plo} hi={phi} flats={song.flats} className={r.phoneKeys} />
        <p className={r.undo}>{(fromNotes || ch.isEdited(i)) ? <button className={r.link} onClick={() => { ch.reset(i); setHit(null); }}>Back to Make&apos;s {b.read}</button> : <span className={r.faint}>Tap a key to add or take away a note.</span>}</p>
        <Timing hits={hits} sel={hit} onSel={setHit} onHits={(h) => ch.setHits(i, h)} short={short} />
      </section>
    );
  }
  return (
    <section className={r.panel} aria-label={`Bar ${song.from + i}`}>
      <div className={r.head}>
        <span className={r.where}>Bar {song.from + i}</span>
        <b className={r.ask}>Which one sounds like the track?</b>
        {unsure && <span className={r.hintText}>Make isn&apos;t sure of this bar</span>}
        <span className={r.grow} />
        <Presets hits={hits} short={short} onHits={(h) => ch.setHits(i, h)} />
        <button className={r.link} onClick={onClose}>Close</button>
      </div>
      <div className={r.cards}>
        {card("", `bar ${song.from + i} as it is`, { orig: true })}
        {cands.map((n, k) => card(n, flavour(n), { guess: k === 0 }))}
      </div>
      {extra.length > 0 && <div className={r.cards} data-more="">{extra.map((x) => card(x.name, x.feel))}</div>}
      <p className={r.foot}>
        {twins.length > 0 && <label className={r.check}><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Use it in all {twins.length + 1} bars</label>}
        <span className={r.grow} />
        <button className={r.link} aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Fewer chords" : "Other chords that fit this song"}</button>
        <button className={r.link} onClick={() => setKeys(true)}>None of these? Build it on the keys</button>
      </p>
    </section>
  );
}

/** The song key's notes in the lead's range (a major key; shortcut: the minor keys come with the real key data). */
const KEY_PCS: Record<string, number[]> = { "A♭ major": [8, 10, 0, 1, 3, 5, 7], "G major": [7, 9, 11, 0, 2, 4, 6], "F♯ major": [6, 8, 10, 11, 1, 3, 5] };

function LeadPanel({ song, bar, notes, sel, onSel, onNotes, onReset, onClose }: { song: Song; bar: number; notes: LeadNote[]; sel: number | null; onSel: (k: number | null) => void; onNotes: (n: LeadNote[]) => void; onReset: () => void; onClose: () => void }) {
  const pcs = KEY_PCS[song.keyShort] ?? [];
  const outside = notes.some((n) => !pcs.includes(n.midi % 12));
  const [allNotes, setAllNotes] = useState(outside);
  const range = Array.from({ length: 13 }, (_, k) => 80 - k); // A♭5 down to G4
  const rows = allNotes ? range.filter((m) => m <= 79 && m >= 69) : range.filter((m) => pcs.includes(m % 12)).slice(0, 7);
  const n = sel !== null ? notes[sel] : null;
  const len = (d: number) => n && sel !== null && onNotes(notes.map((x, k) => (k === sel ? { ...x, len: Math.max(1, Math.min(16 - x.at, x.len + d)) } : x)));
  return (
    <section className={cx(r.panel, r.leadPanel)} aria-label={`Lead, bar ${song.from + bar}`}>
      <div className={r.head}>
        <span className={r.where}>Lead · bar {song.from + bar}</span>
        <b className={r.ask}>Tap a square to place a note</b>
        <span className={r.hintText}>one note at a time, like a hummed line</span>
        <span className={r.grow} />
        <label className={r.quietSwitch}><input type="checkbox" checked={allNotes} onChange={(e) => setAllNotes(e.target.checked)} disabled={outside} /> All notes</label>
        <button className={r.link} onClick={onClose}>Close</button>
      </div>
      <LeadGrid notes={notes} rows={rows} flats={song.flats} sel={sel} onSel={onSel} onNotes={onNotes} tall={!allNotes} />
      <div className={r.leadFoot}>
        {n ? (
          <span className={r.moves}>
            <button onClick={() => len(-1)} disabled={n.len <= 1}>Shorter</button>
            <button onClick={() => len(1)} disabled={n.at + n.len >= 16}>Longer</button>
            <button onClick={() => { onNotes(notes.filter((_, k) => k !== sel)); onSel(null); }}>Remove</button>
          </span>
        ) : <span className={r.faint}>Tap a note to make it longer or shorter.</span>}
        <span className={r.grow} />
        <button className={r.link} onClick={onReset}>Back to Make&apos;s line</button>
      </div>
    </section>
  );
}

