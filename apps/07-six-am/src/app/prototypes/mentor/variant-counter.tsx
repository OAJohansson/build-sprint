"use client";
// Direction A, "Counter": an overlay panel over the table's right edge; jobs as a plain list
// (with hints when the thread is empty, a compact grid after); sources as inline labels after
// every sentence; cost under the chat box; the 50/day warning as a block above it.
import { useEffect, useRef, useState } from "react";
import { bpmText, camelot } from "@/lib/ears/labels";
import { JOBS, MONTH, money, SRC_LABEL, type Answer, type Sentence } from "./data";
import type { Mentor } from "./use-mentor";
import s from "./counter.module.css";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

function Src({ x }: { x: Sentence }) {
  if (x.src === "web" && x.link) return <a className={s.src} href={x.link.href} target="_blank" rel="noreferrer">web · {x.link.label} ↗</a>;
  return <span className={s.src}>{SRC_LABEL[x.src]}</span>;
}
function Text({ list }: { list: Sentence[] }) {
  // The label stays glued to the sentence's last word, so it never wraps to look like the next one's.
  return <>{list.map((x, i) => {
    const cut = x.text.lastIndexOf(" ");
    return <span key={i}>{x.text.slice(0, cut + 1)}<span className={s.glue}>{x.text.slice(cut + 1)}{"\u00a0"}<Src x={x} /></span>{i < list.length - 1 ? " " : ""}</span>;
  })}</>;
}

function Turn({ a }: { a: Answer }) {
  const [accepted, setAccepted] = useState(false);
  const [fb, setFb] = useState<Record<number, string>>({});
  return (
    <article className={s.turn}>
      <p className={s.ask}>{a.ask}</p>
      {a.sentences.length ? <p className={s.answer}><Text list={a.sentences} /></p> : null}
      {a.items ? (
        <ol className={s.items}>
          {a.items.map((it, i) => (
            <li key={i}>
              <a className={s.itemTitle} href={it.href} target="_blank" rel="noreferrer">{it.artist} — {it.title} <span className={s.arrow}>↗</span></a>
              <p className={s.because}>Because <Text list={it.because} /></p>
              <div className={s.fb}>
                {fb[i] ? <span className={s.dim}>{fb[i]}</span> : (<>
                  <button className={s.textBtn} onClick={() => setFb({ ...fb, [i]: "Noted: more like this" })}>More like this</button>
                  <button className={s.textBtn} onClick={() => setFb({ ...fb, [i]: "Noted: not for you" })}>Not for me</button>
                </>)}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {a.teach ? (
        <div className={s.teach}>
          {a.teach.map((sec) => (
            <section key={sec.heading}>
              <h4>{sec.heading}</h4>
              <p className={s.answer}><Text list={sec.body} /></p>
            </section>
          ))}
        </div>
      ) : null}
      <div className={s.turnFoot}>
        {a.accept ? (accepted ? <span className={s.dim}>My genre set to {a.accept}</span> : <button className={s.btn} onClick={() => setAccepted(true)}>Use “{a.accept}” as My genre</button>) : null}
        {a.more ? <button className={s.textBtn}>Tell me more</button> : null}
        <span className={s.cost} title="Estimate from tokens and web searches">est. {money(a.cost)}</span>
      </div>
      {a.updated ? <p className={s.updated}>Updated: {a.updated}. <a href="/prototypes/mentor/settings">See My taste</a></p> : null}
    </article>
  );
}

export function Counter({ m, open, onClose }: { m: Mentor; open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  // Newest answer in view: scroll so its top shows.
  useEffect(() => { const el = threadRef.current; const last = el?.querySelector("article:last-of-type") as HTMLElement | null; if (el && last) el.scrollTop = last.offsetTop - 4; }, [m.thread.length]);
  const t = m.track;
  const empty = !m.thread.length;
  const jobs = JOBS.filter((j) => !j.secondary);
  const more = JOBS.filter((j) => j.secondary);
  return (
    <aside className={cx(s.panel, open && s.open)} aria-label="Mentor" aria-hidden={!open}>
      <header className={s.head}>
        {t ? (
          <>
            <div className={s.titleRow}>
              <h2 className={s.title}>{t.title}</h2>
              <button className={s.textBtn} onClick={() => m.setScope("general")}>No track</button>
              <button className={s.close} onClick={onClose} aria-label="Close Mentor">×</button>
            </div>
            <div className={s.meta}>
              <span className={s.muted}>{t.uploader}</span>
              <span><b className={s.bpm}>{bpmText(t.bpm)}</b> <span className={s.unit}>BPM</span></span>
              <span className={s.muted}>{camelot(t.key, t.scale)} · {t.key} {t.scale}</span>
            </div>
          </>
        ) : (
          <>
            <div className={s.titleRow}>
              <h2 className={s.title}>General questions</h2>
              <button className={s.textBtn} onClick={() => m.setScope("track")}>Back to track</button>
              <button className={s.close} onClick={onClose} aria-label="Close Mentor">×</button>
            </div>
            <div className={s.meta}>
              <span className={s.muted}>Not about one track</span>
            </div>
          </>
        )}
      </header>

      <div className={s.thread} ref={threadRef}>
        {empty ? (
          <p className={s.emptyNote}>{t ? "Pick a job, or ask anything about this track." : "Ask anything, or learn a genre. Jobs that need a track are greyed until you pick one."}</p>
        ) : m.thread.map((a) => <Turn key={a.id} a={a} />)}
      </div>

      {m.warn ? (
        <div className={s.warn} role="alert">
          <p><b>That&apos;s 50 questions today.</b> About {money(m.cost.today)} so far (estimate). Six AM checks in once a day so costs don&apos;t creep up.</p>
          <div className={s.warnActions}>
            <button className={s.btn} onClick={m.continueAnyway}>Continue anyway</button>
            <button className={s.textBtn} onClick={m.stopToday}>Stop for today</button>
          </div>
        </div>
      ) : null}

      <div className={s.dock}>
        {empty ? (
          <ul className={s.jobList}>
            {[...jobs, ...more].map((j) => (
              <li key={j.id}>
                <button className={s.jobRow} disabled={j.needsTrack && !t} onClick={() => m.ask(j.id)}>
                  <span className={s.jobLabel}>{j.label}</span><span className={s.jobHint}>{j.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className={s.jobGrid}>
            {jobs.map((j) => <button key={j.id} className={s.jobCell} disabled={(j.needsTrack && !t) || m.warn} onClick={() => m.ask(j.id)}>{j.label}</button>)}
            <div className={s.jobMore}>{more.map((j) => <button key={j.id} className={s.textBtn} disabled={m.warn} onClick={() => m.ask(j.id)}>{j.label}</button>)}</div>
          </div>
        )}
        <form className={s.composer} onSubmit={(e) => { e.preventDefault(); m.send(text); setText(""); }}>
          <input className={s.input} value={text} onChange={(e) => setText(e.target.value)} disabled={m.warn} placeholder={t ? "Ask about this track" : "Ask about music, genres, making tracks"} aria-label="Ask the Mentor" />
          <button className={s.btn} disabled={m.warn || !text.trim()}>Ask</button>
        </form>
        <p className={s.costLine}>Estimate · Today {money(m.cost.today)} · {MONTH} {money(m.cost.month)}</p>
      </div>
    </aside>
  );
}
