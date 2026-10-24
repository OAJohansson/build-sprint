"use client";
// Directions 1–5 of the arrangement map.
import { Fragment, useState } from "react";
import { LAYERS, LEVEL_WORD, SECTIONS, TRACK, barTime, events, heardData, levelAt, type Layer, type Level, type Section } from "./data";
import { AppBar, EST_NOTE, ExplainBtn, Facts, Listening, MentorAnswer, StartBtn, pct, useMentor, wpct, type VariantProps } from "./shell";
import m from "./map.module.css";

export function TrackHead({ heard, mentor }: { heard: number; mentor: ReturnType<typeof useMentor> }) {
  return (
    <div className={m.head}>
      <a className={m.back} href="/analyse">← Analyse</a>
      <div className={m.title}><b>{TRACK.title}</b><em>{TRACK.uploader}</em></div>
      <Facts heard={heard} />
      <div className={m.actions}><ExplainBtn mentor={mentor} disabled={heard < TRACK.bars} /><StartBtn heard={heard} /></div>
    </div>
  );
}

export const lvlClass = (l: Level) => (l === 3 ? m.l3 : l === 2 ? m.l2 : m.l1);

export function Legend() {
  return (
    <span className={m.legend}>
      <span><i className={`${m.sw} ${m.l3}`} />clearly</span>
      <span><i className={`${m.sw} ${m.l2}`} />likely</span>
      <span><i className={`${m.sw} ${m.l1}`} />maybe</span>
      <span className={m.dim}>{EST_NOTE}</span>
    </span>
  );
}

/** Share of a section's bars where the layer plays, and the first/last bar it plays. */
export function cover(l: Layer, sec: Section) {
  let n = 0, first = 0, last = 0, max: 0 | Level = 0;
  for (let b = sec.from; b < sec.to; b++) {
    const v = levelAt(l, b);
    if (v) { n++; if (!first) first = b; last = b; if (v > max) max = v; }
  }
  return { share: n / (sec.to - sec.from), first, last, max };
}

