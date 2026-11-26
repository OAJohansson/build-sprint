"use client";

// Shared pieces for the chords directions (dev only). The Make room as built in Phase 5 (Fold, L224):
// app bar, track head, family switch, the rows on top, the knob block fixed under them, A/B with the
// drums under both and the open row's closeness, the save bar, the Mentor rail. Each direction only
// changes the rows (the chord grid, where the picker opens, how note editing shows). Nothing plays.
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { Knob } from "@/components/ui/knob";
import s from "@/components/lab/lab.module.css";
import { closestName, isBlack, noteName, voicing, type Song, type Step } from "./data";
import v from "./v.module.css";

export { s, v };
export type St = "main" | "key" | "worst";
export const TEAL = "#23b3a5";
export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

// ── Chord state: what each bar plays in Mine ─────────────────────────────────────────────────────

export function useChords(song: Song, init?: { names?: Record<number, string>; custom?: Record<number, number[]>; hits?: Record<number, Step[]> }) {
  const low = song.id === "lost" ? 55 : 57;
  const [names, setNames] = useState<string[]>(() => song.bars.map((b, i) => init?.names?.[i] ?? b.read));
  const [custom, setCustom] = useState<(number[] | null)[]>(() => song.bars.map((_, i) => init?.custom?.[i] ?? null));
  const [hits, setHits] = useState<Step[][]>(() => song.bars.map((b, i) => init?.hits?.[i] ?? b.hits));
  const notesOf = (i: number) => custom[i] ?? voicing(names[i], low);
  const nameOf = (i: number) => (custom[i] ? closestName(custom[i]!, song.flats).name : names[i]);
  return {
    low, names, hits,
    notesOf, nameOf,
    isCustom: (i: number) => !!custom[i] && !closestName(custom[i]!, song.flats).exact,
    isEdited: (i: number) => names[i] !== song.bars[i].read || !!custom[i] || hits[i] !== song.bars[i].hits,
    pick: (i: number, name: string) => { setNames((x) => x.map((n, j) => (j === i ? name : n))); setCustom((x) => x.map((c, j) => (j === i ? null : c))); },
    toggle: (i: number, midi: number) => setCustom((x) => x.map((c, j) => {
      if (j !== i) return c;
      const cur = c ?? voicing(names[i], low);
      return cur.includes(midi) ? cur.filter((m) => m !== midi) : [...cur, midi].sort((a, b) => a - b);
    })),
    setHits: (i: number, h: Step[]) => setHits((x) => x.map((y, j) => (j === i ? h : y))),
    reset: (i: number) => { setNames((x) => x.map((n, j) => (j === i ? song.bars[i].read : n))); setCustom((x) => x.map((c, j) => (j === i ? null : c))); setHits((x) => x.map((y, j) => (j === i ? song.bars[i].hits : y))); },
  };
}
export type Chords = ReturnType<typeof useChords>;

// ── The room ─────────────────────────────────────────────────────────────────────────────────────

