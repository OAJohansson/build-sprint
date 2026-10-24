"use client";
// The arrangement map in the Studio's own language: the bar ruler, the four-colour lanes (plus
// vocals) and loop-like blocks where each layer seems to play. Read-only; one way out: a template.
import { Fragment, useState } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { MENTOR_MORE, barTime, barsOf, heardOf, lengthText, mentorAnswer, type Layer, type Section, type Span, type Track } from "./data";
import s from "./map3.module.css";

export type MapState = "main" | "listening" | "empty";

/** Two looks only (likely, maybe): neighbouring spans that look the same become one block. */
function blocks(spans: Span[]): Span[] {
  const out: Span[] = [];
  for (const sp of spans) {
    const lv = (sp.level === 1 ? 1 : 2) as Span["level"];
    const last = out[out.length - 1];
    if (last && last.to === sp.from && last.level === lv) last.to = sp.to;
    else out.push({ ...sp, level: lv });
  }
  return out;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/** Bar-number step so labels sit at least ~56 px apart on a ~1,300 px ruler. */
function step(bars: number) {
  for (const st of [8, 16, 32, 64]) if ((st / bars) * 1300 >= 56) return st;
  return 128;
}

export function StudioMap({ track, initialState, initialMentor }: { track: Track; initialState: MapState; initialMentor: boolean }) {
  const [state, setState] = useState<MapState>(initialState);
  const [mentor, setMentor] = useState(initialMentor && initialState === "main");
  const [more, setMore] = useState(false);
  const [started, setStarted] = useState(false);
  const [read, setRead] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);

  const bars = barsOf(track);
  const heard = state === "main" ? bars : state === "listening" ? Math.round(bars * 0.63) : 0;
  const t = heardOf(track, heard);
  const done = state === "main";
  const pct = (bar: number) => `${((bar - 1) / bars) * 100}%`;
  const w = (a: number, b: number) => `${((b - a) / bars) * 100}%`;
  const st = step(bars);
  const nums = state === "empty" ? [] : Array.from({ length: Math.ceil(bars / st) }, (_, i) => 1 + i * st).filter((b) => b === 1 || (b - 1) / bars < 0.96);
  const left = Math.round(((bars - heard) * 240) / track.bpm);

  const secText = (x: Section) => `${x.name} · bars ${x.from}–${x.to - 1} · ${barTime(track, x.from)}–${barTime(track, x.to)}`;
  const spanText = (l: Layer, sp: Span) => `${l.name} · bars ${sp.from}–${sp.to - 1} · ${sp.level === 1 ? "maybe" : "likely"} (estimate)`;
  const reason = state === "empty" ? "Map the track first" : state === "listening" ? "Ready when the whole track has played" : null;

  return (
    <div className={s.root} onKeyDown={(e) => { if (e.key === "Escape") { setSel(null); setRead(null); } }}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}><SettingsLink /></div>
      </header>

      <div className={s.head}>
        <a className={s.back} href="/analyse">← Analyse</a>
        <div className={s.title}>
          <h1 title={track.title}>{track.title}</h1>
          <p title={track.uploader}>{track.uploader}</p>
        </div>
        <p className={s.facts}>
          <span>{track.bpm} BPM</span><span>{track.key}</span><span>{lengthText(track)}</span>
          {state !== "empty" && <span>{bars} bars</span>}
        </p>
        <div className={s.actions}>
          {reason && <span className={s.reason} id="why">{reason}</span>}
          {started && <span className={s.reason} aria-live="polite">Opening a new Studio track: {track.bpm} BPM, {track.key}, {bars} bars, {plural(t.sections.length, "marker")}…</span>}
          <button className={s.textBtn} disabled={!done} aria-describedby={reason ? "why" : undefined} aria-expanded={mentor} onClick={() => setMentor((m) => !m)}>
            {mentor ? "Hide explanation" : "Explain the structure"}
          </button>
          <button className={s.start} disabled={!done || started} aria-describedby={reason ? "why" : undefined} onClick={() => setStarted(true)}>
            Start a track from this
          </button>
        </div>
      </div>

      {state === "listening" && (
        <div className={s.prog} role="status">
          <div className={s.progText}>
            <span>Listening · bar {heard} of {bars}</span>
            <span>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} left</span>
          </div>
          <div className={s.progBar}><i style={{ width: `${(heard / bars) * 100}%` }} /></div>
        </div>
      )}

      {mentor && (
        <section className={s.mentor} aria-label="Mentor" aria-live="polite">
          <p><span className={s.who}>Mentor</span>{mentorAnswer(track)}{more && <> {MENTOR_MORE}</>}</p>
          <div className={s.mentorAct}>
            {!more && <button className={s.textBtn} onClick={() => setMore(true)}>Tell me more</button>}
          </div>
        </section>
      )}

      {state !== "empty" && <div className={s.info}>
        <span className={s.read} aria-live="polite">{read ?? "Point at a block or a section to read it."}</span>
        <span className={s.note}>Layers are estimates from the sound, not stems. <i className={s.hatchKey} aria-hidden /> maybe</span>
      </div>}

      <div className={s.grid} onMouseLeave={() => setRead(sel === null ? null : secText(t.sections[sel]))}>
        <div className={s.corner}>Layers <em>est.</em></div>
        <div className={s.ruler}>
          {t.sections.map((x, i) => (
            <button
              key={i}
              className={s.sec}
              style={{ left: pct(x.from), width: w(x.from, x.to) }}
              title={x.name}
              aria-pressed={sel === i}
              aria-label={secText(x)}
              onMouseEnter={() => setRead(secText(x))}
              onFocus={() => setRead(secText(x))}
              onClick={() => { setSel(sel === i ? null : i); setRead(secText(x)); }}
            >
              {x.name}
            </button>
          ))}
          {state === "listening" && <span className={s.later} style={{ left: pct(heard + 1) }}>Not heard yet</span>}
          {nums.map((b) => <span key={b} className={s.num} style={{ left: pct(b) }}>{b}</span>)}
        </div>
        {t.layers.map((l) => (
          <Fragment key={l.id}>
            <div className={s.lh} style={{ "--c": l.color } as React.CSSProperties}>{l.name}</div>
            <div className={s.lane} style={{ "--step": `${(st / bars) * 100}%` } as React.CSSProperties}>
              {t.sections.slice(1).map((x, i) => <i key={i} className={s.line} style={{ left: pct(x.from) }} />)}
              {sel !== null && t.sections[sel] && <i className={s.selCol} style={{ left: pct(t.sections[sel].from), width: w(t.sections[sel].from, t.sections[sel].to) }} />}
              {blocks(l.spans).map((sp, i) => (
                <span
                  key={i}
                  tabIndex={0}
                  role="img"
                  aria-label={spanText(l, sp)}
                  className={sp.level === 1 ? `${s.block} ${s.maybe}` : s.block}
                  style={{ left: pct(sp.from), width: w(sp.from, sp.to), "--c": l.color } as React.CSSProperties}
                  onMouseEnter={() => setRead(spanText(l, sp))}
                  onFocus={() => setRead(spanText(l, sp))}
                />
              ))}
              {done && l.spans.length === 0 && <span className={s.none}>Not heard in this track</span>}
              {state === "listening" && <span className={s.unheard} style={{ left: pct(heard + 1) }} />}
            </div>
          </Fragment>
        ))}
        {state === "empty" && (
          <div className={s.empty}>
            <h2>Not mapped yet</h2>
            <p>Play the whole track and the map fills in as it plays. Six AM keeps the measurements, never the audio.</p>
            <button className={s.start} onClick={() => setState("listening")}>Listen and map</button>
          </div>
        )}
      </div>
    </div>
  );
}
