"use client";
// Direction B, "Liner notes": a docked column that pushes the table left; the Mentor's voice in
// the serif, sources as footnote numbers with a credits strip under each answer; jobs live in one
// command field (type / or focus it empty); cost in the header; the 50/day warning takes the
// field's place.
import { useEffect, useMemo, useRef, useState } from "react";
import { bpmText } from "@/lib/ears/labels";
import { JOBS, MONTH, money, SRC_LABEL, type Answer, type Sentence } from "./data";
import type { Mentor } from "./use-mentor";
import s from "./liner.module.css";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const srcKey = (x: Sentence) => (x.src === "web" && x.link ? `web:${x.link.href}` : x.src);

function useNotes(a: Answer) {
  return useMemo(() => {
    const all = [...a.sentences, ...(a.items ?? []).flatMap((i) => i.because), ...(a.teach ?? []).flatMap((t) => t.body)];
    const order: { key: string; x: Sentence }[] = [];
    for (const x of all) if (!order.some((o) => o.key === srcKey(x))) order.push({ key: srcKey(x), x });
    return { n: (x: Sentence) => order.findIndex((o) => o.key === srcKey(x)) + 1, order };
  }, [a]);
}

function Flow({ list, n }: { list: Sentence[]; n: (x: Sentence) => number }) {
  return <>{list.map((x, i) => <span key={i}>{x.text}<sup className={s.sup}>{n(x)}</sup>{i < list.length - 1 ? " " : ""}</span>)}</>;
}