export function Shell({ song, children, block, rail, row = "chords", closeness }: {
  song: Song; children: ReactNode; block?: ReactNode; rail?: ReactNode; row?: "chords" | "lead"; closeness?: number;
}) {
  const score = closeness ?? (row === "lead" ? song.leadCloseness : song.closeness);
  return (
    <div className={cx(s.root, v.root)}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}><SettingsLink /></div>
      </header>
      <div className={cx(s.head, v.head)}>
        <a className={cx(s.back, v.deskOnly)} href="#">← All tracks</a>
        <div className={s.title}>
          <h1 title={song.title}>{song.title}</h1>
          <p>{song.artist} · {song.bpm} · {song.key}</p>
        </div>
        <div className={cx(s.actions, v.actions)}>
          <div className={cx(s.transport, v.transport)}>
            <button className={s.play} aria-label="Pause">❚❚</button>
            <span className={cx(s.clock, v.deskOnly)}>2:17 · in {song.section} <small>bar {song.from + 1}</small></span>
            <span className={s.loopChip}><span className={s.loopChipText}>Looping bars {song.from}–{song.from + song.bars.length - 1}</span><button className={s.x} aria-label="Stop looping">×</button></span>
          </div>
          <div className={cx(s.switch, v.deskOnly)} role="group" aria-label="Mode">
            <button aria-pressed="false">Listen</button>
            <button aria-pressed="true">Make</button>
          </div>
          <span className={cx(s.deck, v.deskOnly)}><i className={s.dot} aria-hidden /><span className={s.muted}>Deck on</span></span>
        </div>
      </div>
      <div className={v.room}>
        <section className={v.synth} aria-label="Make the melody">
          <div className={cx(s.fam, v.fam)} role="tablist" aria-label="What to make">
            {[["Bass", "#ef5b37"], ["Drums", "#f2b134"], ["Melody", TEAL], ["FX", "#cdbfa8"]].map(([n, c]) => (
              <button key={n} role="tab" aria-selected={n === "Melody"} className={s.famTab}><i style={{ background: c }} aria-hidden />{n}</button>
            ))}
            <span className={cx(s.famTab, v.deskOnly)} data-off="" aria-disabled="true">Vocals<em>not yet</em></span>
            <span className={cx(s.famCap, v.deskOnly)}>Melody alone, {song.section}, {song.clock}, looping</span>
          </div>
          <div className={v.middle}>{children}</div>
          <div className={s.grow} />
          {block ?? <KnobBlock song={song} row={row} />}
          <div className={cx(s.checkRow, s.drCheck, v.check)}>
            <div className={s.abWrap}>
              <div className={s.ab} role="group" aria-label="Compare at the same loudness">
                <button aria-pressed="false">A · Original melody</button>
                <button aria-pressed="true">B · Mine</button>
              </div>
              <span className={cx(s.faint, v.deskOnly)}>same loudness</span>
            </div>
            <button className={s.ghost} aria-pressed="true">Drums under both: on</button>
            <span className={s.drScore}>closeness · {row} <b>{score || "–"}</b> / 100</span>
          </div>
        </section>
        <div className={cx(s.saveBar, v.save)}>
          <label className={cx(s.saveLabel, v.deskOnly)} htmlFor="save-name">Name</label>
          <input id="save-name" name="sound-name" autoComplete="off" spellCheck={false} className={s.input} defaultValue={row === "lead" ? `Fatima hook, from What's a Girl to Do` : song.save} />
          <span className={cx(s.facts, v.deskOnly)}>{row === "lead" ? song.tags.replace(/^chords · \w+/, `lead · ${song.leadPreset.toLowerCase()}`) : song.tags}</span>
          <button className={s.gold}>{row === "lead" ? "Save lead" : "Save chords"}</button>
        </div>
        <aside className={v.rail} aria-label="Mentor">{rail ?? <MentorThread song={song} />}</aside>
      </div>
    </div>
  );
}

export function KnobBlock({ song, row = "chords", line }: { song: Song; row?: "chords" | "lead"; line?: ReactNode }) {
  const [k, setK] = useState({ tone: 0.62, length: 0.18, attack: 0.08, detune: 0.3, width: 0.55, space: 0.6 });
  const sug: Record<string, number> = { tone: 0.7, length: 0.1, space: 0.72 };
  const words: Record<string, (x: number) => string> = {
    tone: (x) => (x > 0.6 ? "warm" : "dark"), length: (x) => (x < 0.15 ? "1/32" : x < 0.3 ? "1/16" : "1/8"), attack: (x) => (x < 0.2 ? "hard" : "soft"),
    detune: (x) => (x < 0.4 ? "a little" : "thick"), width: (x) => (x > 0.5 ? "wide" : "narrow"), space: (x) => (x > 0.5 ? "room" : "dry"),
  };
  return (
    <div className={cx(s.drBlock, v.block)}>
      <span className={s.drLabel}>{row === "lead" ? "Lead" : "Chords"}</span>
      <button className={s.drPresetName} aria-haspopup="menu" aria-label={`Preset: ${row === "lead" ? song.leadPreset : song.preset}. Change preset`}>
        {row === "lead" ? song.leadPreset : song.preset} <span aria-hidden>▾</span>
      </button>
      <div className={cx(s.drKnobs, v.knobs)}>
        {(["tone", "length", "attack", "detune", "width", "space"] as const).map((id) => (
          <Knob key={id} id={id as never} spec={{ name: id[0].toUpperCase() + id.slice(1), explain: "" }} wordOf={words[id]} value={k[id]} sug={sug[id]}
            color={TEAL} disabled={false} onChange={(x) => setK((o) => ({ ...o, [id]: x }))} reset={0.5} size={60} />
        ))}
      </div>
      <div className={s.drSuggest}>
        <p className={s.suggest}>{line ?? <>Mentor: Length down to 1/32, Space up. The original {row === "lead" ? "lead is a touch shorter" : song.id === "lost" ? "stabs are short and roomy" : "plucks are short and roomy"}.</>}</p>
        <button className={s.ghost}>Suggest for {row}</button>
      </div>
    </div>
  );
}

