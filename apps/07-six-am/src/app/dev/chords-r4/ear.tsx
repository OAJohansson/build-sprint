"use client";

// Round 5 (in r4): labels that say what things are are back, sentences on how to operate stay out.
// Round 4 · Ear, simplified until it explains itself (owner on the canvas: a screen that needs "tap a bar
// to…" isn't intuitive enough). The panel is never empty: the first bar Make isn't sure of is open (else
// bar 1). Cards work like a GarageBand chord strip: tap = hear it in the loop and use it; tap another to
// change your mind. The track is a reference button, not a choice. Words moved to aria-labels/tooltips.
import { useEffect, useState } from "react";
import { ArrowLeft, AudioWaveform, Check, Pause, Piano, Play, RotateCcw, X } from "lucide-react";
import { DUB, LOST, WORST, voicing, type Song } from "../chords-directions/data";
import { Hits, LeadRoll, Shell, cx, s, useChords } from "../chords-directions/shared";
import v from "../chords-directions/v.module.css";
import { fits, flavour, versions } from "../chords-r1/lib";
import { Keys, LeadGrid, Timing, phoneRange, type LeadNote } from "./keys";
import r from "./r.module.css";

export type St = "main" | "fix" | "keys" | "timing" | "lead" | "worst";
type Open = { kind: "chord" | "lead"; bar: number } | null;
type Ch = ReturnType<typeof useChords>;

const songOf = (st: St): Song => (st === "main" || st === "fix" ? LOST : st === "worst" ? WORST : DUB);
/** The read pattern if it has hits, else the song's first bar (a held bar's "Short hits"). */
const shortOf = (song: Song, i: number) => (song.bars[i].hits.length > 1 ? song.bars[i].hits : song.bars[0].hits);
/** On open: the first bar Make isn't sure of, else bar 1. */
const firstBar = (song: Song) => Math.max(0, song.bars.findIndex((b) => b.doubt));

export function Ear({ st }: { st: St }) {
  const song = songOf(st);
  const ch = useChords(song, st === "fix" ? { names: Object.fromEntries(song.bars.map((_, i) => [i, "G7"])) }
    : st === "keys" ? { custom: { 2: [58, 61, 65] } }
    : st === "timing" ? { hits: { 0: [{ at: 0, len: 2 }, { at: 3, len: 2 }, { at: 7, len: 3 }, { at: 12, len: 3 }] } } : undefined);
  const [open, setOpen] = useState<Open>(st === "keys" ? { kind: "chord", bar: 2 } : st === "timing" ? { kind: "chord", bar: 0 } : st === "lead" ? { kind: "lead", bar: 2 } : { kind: "chord", bar: firstBar(song) });
  const [keys, setKeys] = useState(st === "keys" || st === "timing");
  const [hear, setHear] = useState<string | null>(st === "fix" ? "G7" : null);
  const [all, setAll] = useState(true); // on by default when twin bars exist
  const [more, setMore] = useState(false);
  const [hit, setHit] = useState<number | null>(st === "timing" ? 2 : null);
  // In the lead state, one note moved up by hand (D♭5 → E♭5, held longer, bar 59).
  const [lead, setLead] = useState<LeadNote[][]>(() => song.bars.map((_, b) => (song.lead ?? []).filter((n) => n.bar === b).map(({ at, len, midi }, k) => (st === "lead" && b === 2 && k === 1 ? { at, len: 3, midi: 75 } : { at, len, midi }))));
  const [leadSel, setLeadSel] = useState<number | null>(st === "lead" ? 1 : null);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (open.kind === "lead") setOpen({ kind: "chord", bar: firstBar(song) }); else setKeys(false); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open, song]);

  // The chord panel is always open; the lead's × goes back to it.
  const close = () => { setOpen({ kind: "chord", bar: firstBar(song) }); setKeys(false); setHear(null); setMore(false); setHit(null); };
  const openBar = (kind: "chord" | "lead", bar: number) => {
    if (open && open.kind === kind && open.bar === bar) return kind === "lead" ? close() : undefined;
    setOpen({ kind, bar }); setKeys(false); setHear(null); setMore(false); setHit(null); setLeadSel(null);
  };
  const unsure = (i: number) => !!song.bars[i].doubt && !ch.isEdited(i);
  const leadSong = { ...song, lead: lead.flatMap((ns, bar) => ns.map((n) => ({ ...n, bar }))) };

  return (
    <Shell song={song} row={open?.kind === "lead" ? "lead" : "chords"} sticky={false}>
      <div className={v.row} data-lit={open?.kind !== "lead" ? "" : undefined}>
        <span className={v.rowName}>Chords</span>
        <div className={r.tiles} data-many={song.bars.length > 8 ? "" : undefined}>
          {song.bars.map((_, i) => (
            <button key={i} className={r.tile} data-unsure={unsure(i) ? "" : undefined} aria-expanded={open?.kind === "chord" && open.bar === i}
              aria-label={`Bar ${song.from + i}: ${ch.nameOf(i)}${unsure(i) ? ", Make isn't sure" : ""}. Change chord`} onClick={() => openBar("chord", i)}>
              <span className={r.tileName}>{ch.nameOf(i)}</span>
              {unsure(i) && <span className={r.unsureMark} title="Make isn't sure of this bar" aria-hidden>?</span>}
              <span className={r.tileFoot}><Hits hits={ch.hits[i]} /><small>{song.from + i}</small></span>
            </button>
          ))}
        </div>
      </div>
      <LeadLine song={leadSong} open={open?.kind === "lead" ? open.bar : null} onOpen={(b) => openBar("lead", b)} />
      <div className={r.band}>
        {open === null ? null : open.kind === "lead" ? (
          <LeadPanel song={song} bar={open.bar} notes={lead[open.bar]} sel={leadSel} onSel={setLeadSel}
            onNotes={(ns) => setLead((l) => l.map((x, b) => (b === open.bar ? ns : x)))}
            onReset={() => { setLead((l) => l.map((x, b) => (b === open.bar ? (song.lead ?? []).filter((n) => n.bar === b).map(({ at, len, midi }) => ({ at, len, midi })) : x))); setLeadSel(null); }} onClose={close} />
        ) : (
          <ChordPanel song={song} ch={ch} i={open.bar} keys={keys} setKeys={setKeys} hear={hear} setHear={setHear} all={all} setAll={setAll} more={more} setMore={setMore} hit={hit} setHit={setHit} />
        )}
      </div>
    </Shell>
  );
}

