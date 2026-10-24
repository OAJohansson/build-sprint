"use client";
// Directions 6–10 of the arrangement map.
import { Fragment, useState } from "react";
import { LEVEL_WORD, SECTIONS, TRACK, barTime, heardData, levelAt, type Level } from "./data";
import { AppBar, EST_NOTE, ExplainBtn, Facts, Listening, MentorAnswer, StartBtn, pct, useMentor, wpct, type VariantProps } from "./shell";
import { Legend, TrackHead, cover, lvlClass } from "./variants-a";
import m from "./map.module.css";

/* 6 · Skyline: the layers stacked into one silhouette */
export function V6({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  const W = 1392, H = 380, unit = 22, base = H - 28;
  const x = (bar: number) => ((bar - 1) / TRACK.bars) * W;
  const below = new Array(TRACK.bars + 2).fill(0);
  const paths = layers.map((l) => {
    const top: number[] = [];
    for (let b = 1; b <= TRACK.bars; b++) top[b] = below[b] + (b <= heard ? levelAt(l, b) : 0) * unit;
    let d = "";
    for (let b = 1; b <= TRACK.bars; b++) d += `${b === 1 ? "M" : "L"}${x(b)},${base - top[b]} L${x(b + 1)},${base - top[b]} `;
    for (let b = TRACK.bars; b >= 1; b--) d += `L${x(b + 1)},${base - below[b]} L${x(b)},${base - below[b]} `;
    for (let b = 1; b <= TRACK.bars; b++) below[b] = top[b];
    return { l, d: d + "Z" };
  });
  return (
    <div className={m.root}>
      <AppBar />
      <TrackHead heard={heard} mentor={mentor} />
      <Listening heard={heard} />
      {mentor.open && <MentorAnswer />}
      <div className={m.v6}>
        <svg viewBox={`0 0 ${W} ${H}`} className={m.v6svg} role="img" aria-label="Estimated layers stacked over the bars">
          {sections.map((s, i) => (
            <g key={i}>
              {i > 0 && <line x1={x(s.from)} x2={x(s.from)} y1={14} y2={base} className={m.v6rule} />}
              <text x={x(s.from) + 8} y={30} className={m.v6sec}>{s.name}</text>
              <text x={x(s.from) + 8} y={base + 20} className={m.v6bar}>{s.from}</text>
            </g>
          ))}
          {paths.map(({ l, d }) => <path key={l.id} d={d} fill={l.color} fillOpacity={0.55} />)}
          <line x1={0} x2={W} y1={base} y2={base} className={m.v6rule} />
        </svg>
        <div className={m.v6key}>
          {layers.slice().reverse().map((l) => <span key={l.id}><i className={m.chip} style={{ background: l.color }} />{l.name}</span>)}
          <span className={m.dim}>Height = how many layers seem to play. {EST_NOTE}</span>
        </div>
      </div>
    </div>
  );
}

/* 7 · One section at a time, like a wall label */
const NOTES = [
  "Kick and hats alone, so a DJ can mix in. The bass joins at bar 17.",
  "The chords arrive at bar 33 and a vocal hint at 49: one new layer every 16 bars.",
  "Everything plays: kick, bass, chords, hats and vocal chops.",
  "Kick and bass leave. Chords and the vocal carry it; the hats creep back at 113.",
  "Sixteen bars. The kick returns at 137 to push into the drop.",
  "The longest part, 64 bars. The vocal thins out after bar 177.",
  "Chords leave at 209, bass at 225: the intro in reverse, for the next DJ.",
];

export function V7({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  const [sel, setSel] = useState(Math.min(3, sections.length - 1));
  const s = sections[sel];
  return (
    <div className={m.root}>
      <AppBar />
      <TrackHead heard={heard} mentor={mentor} />
      <Listening heard={heard} />
      {mentor.open && <MentorAnswer />}
      <div className={m.v7}>
        <div className={m.v7mini}>
          {sections.map((x, i) => (
            <button key={i} className={m.v7seg} style={{ width: wpct(x.from, x.to) }} aria-pressed={i === sel} onClick={() => setSel(i)}>
              <span>{x.name}</span>
            </button>
          ))}
        </div>
        <div className={m.v7lines}>
          {layers.map((l) => (
            <div key={l.id} className={m.v7line}>
              {l.spans.map((sp, i) => <i key={i} style={{ left: pct(sp.from), width: wpct(sp.from, sp.to), background: l.color, opacity: sp.level === 3 ? 0.9 : sp.level === 2 ? 0.55 : 0.25 }} />)}
            </div>
          ))}
          <span className={m.v7frame} style={{ left: pct(s.from), width: wpct(s.from, s.to) }} />
        </div>
        <div className={m.v7body}>
          <div>
            <p className={m.v7idx}>{sel + 1} of {SECTIONS.length}</p>
            <h2 className={m.v7name}>{s.name}</h2>
            <p className={m.v7meta}>Bars {s.from}–{s.to - 1} · {barTime(s.from)}–{barTime(s.to)} · {s.to - s.from} bars</p>
            <p className={m.v7note}>{NOTES[sel]}</p>
            <div className={m.v7nav}>
              <button className={m.btn} disabled={sel === 0} onClick={() => setSel(sel - 1)}>← {sel > 0 ? sections[sel - 1].name : "Start"}</button>
              <button className={m.btn} disabled={sel === sections.length - 1} onClick={() => setSel(sel + 1)}>{sel < sections.length - 1 ? sections[sel + 1].name : "End"} →</button>
            </div>
          </div>
          <dl className={m.v7layers}>
            <dt className={m.v7lh}>What plays here <em>estimates</em></dt>
            {layers.map((l) => {
              const c = cover(l, s);
              const word = !c.share ? "not heard" : c.share === 1 ? LEVEL_WORD[c.max as Level] : c.first > s.from ? `from bar ${c.first}` : `until bar ${c.last}`;
              return (
                <Fragment key={l.id}>
                  <dt><i className={m.chip} style={{ background: c.share ? l.color : "transparent", borderColor: l.color }} />{l.name}</dt>
                  <dd className={c.share ? "" : m.dim}>{word}</dd>
                </Fragment>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}

/* 8 · Vertical: the track runs down the page, like a DJ's vertical waveform */
export function V8({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  const px = 2.9;
  return (
    <div className={m.root}>
      <AppBar />
      <div className={m.v8}>
        <div className={m.v8track}>
          <div className={m.v8cols}>
            <span />
            {layers.map((l) => <span key={l.id} className={m.v8lh}>{l.name}<em>est.</em></span>)}
          </div>
          <div className={m.v8body} style={{ height: TRACK.bars * px }}>
            {sections.map((s, i) => (
              <div key={i} className={m.v8sec} style={{ top: (s.from - 1) * px, height: (s.to - s.from) * px }}>
                <b>{s.name}</b><em>{s.from}</em>
              </div>
            ))}
            <div className={m.v8lanes}>
              {layers.map((l) => (
                <div key={l.id} className={m.v8lane}>
                  {l.spans.map((sp, i) => <i key={i} className={lvlClass(sp.level)} style={{ top: (sp.from - 1) * px, height: (sp.to - sp.from) * px, "--c": l.color } as React.CSSProperties} />)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className={m.v8side}>
          <a className={m.back} href="/analyse">← Analyse</a>
          <div className={m.title}><b>{TRACK.title}</b><em>{TRACK.uploader}</em></div>
          <Facts heard={heard} />
          <Listening heard={heard} />
          <StartBtn heard={heard} />
          <ExplainBtn mentor={mentor} disabled={heard < TRACK.bars} />
          {mentor.open && <MentorAnswer compact />}
          <Legend />
        </aside>
      </div>
    </div>
  );
}

/* 9 · Score: staves and rehearsal marks */
export function V9({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  return (
    <div className={m.root}>
      <AppBar />
      <TrackHead heard={heard} mentor={mentor} />
      <Listening heard={heard} />
      {mentor.open && <MentorAnswer />}
      <div className={m.v9}>
        <div className={m.v9marks}>
          {sections.map((s, i) => (
            <span key={i} className={m.v9mark} style={{ left: pct(s.from) }}>
              <b>{String.fromCharCode(65 + i)}</b><span>{s.name}</span><em>{s.from}</em>
            </span>
          ))}
        </div>
        {layers.map((l) => (
          <div key={l.id} className={m.v9staff}>
            <span className={m.v9name}><i className={m.chip} style={{ background: l.color }} />{l.name}</span>
            <div className={m.v9line}>
              {sections.slice(1).map((s, i) => <i key={i} className={m.v9barline} style={{ left: pct(s.from) }} />)}
              {l.spans.map((sp, i) => <span key={i} className={m[`v9s${sp.level}`]} style={{ left: pct(sp.from), width: wpct(sp.from, sp.to) }} />)}
            </div>
          </div>
        ))}
        <p className={m.v9key}>Thick line: clearly plays · thin: likely · dotted: maybe. {EST_NOTE}</p>
      </div>
    </div>
  );
}

/* 10 · Record: the track as a disc, read clockwise from twelve o'clock */
function arc(r: number, from: number, to: number) {
  const a = (bar: number) => ((bar - 1) / TRACK.bars) * Math.PI * 2 - Math.PI / 2;
  const a0 = a(from), a1 = a(to) - 0.004;
  const p = (t: number) => `${(320 + r * Math.cos(t)).toFixed(2)},${(320 + r * Math.sin(t)).toFixed(2)}`;
  return `M${p(a0)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`;
}

export function V10({ heard }: VariantProps) {
  const mentor = useMentor();
  const { sections, layers } = heardData(heard);
  return (
    <div className={m.root}>
      <AppBar />
      <div className={m.v10}>
        <svg viewBox="0 0 640 640" className={m.v10svg} role="img" aria-label="Sections and estimated layers around the track">
          <circle cx={320} cy={320} r={300} className={m.v10disc} />
          {sections.map((s, i) => <path key={i} d={arc(286, s.from, s.to)} className={m.v10sec} />)}
          {layers.map((l, j) => l.spans.map((sp, i) => (
            <path key={l.id + i} d={arc(250 - j * 30, sp.from, sp.to)} stroke={l.color} strokeOpacity={sp.level === 3 ? 0.9 : sp.level === 2 ? 0.5 : 0.22} strokeWidth={18} fill="none" />
          )))}
          {layers.map((l, j) => <text key={l.id} x={326} y={320 - (250 - j * 30) + 4} className={m.v10lab}>{l.name}</text>)}
          <text x={320} y={318} textAnchor="middle" className={m.v10title}>{TRACK.title}</text>
          <text x={320} y={342} textAnchor="middle" className={m.v10sub}>{TRACK.bpm} BPM · {TRACK.key}</text>
        </svg>
        <aside className={m.v10side}>
          <a className={m.back} href="/analyse">← Analyse</a>
          <div className={m.title}><b>{TRACK.title}</b><em>{TRACK.uploader}</em></div>
          <Facts heard={heard} />
          <Listening heard={heard} />
          <ol className={m.v10list}>
            {sections.map((s, i) => <li key={i}><b>{s.name}</b><span>{s.from}–{s.to - 1}</span><em>{barTime(s.from)}</em></li>)}
          </ol>
          <p className={m.dim}>Read clockwise from the top. Inner rings: kick, bass, chords, hats, vocals. {EST_NOTE}</p>
          <div className={m.v10act}><StartBtn heard={heard} /><ExplainBtn mentor={mentor} disabled={heard < TRACK.bars} /></div>
          {mentor.open && <MentorAnswer compact />}
        </aside>
      </div>
    </div>
  );
}