function MentorThread({ song }: { song: Song }) {
  return (
    <>
      <span className={s.ctx}>Mentor, on the melody</span>
      <div className={v.thread}>
        <div className={s.turn}>
          <div className={s.mine}>
            <p className={s.bubble}>What are these chords?</p>
            <span className={s.barTag}>bar {song.from}</span>
          </div>
          <p className={s.answer}>{song.mentor ? song.mentor.answer : song.id === "lost"
            ? "One chord the whole loop: G, struck just before each beat. Make reads plain G; the original may be G7 (an F on top). Tap a bar and try G7 to hear the difference."
            : "Three chords: D♭, E♭, then B♭ minor held for two bars. In A♭ major that's IV, V, ii: it climbs and then settles in the minor. Two bars Make wasn't sure of are marked."}</p>
          <p className={s.facts}>{song.mentor ? song.mentor.facts : song.id === "lost" ? "G · 4 stabs a bar · just before the beat" : "D♭ · E♭ · B♭m · plucks · 8 bars"}</p>
        </div>
      </div>
      <div className={s.askBar}>
        <div className={s.composer}>
          <textarea className={s.ask} name="mentor-question" autoComplete="off" rows={1} placeholder="Ask about the melody…" aria-label="Ask the Mentor" />
          <button className={s.send} aria-label="Ask" disabled>↑</button>
        </div>
      </div>
    </>
  );
}

// ── Small pieces the directions share ───────────────────────────────────────────────────────────