/* 1 · Studio mirror */
export function V1({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  const ticks = Array.from({ length: TRACK.bars / 4 }, (_, i) => 1 + i * 4);
  return (
    <div className={m.root}>
      <AppBar />
      <TrackHead heard={heard} mentor={mentor} />
      <Listening heard={heard} />
      {mentor.open && <MentorAnswer />}
      <div className={m.v1}>
        <div className={m.v1corner}>Sections</div>
        <div className={m.v1ruler}>
          {sections.map((x, i) => (
            <span key={i} className={m.v1sec} style={{ left: pct(x.from), width: wpct(x.from, x.to) }}>{x.name}</span>
          ))}
          {ticks.map((b) => (
            <i key={b} className={(b - 1) % 16 === 0 ? `${m.tick} ${m.tickBig}` : m.tick} style={{ left: pct(b) }}>
              {(b - 1) % 32 === 0 && <span className={m.tickNum}>{b}</span>}
            </i>
          ))}
        </div>
        {layers.map((l) => (
          <Fragment key={l.id}>
            <div className={m.v1head} style={{ "--c": l.color } as React.CSSProperties}><b>{l.name}</b><em>estimate</em></div>
            <div className={m.v1lane}>
              {sections.slice(1).map((x, i) => <i key={i} className={m.v1line} style={{ left: pct(x.from) }} />)}
              {l.spans.map((sp, i) => (
                <span key={i} className={`${m.v1block} ${lvlClass(sp.level)}`} style={{ left: pct(sp.from), width: wpct(sp.from, sp.to), "--c": l.color } as React.CSSProperties} title={`${l.name}: bars ${sp.from}–${sp.to - 1}, ${LEVEL_WORD[sp.level]} (estimate)`} />
              ))}
              {heard < TRACK.bars && <span className={m.unheard} style={{ left: pct(heard + 1) }} />}
            </div>
          </Fragment>
        ))}
      </div>
      <div className={m.foot}><Legend /></div>
    </div>
  );
}

/* 2 · Ledger: a section strip with the changes listed under each section */
export function V2({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  const ev = events(layers).filter(([b]) => b <= heard);
  const cols = sections.map((x) => `${x.to - x.from}fr`).join(" ");
  return (
    <div className={m.root}>
      <AppBar />
      <TrackHead heard={heard} mentor={mentor} />
      <Listening heard={heard} />
      {mentor.open && <MentorAnswer />}
      <div className={m.v2}>
        <div className={m.v2strip} style={{ gridTemplateColumns: cols }}>
          {sections.map((x, i) => (
            <div key={i} className={m.v2sec}>
              <b>{x.name}</b>
              <span className={m.v2num}>{x.from}</span>
              <em>{x.to - x.from} bars · {barTime(x.from)}</em>
            </div>
          ))}
        </div>
        <div className={m.v2log} style={{ gridTemplateColumns: cols }}>
          {sections.map((x, i) => (
            <ul key={i}>
              {ev.filter(([b]) => b >= x.from && b < x.to).map(([b, e]) => (
                <li key={b}>
                  <span className={m.dim}>{b}</span>
                  {e.in.length > 0 && <span>+ {e.in.join(", ")}</span>}
                  {e.out.length > 0 && <span className={m.muted}>− {e.out.join(", ")}</span>}
                </li>
              ))}
            </ul>
          ))}
        </div>
        <p className={m.v2note}>Bar numbers on the left of each change. + comes in, − goes out. {EST_NOTE}</p>
      </div>
    </div>
  );
}

/* 3 · Liner notes: the back of the sleeve */
export function V3({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  return (
    <div className={m.root}>
      <AppBar />
      <div className={m.v3}>
        <aside className={m.v3side}>
          <a className={m.back} href="/analyse">← Analyse</a>
          <h1 className={m.v3title}>{TRACK.title}</h1>
          <p className={m.muted}>{TRACK.uploader}</p>
          <dl className={m.v3facts}>
            <dt>Tempo</dt><dd>{TRACK.bpm} BPM</dd>
            <dt>Key</dt><dd>{TRACK.key}</dd>
            <dt>Length</dt><dd>7:44 · {TRACK.bars} bars</dd>
          </dl>
          <Listening heard={heard} />
          <div className={m.v3act}><StartBtn heard={heard} /><ExplainBtn mentor={mentor} disabled={heard < TRACK.bars} /></div>
          {mentor.open && <MentorAnswer compact />}
        </aside>
        <section className={m.v3list}>
          <div className={m.v3row + " " + m.v3hdr}>
            <span /><span>Section</span><span>Bars</span><span>Starts</span>
            {LAYERS.map((l) => <span key={l.id} className={m.v3lh} style={{ color: l.color }}>{l.name}</span>)}
          </div>
          {sections.map((x, i) => (
            <div key={i} className={m.v3row}>
              <span className={m.dim}>{String(i + 1).padStart(2, "0")}</span>
              <span className={m.v3name}>{x.name}</span>
              <span>{x.from}–{x.to - 1}</span>
              <span className={m.muted}>{barTime(x.from)}</span>
              {layers.map((l) => {
                const c = cover(l, x);
                return <span key={l.id} className={m.v3dot}><i className={c.share === 0 ? m.dotOff : c.share < 0.75 ? m.dotHalf : m.dotOn} style={{ "--c": l.color } as React.CSSProperties} title={`${l.name} (estimate)`} /></span>;
              })}
            </div>
          ))}
          <p className={m.v3note}>● plays most of the section · ◐ part of it · ○ not heard. {EST_NOTE}</p>
        </section>
      </div>
    </div>
  );
}

/* 4 · Phrase grid: one cell per 4-bar phrase */
export function V4({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  const [hover, setHover] = useState<string | null>(null);
  const phrases = TRACK.bars / 4;
  return (
    <div className={m.root}>
      <AppBar />
      <TrackHead heard={heard} mentor={mentor} />
      <Listening heard={heard} />
      {mentor.open && <MentorAnswer />}
      <div className={m.v4} style={{ "--n": phrases } as React.CSSProperties} onMouseLeave={() => setHover(null)}>
        <span className={m.v4lab} />
        <div className={m.v4cells}>
          {sections.map((x, i) => (
            <span key={i} className={m.v4sec} style={{ gridColumn: `${(x.from - 1) / 4 + 1} / span ${Math.ceil((x.to - x.from) / 4)}` }}>{x.name}</span>
          ))}
        </div>
        <span className={m.v4lab} />
        <div className={m.v4cells}>
          {Array.from({ length: phrases }, (_, i) => <span key={i} className={m.v4bar}>{i % 4 === 0 ? i * 4 + 1 : ""}</span>)}
        </div>
        {layers.map((l) => (
          <Fragment key={l.id}>
            <span className={m.v4lab}>{l.name} <em>est.</em></span>
            <div className={m.v4cells}>
              {Array.from({ length: phrases }, (_, i) => {
                const b = i * 4 + 1;
                const v = b <= heard ? levelAt(l, b) : 0;
                return (
                  <span key={i} className={`${m.v4cell} ${v ? lvlClass(v) : ""} ${b > heard ? m.v4unheard : ""}`} style={{ "--c": l.color } as React.CSSProperties}
                    onMouseEnter={() => setHover(`Bars ${b}–${b + 3} · ${l.name.toLowerCase()} ${v ? LEVEL_WORD[v] : "not heard"} (estimate)`)} />
                );
              })}
            </div>
          </Fragment>
        ))}
      </div>
      <div className={m.foot}><span className={m.readout}>{hover ?? "Point at a cell to read it. One cell is 4 bars."}</span><Legend /></div>
    </div>
  );
}

/* 5 · Timetable, opened inside the Analyse list */
const ROWS = [
  { t: "Redemption (Extended Mix)", u: "Hard Reset", bpm: "126", key: "F minor", style: "Progressive House 61%" },
  { t: "Realize", u: "Jaime Soeiro", bpm: "125", key: "G minor", style: "Tech House 54%" },
  { t: TRACK.title, u: TRACK.uploader, bpm: "124", key: "A minor", style: "Deep House 48%", open: true },
  { t: "Music Is The Answer (Edit)", u: "Retrouve", bpm: "122", key: "D minor", style: "House 66%" },
  { t: "Work (Edit)", u: "Pupa Nas T x FOVOS", bpm: "140", key: "E minor", style: "Trance 57%" },
];

function cellWord(l: Layer, x: Section) {
  const c = cover(l, x);
  if (!c.share) return "—";
  if (c.share === 1) return LEVEL_WORD[c.max as Level];
  if (c.first > x.from) return `from ${c.first}`;
  return `until ${c.last}`;
}

export function V5({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  return (
    <div className={m.root}>
      <AppBar />
      <div className={m.v5}>
        <div className={`${m.v5row} ${m.v5hdr}`}><span>Track</span><span>BPM</span><span>Key</span><span>Style</span><span /></div>
        {ROWS.map((r) => (
          <Fragment key={r.t}>
            <div className={`${m.v5row} ${r.open ? m.v5on : ""}`}>
              <span><b>{r.t}</b> <em className={m.muted}>{r.u}</em></span>
              <span className={m.gold}>{r.bpm}</span><span>{r.key}</span><span className={m.muted}>{r.style}</span>
              <span className={m.v5act}>{r.open ? "Hide map" : "Map"}</span>
            </div>
            {r.open && (
              <div className={m.v5map}>
                <div className={m.v5top}>
                  <span className={m.v5label}>Arrangement · 7:44 · {TRACK.bars} bars</span>
                  <Listening heard={heard} />
                  <div className={m.actions}><ExplainBtn mentor={mentor} disabled={heard < TRACK.bars} /><StartBtn heard={heard} /></div>
                </div>
                {mentor.open && <MentorAnswer compact />}
                <table className={m.v5tab}>
                  <thead>
                    <tr><th />{SECTIONS.map((x, i) => <th key={i} className={x.from > heard ? m.dim : ""}>{x.name}<em>{x.from}–{x.to - 1}</em></th>)}</tr>
                  </thead>
                  <tbody>
                    {layers.map((l) => (
                      <tr key={l.id}>
                        <th><i className={m.chip} style={{ background: l.color }} />{l.name} <em>est.</em></th>
                        {SECTIONS.map((x, i) => {
                          const sx = sections[i];
                          const w = sx ? cellWord(l, sx) : "";
                          return <td key={i} className={w === "—" ? m.dim : w === "maybe" ? m.muted : ""}>{w}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={m.v5note}>Bar numbers say where a layer comes in or drops out inside a section. {EST_NOTE}</p>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
