"use client";
// Direction C, "Rack": an overlay panel built like the table itself. A deck header (track, gold
// BPM), jobs as a row of chips, and every answer laid out in two columns: a source column
// (a tinted code per sentence) and the text. A status bar carries cost and today's count; the
// 50/day warning rises as a sheet over the chat box.
import { useEffect, useRef, useState } from "react";
import { bpmText, camelot } from "@/lib/ears/labels";
import { JOBS, MONTH, money, SRC_LABEL, SRC_SHORT, type Answer, type Sentence } from "./data";
import type { Mentor } from "./use-mentor";
import s from "./rack.module.css";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

function Code({ x }: { x: Sentence }) {
  return <span className={cx(s.code, s[x.src])} title={SRC_LABEL[x.src]}>{SRC_SHORT[x.src]}</span>;
}
function Rows({ list }: { list: Sentence[] }) {
  return (
    <>
      {list.map((x, i) => (
        <div key={i} className={s.line}>
          <Code x={x} />
          <p>{x.text}{x.link ? <> <a className={s.link} href={x.link.href} target="_blank" rel="noreferrer">{x.link.label} ↗</a></> : null}</p>
        </div>
      ))}
    </>
  );
}

function Turn({ a }: { a: Answer }) {
  const [accepted, setAccepted] = useState(false);
  const [fb, setFb] = useState<Record<number, string>>({});
  return (
    <article className={s.turn}>
      <div className={s.line}>
        <span className={cx(s.code, s.you)}>YOU</span>
        <p className={s.askText}>{a.ask}</p>
      </div>
      <Rows list={a.sentences} />
      {a.items?.map((it, i) => (
        <div key={i} className={s.item}>
          <div className={s.line}>
            <span className={s.idx}>{String(i + 1).padStart(2, "0")}</span>
            <p><a className={s.itemTitle} href={it.href} target="_blank" rel="noreferrer">{it.artist} — {it.title} ↗</a></p>
          </div>
          {it.because.map((x, k) => (
            <div key={k} className={s.line}>
              <Code x={x} />
              <p className={s.because}>{k === 0 ? "Because " : ""}{x.text}{x.link ? <> <a className={s.link} href={x.link.href} target="_blank" rel="noreferrer">{x.link.label} ↗</a></> : null}</p>
            </div>
          ))}
          <div className={cx(s.line, s.fbLine)}>
            <span />
            <div className={s.fb}>
              {fb[i] ? <span className={s.noted}>{fb[i]}</span> : (<>
                <button className={s.textBtn} onClick={() => setFb({ ...fb, [i]: "Noted: more like this" })}>More like this</button>
                <button className={s.textBtn} onClick={() => setFb({ ...fb, [i]: "Noted: not for you" })}>Not for me</button>
              </>)}
            </div>
          </div>
        </div>
      ))}
      {a.teach?.map((sec) => (
        <div key={sec.heading} className={s.teachSec}>
          <div className={s.line}><span /><h4>{sec.heading}</h4></div>
          <Rows list={sec.body} />
        </div>
      ))}
      <div className={cx(s.line, s.foot)}>
        <span />
        <div className={s.footRow}>
          {a.accept ? (accepted ? <span className={s.noted}>My genre set to {a.accept}</span> : <button className={s.btn} onClick={() => setAccepted(true)}>Use “{a.accept}” as My genre</button>) : null}
          {a.more ? <button className={s.textBtn}>Tell me more</button> : null}
          <span className={s.cost} title="Estimate from tokens and web searches">est. {money(a.cost)}</span>
        </div>
      </div>
      {a.updated ? (
        <div className={cx(s.line, s.updated)}>
          <span className={cx(s.code, s.taste)}>LEARNT</span>
          <p>Updated: {a.updated}. <a className={s.link} href="/prototypes/mentor/settings">My taste</a></p>
        </div>
      ) : null}
    </article>
  );
}

export function Rack({ m, open, onClose }: { m: Mentor; open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  // Newest answer in view: scroll so its top shows.
  useEffect(() => { const el = threadRef.current; const last = el?.querySelector("article:last-of-type") as HTMLElement | null; if (el && last) el.scrollTop = last.offsetTop - 4; }, [m.thread.length]);
  const t = m.track;
  const jobs = JOBS.filter((j) => !j.secondary);
  const more = JOBS.filter((j) => j.secondary);
  return (
    <aside className={cx(s.panel, open && s.open)} aria-label="Mentor" aria-hidden={!open}>
      <header className={s.deck}>
        <div className={s.tabs} role="tablist">
          <button role="tab" aria-selected={m.scope === "track"} className={s.tab} onClick={() => m.setScope("track")}>Track</button>
          <button role="tab" aria-selected={m.scope === "general"} className={s.tab} onClick={() => m.setScope("general")}>General</button>
          <button className={s.close} onClick={onClose} aria-label="Close Mentor">×</button>
        </div>
        {t ? (
          <div className={s.trackRow}>
            <div className={s.trackName}><b>{t.title}</b><span>{t.uploader} · {camelot(t.key, t.scale)} · {t.key} {t.scale}</span></div>
            <div className={s.lcd}>{bpmText(t.bpm)}<span className={s.lcdUnit}>BPM</span></div>
          </div>
        ) : (
          <div className={s.trackRow}><div className={s.trackName}><b>No track</b><span>Questions about music in general</span></div></div>
        )}
        <div className={s.chips}>
          {jobs.map((j) => <button key={j.id} className={s.chip} disabled={(j.needsTrack && !t) || m.warn} onClick={() => m.ask(j.id)}>{j.label}</button>)}
          {more.map((j) => <button key={j.id} className={cx(s.chip, s.chipQuiet)} disabled={m.warn} onClick={() => m.ask(j.id)}>{j.label}</button>)}
        </div>
      </header>

      <div className={s.colHead}><span>Source</span><span>Answer</span></div>
      <div className={s.thread} ref={threadRef}>
        {m.thread.length ? m.thread.map((a) => <Turn key={a.id} a={a} />) : (
          <p className={s.empty}>{t ? "Nothing asked about this track yet. Press a job above or type below." : "Ask anything, or press Teach me a genre."}</p>
        )}
      </div>

      <div className={s.bottom}>
        {m.warn ? (
          <div className={s.sheet} role="alert">
            <p><b>50 questions today.</b> About {money(m.cost.today)} so far, estimated from usage. Keep going if you like; this asks once a day.</p>
            <div className={s.sheetActions}>
              <button className={s.btn} onClick={m.continueAnyway}>Continue anyway</button>
              <button className={s.textBtn} onClick={m.stopToday}>Stop for today</button>
            </div>
          </div>
        ) : null}
        <form className={s.composer} onSubmit={(e) => { e.preventDefault(); m.send(text); setText(""); }}>
          <input className={s.input} value={text} onChange={(e) => setText(e.target.value)} disabled={m.warn} placeholder={t ? "Follow-up about this track" : "Ask about music or making it"} aria-label="Ask the Mentor" />
          <button className={s.btn} disabled={m.warn || !text.trim()}>Ask</button>
        </form>
        <div className={s.status}>
          <span>Est. today <b>{money(m.cost.today)}</b> · {MONTH} <b>{money(m.cost.month)}</b></span>
          <span className={s.count}>
            {m.cost.count} / 50 today
            <i className={s.meter}><i style={{ width: `${Math.min(100, (m.cost.count / 50) * 100)}%` }} /></i>
          </span>
        </div>
      </div>
    </aside>
  );
}