/** A bar's chord times: stabs as short marks, a held chord as one long bar. */
export function Hits({ hits, color = TEAL, faint, h = 10 }: { hits: Step[]; color?: string; faint?: boolean; h?: number }) {
  return (
    <svg className={v.hits} viewBox={`0 0 160 ${h}`} preserveAspectRatio="none" aria-hidden style={{ height: h }}>
      {[4, 8, 12].map((b) => <line key={b} x1={b * 10} x2={b * 10} y1={0} y2={h} stroke="rgba(241,230,211,.12)" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
      {hits.map((x) => <rect key={x.at} x={x.at * 10 + 0.5} y={0} width={Math.max(4, x.len * 10 - 1.5)} height={h} rx={1} fill={color} opacity={faint ? 0.45 : 0.9} />)}
    </svg>
  );
}

/** The lead as a small roll across the bars (one bar per column, like the chord cells). */
export function LeadRoll({ song, off, h = 44, lit, editBar }: { song: Song; off?: boolean; h?: number; lit?: boolean; editBar?: number | null }) {
  const lead = song.lead ?? [];
  const lo = Math.min(...lead.map((n) => n.midi)) - 1, hi = Math.max(...lead.map((n) => n.midi)) + 1, span = hi - lo;
  const W = 800, bw = W / 8;
  return (
    <svg className={v.leadRoll} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" aria-hidden style={{ height: h }}>
      {Array.from({ length: 8 }, (_, b) => <rect key={b} x={b * bw + 2} y={0} width={bw - 4} height={h} fill={editBar === b ? "rgba(241,230,211,.09)" : "rgba(241,230,211,.035)"} />)}
      {lead.map((n, i) => {
        const x = n.bar * bw + 2 + (n.at / 16) * (bw - 4), w = Math.max(4, (n.len / 16) * (bw - 4) - 1), y = h - ((n.midi - lo) / span) * h - 3;
        return off
          ? <rect key={i} x={x} y={y} width={w} height={4} fill="none" stroke={TEAL} strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity={0.7} />
          : <rect key={i} x={x} y={y} width={w} height={4} rx={1} fill={TEAL} opacity={lit ? 0.95 : 0.55} />;
      })}
    </svg>
  );
}

/**
 * The small piano grid (K5, K6): one row per note, keys on the left; the chord's notes light across
 * its hits; tap a key or a row to switch that note on or off. A time strip of 16ths under it moves
 * the hits (tap a 16th to add or remove a hit there).
 */
export function NoteGrid({ ch, i, flats, lo, hi, time = true, rowH = 9, wide }: { ch: Chords; i: number; flats: boolean; lo: number; hi: number; time?: boolean; rowH?: number; wide?: boolean }) {
  const notes = ch.notesOf(i), hits = ch.hits[i];
  const rows = Array.from({ length: hi - lo + 1 }, (_, k) => hi - k);
  const on = (st: number) => hits.some((x) => st >= x.at && st < x.at + x.len);
  const toggleHit = (st: number) => {
    const has = hits.find((x) => x.at === st);
    ch.setHits(i, has ? hits.filter((x) => x !== has) : [...hits, { at: st, len: 1 }].sort((a, b) => a.at - b.at));
  };
  return (
    <div className={cx(v.grid, wide && v.gridWide)} role="group" aria-label={`Notes of bar ${i + 1}`}>
      <div className={v.gridRows} style={{ ["--rh" as string]: `${rowH}px` }}>
        {rows.map((m) => {
          const lit = notes.includes(m);
          return (
            <div key={m} className={v.gridRow} data-black={isBlack(m) ? "" : undefined} data-c={m % 12 === 0 ? "" : undefined}>
              <button className={v.key} data-on={lit ? "" : undefined} onClick={() => ch.toggle(i, m)} aria-pressed={lit} aria-label={`${noteName(m, flats)} ${lit ? "on" : "off"}`}>
                {(m % 12 === 0 || lit) && <span>{noteName(m, flats)}</span>}
              </button>
              <div className={v.cells} onClick={() => ch.toggle(i, m)} aria-hidden>
                {Array.from({ length: 16 }, (_, st) => <i key={st} data-beat={st % 4 === 0 ? "" : undefined} data-on={lit && on(st) ? "" : undefined} />)}
              </div>
            </div>
          );
        })}
      </div>
      {time && (
        <div className={v.timeRow}>
          <span className={v.timeLabel}>times</span>
          <div className={v.timeCells}>
            {Array.from({ length: 16 }, (_, st) => (
              <button key={st} data-on={hits.some((x) => x.at === st) ? "" : undefined} data-beat={st % 4 === 0 ? "" : undefined} onClick={() => toggleHit(st)} aria-label={`16th ${st + 1}`} aria-pressed={hits.some((x) => x.at === st)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Next guesses and the key's other chords (K4). Tapping one plays it in the loop and puts it in Mine. */
export function PickList({ song, ch, i, onDone, cols = 4, hint = true }: { song: Song; ch: Chords; i: number; onDone?: () => void; cols?: number; hint?: boolean }) {
  const bar = song.bars[i], cur = ch.nameOf(i);
  const guesses = [bar.read, ...bar.alts.map((a) => a.name)];
  const others = song.keyChords.filter((c) => !guesses.includes(c));
  const item = (n: string, tag?: string) => (
    <button key={n} className={v.pick} aria-pressed={cur === n} onClick={() => { ch.pick(i, n); onDone?.(); }}>
      <span className={v.pickName}>{n}</span>{tag && <small>{tag}</small>}
    </button>
  );
  return (
    <div className={v.pickList}>
      <span className={v.pickHead}>Make&apos;s guesses</span>
      <div className={v.picks} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {guesses.map((n, k) => item(n, k === 0 ? "first read" : undefined))}
      </div>
      <span className={v.pickHead}>Other chords in {song.keyShort}</span>
      <div className={v.picks} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{others.map((n) => item(n))}</div>
      {hint && <p className={v.pickHint}>Tap one: it plays in the loop at once.</p>}
    </div>
  );
}


/** A chord name in the serif: the ♭ and ♯ set small in the mono (the serif has no accidentals). */
export function Name({ n }: { n: string }) {
  return <>{n.split(/([♭♯])/).map((p, i) => (p === "♭" || p === "♯" ? <span key={i} className={v.acc}>{p}</span> : p))}</>;
}