function Turn({ a }: { a: Answer }) {
  const { n, order } = useNotes(a);
  const [accepted, setAccepted] = useState(false);
  const [fb, setFb] = useState<Record<number, string>>({});
  return (
    <article className={s.turn}>
      <p className={s.ask}><span className={s.you}>You</span>{a.ask}</p>
      {a.sentences.length ? <p className={s.voice}><Flow list={a.sentences} n={n} /></p> : null}
      {a.items ? (
        <ol className={s.tracklist}>
          {a.items.map((it, i) => (
            <li key={i}>
              <span className={s.side}>A{i + 1}</span>
              <div>
                <a className={s.itemTitle} href={it.href} target="_blank" rel="noreferrer">{it.artist} — {it.title} <span className={s.arrow}>↗</span></a>
                <p className={s.because}>Because <Flow list={it.because} n={n} /></p>
                <div className={s.fb}>
                  {fb[i] ? <span className={s.noted}>{fb[i]}</span> : (<>
                    <button className={s.textBtn} onClick={() => setFb({ ...fb, [i]: "Noted: more like this" })}>More like this</button>
                    <button className={s.textBtn} onClick={() => setFb({ ...fb, [i]: "Noted: not for you" })}>Not for me</button>
                  </>)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {a.teach ? a.teach.map((sec) => (
        <section key={sec.heading} className={s.teachSec}>
          <h4>{sec.heading}</h4>
          <p className={s.voiceSm}><Flow list={sec.body} n={n} /></p>
        </section>
      )) : null}
      <div className={s.actions}>
        {a.accept ? (accepted ? <span className={s.noted}>My genre set to {a.accept}</span> : <button className={s.btn} onClick={() => setAccepted(true)}>Use “{a.accept}” as My genre</button>) : null}
        {a.more ? <button className={s.textBtn}>Tell me more</button> : null}
        <span className={s.cost} title="Estimate from tokens and web searches">est. {money(a.cost)}</span>
      </div>
      <ol className={s.notes} aria-label="Sources">
        {order.map(({ key, x }, i) => (
          <li key={key}><span className={s.noteN}>{i + 1}</span>{x.src === "web" && x.link ? <a href={x.link.href} target="_blank" rel="noreferrer">{x.link.label} ↗</a> : SRC_LABEL[x.src]}{x.src === "web" ? <span className={s.kind}> · web</span> : null}</li>
        ))}
        {a.updated ? <li className={s.updated}>Updated your taste profile: {a.updated}. <a href="/prototypes/mentor/settings">See it</a></li> : null}
      </ol>
    </article>
  );
}

function Command({ m, startOpen }: { m: Mentor; startOpen: boolean }) {
  const [text, setText] = useState("");
  const [focus, setFocus] = useState(startOpen);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (startOpen) ref.current?.focus(); }, [startOpen]);
  const q = text.startsWith("/") ? text.slice(1).toLowerCase() : text ? null : "";
  const list = q === null ? [] : JOBS.filter((j) => j.label.toLowerCase().includes(q));
  const show = focus && list.length > 0;
  const pick = (i: number) => { const j = list[i]; if (!j || (j.needsTrack && !m.track)) return; m.ask(j.id); setText(""); ref.current?.blur(); };
  return (
    <form className={s.command} onSubmit={(e) => { e.preventDefault(); if (show) pick(hi); else { m.send(text); setText(""); } }}>
      {show ? (
        <ul className={s.suggest} role="listbox">
          {list.map((j, i) => (
            <li key={j.id} role="option" aria-selected={i === hi}>
              <button type="button" className={cx(s.sugRow, i === hi && s.sugHi)} disabled={j.needsTrack && !m.track} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setHi(i)} onClick={() => pick(i)}>
                <span>{j.label}</span><span className={s.sugHint}>{j.needsTrack && !m.track ? "needs a track" : j.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        ref={ref} className={s.field} value={text} aria-label="Ask the Mentor, or type / for jobs"
        placeholder={m.track ? "Ask about this track, or / for jobs" : "Ask anything, or / for jobs"}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={(e) => { setText(e.target.value); setHi(0); }}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % list.length); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + list.length) % list.length); }
        }}
      />
    </form>
  );
}

export function Liner({ m, open, onClose }: { m: Mentor; open: boolean; onClose: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = end.current?.parentElement; const last = el?.querySelector("article:last-of-type") as HTMLElement | null; if (el && last) el.scrollTop = last.offsetTop - 4; }, [m.thread.length]);
  if (!open) return null;
  const t = m.track;
  return (
    <aside className={s.panel} aria-label="Mentor">
      <header className={s.head}>
        <h2 className={s.name}>Mentor</h2>
        <span className={s.costHead} title="Estimate from API usage and published prices">est. Today {money(m.cost.today)} · {MONTH} {money(m.cost.month)}</span>
        <button className={s.close} onClick={onClose} aria-label="Close Mentor">×</button>
      </header>
      <div className={s.context}>
        <div className={s.scope} role="tablist">
          <button role="tab" aria-selected={m.scope === "track"} className={s.tab} onClick={() => m.setScope("track")}>This track</button>
          <button role="tab" aria-selected={m.scope === "general"} className={s.tab} onClick={() => m.setScope("general")}>General</button>
        </div>
        {t ? (
          <p className={s.on}><b>{t.title}</b><span className={s.by}>{t.uploader}</span><span className={s.bpm}>{bpmText(t.bpm)}</span></p>
        ) : <p className={s.on}><span className={s.by}>Questions not about one track</span></p>}
      </div>
      <div className={s.thread}>
        {m.thread.length ? m.thread.map((a) => <Turn key={a.id} a={a} />) : (
          <p className={s.empty}>{t ? <>Ask about <i>{t.title}</i>, or type / to see what I can do.</> : "Ask anything about music or making it, or type / to see what I can do."}</p>
        )}
        <div ref={end} />
      </div>
      {m.warn ? (
        <div className={s.warn} role="alert">
          <p><b>50 questions today</b>, about {money(m.cost.today)} so far (estimate). This is a check-in, not a limit.</p>
          <div className={s.warnActions}>
            <button className={s.btn} onClick={m.continueAnyway}>Continue anyway</button>
            <button className={s.textBtn} onClick={m.stopToday}>Stop for today</button>
          </div>
        </div>
      ) : <Command m={m} startOpen={m.preset === "jobs" || m.preset === "empty"} />}
    </aside>
  );
}