/** The Lead row: off (doubtful) with Play anyway (the reason in a tooltip), or the line, one target per bar. */
function LeadLine({ song, open, onOpen }: { song: Song; open: number | null; onOpen: (b: number) => void }) {
  if (song.leadOff) {
    return (
      <div className={v.row} style={{ height: 52 }}>
        <span className={v.rowName} title={`Off in Mine: ${song.leadOff}`}>Lead <span className={v.off}>off</span></span>
        <div className={v.offLine}>
          <LeadRoll song={song} off h={30} />
          <button className={s.textBtn} title={`Off in Mine: ${song.leadOff}`} aria-label={`Play the lead anyway. It's off in Mine: ${song.leadOff}`}>Play anyway</button>
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

function IconBtn({ label, onClick, children, tip }: { label: string; onClick: () => void; children: React.ReactNode; tip?: string }) {
  return <button className={r.icon} onClick={onClick} aria-label={label} title={tip ?? label}>{children}</button>;
}

function ChordPanel({ song, ch, i, keys, setKeys, hear, setHear, all, setAll, more, setMore, hit, setHit }: {
  song: Song; ch: Ch; i: number; keys: boolean; setKeys: (b: boolean) => void; hear: string | null; setHear: (n: string | null) => void;
  all: boolean; setAll: (b: boolean) => void; more: boolean; setMore: (b: boolean) => void; hit: number | null; setHit: (k: number | null) => void;
}) {
  const b = song.bars[i], cur = ch.nameOf(i), notes = ch.notesOf(i), hits = ch.hits[i];
  const twins = song.bars.map((_, k) => k).filter((k) => k !== i && song.bars[k].read === b.read);
  const fromNotes = notes.join() !== voicing(ch.names[i], ch.low).join();
  const cands = [b.read, ...versions(song, i, b.read)].slice(0, 3);
  const extra = more ? fits(song).filter((x) => !cands.includes(x.name)).map((x) => x.name) : [];
  // GarageBand chord strip: one tap hears it in the loop and puts it in Mine (in every twin bar with "All").
  const choose = (n: string) => { [i, ...(all ? twins : [])].forEach((k) => ch.pick(k, n)); setHear(n); };
  const card = (n: string) => {
    const chosen = cur === n && !fromNotes, playing = hear === n, guess = n === b.read;
    return (
      <button key={n} className={r.choice} aria-pressed={chosen} data-playing={playing ? "" : undefined} onClick={() => choose(n)}
        aria-label={`${n}${guess ? ", Make's guess" : ""}, ${flavour(n) || "a chord"}${chosen ? ", in Mine" : ""}. Hear it in the loop and use it`}>
        <span className={r.glyph} aria-hidden>{playing ? <Pause size={13} /> : <Play size={13} />}</span>
        <span className={r.choiceText}>
          {guess && <small className={r.guessTag}>Make&apos;s guess</small>}
          <span className={r.choiceName}>{n}</span>
          <small>{flavour(n)}</small>
        </span>
        {chosen && <Check className={r.check} size={15} strokeWidth={2.5} aria-hidden />}
      </button>
    );
  };
  const head = (
    <div className={r.head}>
      {keys && <IconBtn label="Back to the chords" tip="Back" onClick={() => { setKeys(false); setHit(null); }}><ArrowLeft size={16} /></IconBtn>}
      <span className={r.where}>Bar {song.from + i}</span>
      {keys ? <b className={r.title}>{cur}</b> : <b className={r.ask}>Which one sounds like the track?</b>}
      {keys && (fromNotes || ch.isEdited(i)) && <button className={r.reset} onClick={() => { ch.reset(i); setHit(null); }} aria-label={`Reset to Make's ${b.read}`} title={`Back to Make's ${b.read}`}><RotateCcw size={14} aria-hidden /> Reset</button>}
    </div>
  );
  if (keys) {
    const [plo, phi] = phoneRange(notes);
    return (
      <section className={r.panel} aria-label={`Bar ${song.from + i} on the keys`}>
        {head}
        <Keys notes={notes} onToggle={(m) => ch.toggle(i, m)} lo={48} hi={76} flats={song.flats} className={v.deskOnly} />
        <Keys notes={notes} onToggle={(m) => ch.toggle(i, m)} lo={plo} hi={phi} flats={song.flats} className={r.phoneKeys} />
        <Timing hits={hits} sel={hit} onSel={setHit} onHits={(h) => ch.setHits(i, h)} short={shortOf(song, i)} />
      </section>
    );
  }
  return (
    <section className={r.panel} aria-label={`Bar ${song.from + i}: pick the chord that sounds like the track`}>
      {head}
      <div className={r.strip4}>
        <button className={r.track} data-playing={hear === "orig" ? "" : undefined} onClick={() => setHear(hear === "orig" ? null : "orig")}
          aria-label={hear === "orig" ? `Stop the track's bar ${song.from + i}` : `Hear the track's bar ${song.from + i} as it is`} title="The track, as it is">
          {hear === "orig" ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
          <AudioWaveform size={18} aria-hidden />
          <span>Track</span>
        </button>
        <div className={r.choices} role="group" aria-label="Chords to try">{[...cands, ...extra].map(card)}</div>
      </div>
      <div className={r.tools}>
        {twins.length > 0 && <label className={r.check2} title={`Every bar Make heard as ${b.read} changes with this one`}><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> {twins.length === 1 ? `Both ${b.read} bars` : `All ${twins.length + 1} ${b.read} bars`}</label>}
        <span className={r.grow} />
        <button className={r.chip} aria-expanded={more} onClick={() => setMore(!more)} aria-label={more ? "Fewer chords" : "More chords that fit this song"}>{more ? "Fewer chords" : "More chords"}</button>
        <button className={r.chip} onClick={() => setKeys(true)} aria-label="Build the chord on a piano"><Piano size={15} aria-hidden /> Piano</button>
      </div>
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
  const orig = (song.lead ?? []).filter((x) => x.bar === bar);
  const edited = orig.length !== notes.length || orig.some((x, k) => x.at !== notes[k]?.at || x.len !== notes[k]?.len || x.midi !== notes[k]?.midi);
  return (
    <section className={cx(r.panel, r.leadPanel)} aria-label={`Lead, bar ${song.from + bar}: place one note at a time`}>
      <div className={r.head}>
        <span className={r.where}>Lead · bar {song.from + bar}</span>
        {edited && <button className={r.reset} onClick={onReset} aria-label="Reset to Make's line" title="Back to Make's line"><RotateCcw size={14} aria-hidden /> Reset</button>}
        <span className={r.grow} />
        <label className={r.quietSwitch} title="Show the notes that aren't in the song's key too"><input type="checkbox" checked={allNotes} onChange={(e) => setAllNotes(e.target.checked)} disabled={outside} /> Notes outside the key</label>
        <IconBtn label="Close" onClick={onClose}><X size={16} /></IconBtn>
      </div>
      <LeadGrid notes={notes} rows={rows} flats={song.flats} sel={sel} onSel={onSel} onNotes={onNotes} tall={!allNotes} />
      {n && (
        <div className={r.leadFoot}>
          <span className={r.moves}>
            <button onClick={() => len(-1)} disabled={n.len <= 1}>Shorter</button>
            <button onClick={() => len(1)} disabled={n.at + n.len >= 16}>Longer</button>
            <button onClick={() => { onNotes(notes.filter((_, k) => k !== sel)); onSel(null); }}>Remove</button>
          </span>
        </div>
      )}
    </section>
  );
}
