"use client";
// The arrangement map in the Studio's own language: the bar ruler, the lane colours and flat
// blocks where each layer seems to play. Read-only; one way out: a template.
import { Fragment, useState } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { MENTOR_MORE, barTime, barsOf, heardOf, lengthText, mentorAnswer, type Layer, type Section, type Span, type Track } from "./data";
import s from "./map3.module.css";

export type MapState = "main" | "listening" | "empty";

const RULER_PX = 1290; // the ruler's width at the 1440 px laptop layout

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

/** Bar-number step so labels sit at least ~56 px apart on the ruler. */
function step(bars: number) {
  for (const st of [8, 16, 32, 64]) if ((st / bars) * RULER_PX >= 56) return st;
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
  const reason = state === "empty" ? "Map the track first" : state === "listening" ? "Ready when the whole track has played" : undefined;
  const lines = t.sections.slice(1).map((x) => x.from);

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
          <p>
            <span className={s.uploader} title={track.uploader}>{track.uploader}</span>
            <span className={s.facts}><span className={s.sep} aria-hidden>·</span>{track.bpm} BPM · {track.key} · {lengthText(track)}{state !== "empty" && ` · ${bars} bars`}</span>
          </p>
        </div>
        <div className={s.actions}>
          {reason && <span id="why" className={s.srOnly}>{reason}</span>}
          {started && <span className={s.done} aria-live="polite">Opening a new Studio track: {track.bpm} BPM, {track.key}, {bars} bars, {plural(t.sections.length, "marker")}…</span>}
          <span title={reason}>
            <button className={s.textBtn} disabled={!done} aria-describedby={reason ? "why" : undefined} aria-expanded={mentor} onClick={() => setMentor((m) => !m)}>
              {mentor ? "Hide explanation" : "Explain the structure"}
            </button>
          </span>
          <span title={reason}>
            <button className={s.start} disabled={!done || started} aria-describedby={reason ? "why" : undefined} onClick={() => setStarted(true)}>
              Start a track from this
            </button>
          </span>
        </div>
      </div>


      {state !== "empty" && <div className={s.info}>
        <span className={s.read} aria-live="polite">{read}</span>
        <span className={s.note}><i className={s.hatchKey} aria-hidden /> maybe <span className={s.sep} aria-hidden>·</span> Layers are estimates from the sound, not stems.</span>
      </div>}

      <div className={s.grid} style={{ "--step": `${(st / bars) * 100}%` } as React.CSSProperties} onMouseLeave={() => setRead(sel === null ? null : secText(t.sections[sel]))}>
        <div className={s.corner} title="Estimated from the sound, not stems">Layers</div>
        <div className={s.ruler}>
          {t.sections.map((x, i) => {
            // Hidden (shown on hover/focus) when the name would not fit; never elided.
            const narrow = ((x.to - x.from) / bars) * RULER_PX < x.name.length * 7 + 16;
            return (
              <button
                key={i}
                className={narrow ? `${s.sec} ${s.narrow}` : s.sec}
                style={{ left: pct(x.from), width: w(x.from, x.to) }}
                aria-pressed={sel === i}
                aria-label={secText(x)}
                onMouseEnter={() => setRead(secText(x))}
                onFocus={() => setRead(secText(x))}
                onClick={() => { setSel(sel === i ? null : i); setRead(secText(x)); }}
              >
                <span>{x.name}</span>
              </button>
            );
          })}
          {state === "listening" && <span className={s.unheard} style={{ left: pct(heard + 1) }} />}
          {state === "listening" && (
            <span className={s.here} style={{ left: pct(heard + 1) }} role="status">bar {heard} · {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} left</span>
          )}
          {nums.map((b) => <span key={b} className={s.num} style={{ left: pct(b) }}>{b}</span>)}
          {lines.map((b) => <i key={b} className={s.secLine} style={{ left: pct(b) }} />)}
        </div>
        {t.layers.map((l) => (
          <Fragment key={l.id}>
            <div className={s.lh} style={{ "--c": l.color } as React.CSSProperties}>{l.name}</div>
            <div className={s.lane}>
              {lines.map((b) => <i key={b} className={s.secLine} style={{ left: pct(b) }} />)}
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
            <p>Play the whole track; the map fills in as it plays.</p>
            <button className={s.start} onClick={() => setState("listening")}>Listen and map</button>
          </div>
        )}
      </div>
      {mentor && (
        <section className={s.mentor} aria-label="Mentor" aria-live="polite">
          <p>
            {mentorAnswer(track)}{more && <> {MENTOR_MORE}</>}
            {!more && <> <button className={s.textBtn} onClick={() => setMore(true)}>Tell me more</button></>}
          </p>
        </section>
      )}
    </div>
  );
}
