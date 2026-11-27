"use client";

// The card's contents, shared by the desktop card and the phone screen: a school's sections,
// a thinker, the "Your thread" panel (handoff "The card", "Your thread"; progress #37) and Further reading (#39).
import { Fragment, useEffect, useRef, useState } from "react";
import { alsoIn, getSchool, getThinker, ledeOf, schools, splitName, studyPrompt, whenOf, type School, type Thinker } from "@/lib/content";
import { progressLine, threadProgress } from "@/lib/progress";
import { furtherReading, type Reading } from "@/lib/reading";
import { copyText } from "@/lib/copy";
import type { Nav } from "./meander";

/** "Kierkegaard · Sartre" as inline links that open the thinker. */
function ThinkerLinks({ ids, nav }: { ids: string[]; nav: Nav }) {
  return (
    <>
      {ids.map((id, i) => {
        const t = getThinker(id);
        if (!t) return null;
        return (
          <Fragment key={id}>
            {i > 0 && " · "}
            <button type="button" onClick={() => nav.openThinker(id)}>{t.short}</button>
          </Fragment>
        );
      })}
    </>
  );
}

/** "Step inside · 5 big ideas": opens the school's skeleton (L26). */
export function StepInside({ school, nav }: { school: School; nav: Nav }) {
  return (
    <button type="button" className="enter-card" onClick={nav.stepInside}>
      <span className="u">Step inside</span>
      <span className="cnt">{school.themes.length} big ideas</span>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

const arrow = (
  <svg className="ext" width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M3.5 8.5l5-5M4.5 3.5h4v4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** One entry: its title as a link to the encyclopedia (a new tab), the publisher in small text under it. */
export function ReadingLink({ r }: { r: Reading }) {
  return (
    <>
      <a className="rdl" href={r.url} target="_blank" rel="noopener">
        {r.title}{arrow}<span className="sr-only"> (opens in a new tab)</span>
      </a>
      <small className="pub">{r.publisher}</small>
    </>
  );
}

/** "Start here" and "Go deeper" as labelled lines, for the card's list and the skeleton's facts. */
export function ReadingRows({ school }: { school: School }) {
  const [start, ...deeper] = furtherReading(school);
  if (!start) return null;
  return (
    <>
      <div className="fx rd">
        <dt>Start here</dt>
        <dd><ReadingLink r={start} /></dd>
      </div>
      {deeper.length > 0 && (
        <div className="fx rd">
          <dt>Go deeper</dt>
          <dd>{deeper.map((r) => <span key={r.url} className="rdi"><ReadingLink r={r} /></span>)}</dd>
        </div>
      )}
    </>
  );
}

/** The card's last section (#39): the entries the school's content cites most. */
function FurtherReading({ school, phone }: { school: School; phone: boolean }) {
  if (!furtherReading(school).length) return null;
  return (
    <>
      {!phone && <hr />}
      <h2 className={phone ? "psec" : "sec"}>Further reading</h2>
      <dl className="rdlist">
        <ReadingRows school={school} />
      </dl>
    </>
  );
}

export function SchoolSections({ school, nav, phone = false, titled = false }: { school: School; nav: Nav; phone?: boolean; titled?: boolean }) {
  const sec = phone ? "psec" : "sec";
  const sep = phone ? null : <hr />;
  const empty = !school.questions.length && !school.themes.length && !school.thinkers.length;
  const lede = ledeOf(school);
  // Desktop: the card opens with one line on what the school is (L20). The phone shows it under the title.
  // On the timeline there is no title on the globe, so the card carries the school's name (#41).
  const { short, aside } = splitName(school.name);
  const titleEl = titled ? (
    <>
      <h2 className="ctitle" aria-label={school.name}>{short}</h2>
      <p className="cmeta">{[aside, whenOf(school)].filter(Boolean).join(" · ")}</p>
    </>
  ) : null;
  const ledeEl = !phone && (lede || titleEl) ? <>{titleEl}{lede && <p className="lede">{lede}</p>}</> : null;
  // Desktop: the card's way into the skeleton, under the lede (the phone puts it under its own lede).
  const enterEl = !phone && school.themes.length > 0 ? <StepInside school={school} nav={nav} /> : null;
  if (empty) {
    return (
      <>
        {ledeEl}
        <h2 className={phone ? "psec" : "sec first"}>It asks</h2>
        <p className="pending">This school’s questions, themes and thinkers are still being written.</p>
        <FurtherReading school={school} phone={phone} />
      </>
    );
  }
  return (
    <>
      {ledeEl}
      {enterEl}
      {school.questions.length > 0 && (
        <>
          <h2 className={phone ? sec : "sec first"}>It asks</h2>
          <ol className="q">
            {school.questions.map((q) => <li key={q}>{q}</li>)}
          </ol>
        </>
      )}
      {school.themes.length > 0 && (
        <>
          {sep}
          <h2 className={sec}>Themes</h2>
          <ul className="tm">
            {school.themes.map((t, i) => {
              const open = nav.openTheme === i;
              const panelId = `theme-${school.id}-${i}${phone ? "-p" : ""}`;
              return (
                <li key={t.name} className={open ? "open" : undefined}>
                  <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => nav.toggleTheme(i)}>
                    <span className="no" aria-hidden="true">{i + 1}</span>
                    <span>{t.name}</span>
                  </button>
                  {open && (
                    <div id={panelId}>
                      <p>{t.text || <span className="pending">The text for this theme is still being written.</span>}</p>
                      {t.thinkers.length > 0 && (
                        <p className="who inline-links"><ThinkerLinks ids={t.thinkers} nav={nav} /></p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {school.thinkers.length > 0 && (
        <>
          {sep}
          <h2 className={sec}>Thinkers</h2>
          <ul className="th-list">
            {school.thinkers.map((id) => {
              const t = getThinker(id)!;
              return (
                <li key={id}>
                  <button type="button" onClick={() => nav.openThinker(id)}>
                    <span>{t.name}</span>
                    <span className="yr">{t.dates}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <FurtherReading school={school} phone={phone} />
    </>
  );
}

const check = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** "Study with Claude": copies the prompt, then shows "Copied", a confirming line and the prompt's first lines (T7). */
function Study({ thinker }: { thinker: Thinker }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const prompt = studyPrompt(thinker);
  const onClick = async () => {
    const ok = await copyText(prompt);
    setState(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    if (ok) timer.current = setTimeout(() => setState("idle"), 6000);
  };
  return (
    <>
      <button type="button" className={`study${state === "copied" ? " done" : ""}`} onClick={onClick}>
        {state === "copied" ? <>{check}Copied</> : "Study with Claude"}
      </button>
      <div aria-live="polite">
        {state === "idle" && <p className="hint">Copies a prompt you can paste into Claude.</p>}
        {state === "copied" && (
          <>
            <p className="hint">The prompt is on your clipboard. Paste it into Claude.</p>
            <p className="prompt"><span>{prompt}</span></p>
          </>
        )}
        {state === "failed" && (
          <>
            <p className="hint">Couldn’t reach the clipboard. Select the prompt and copy it.</p>
            <p className="prompt full"><span>{prompt}</span></p>
          </>
        )}
      </div>
    </>
  );
}

export function ThinkerSections({ thinker, nav, headingRef }: { thinker: Thinker; nav: Nav; headingRef?: React.Ref<HTMLHeadingElement> }) {
  const school = getSchool(thinker.school);
  const others = school ? school.thinkers.filter((id) => id !== thinker.id) : [];
  return (
    <>
      {school && (
        <button type="button" className="up" onClick={nav.backToSchool}>← {school.name}</button>
      )}
      <h2 className="who-name" tabIndex={-1} ref={headingRef}>{thinker.name}</h2>
      <p className="dates">
        {thinker.dates}
        {alsoIn(thinker).map((o) => (
          <Fragment key={o.id}>
            {" · also in "}
            <span className="inline-links">
              <button type="button" onClick={() => nav.openThinker(o.id)}>{getSchool(o.school)?.name}</button>
            </span>
          </Fragment>
        ))}
      </p>
      <p className="sum">{thinker.summary || <span className="pending">A short summary is still being written.</span>}</p>
      {thinker.ideas.length > 0 && (
        <ul className="ideas">
          {thinker.ideas.map((i) => <li key={i}>{i}</li>)}
        </ul>
      )}
      <Study key={thinker.id} thinker={thinker} />
      {others.length > 0 && (
        <p className="others inline-links"><ThinkerLinks ids={others} nav={nav} /></p>
      )}
    </>
  );
}

const IDEAS = schools.map((s) => ({ id: s.id, ideas: s.themes.map((t) => t.name) }));

/** Your thread (#37): how far through the field you are, then the schools you've begun, most recent first. */
export function ThreadSections({ nav, headingRef }: { nav: Nav; headingRef?: React.Ref<HTMLHeadingElement> }) {
  const t = threadProgress(nav.progress, IDEAS);
  return (
    <>
      <button type="button" className="x" onClick={nav.closeThread}>Close</button>
      <h2 className="sec" tabIndex={-1} ref={headingRef}>Your thread</h2>
      <p className="tsum">{progressLine(t)}</p>
      {t.rows.length === 0 ? (
        <p className="pending">Open a school to start it. Open every one of its ideas to explore it.</p>
      ) : (
        <ul className="prog">
          {t.rows.map((r) => {
            const s = getSchool(r.id);
            if (!s) return null;
            return (
              <li key={r.id}>
                <button type="button" onClick={() => nav.openSchool(r.id)}>
                  <i className={r.state} aria-hidden="true" />
                  <span className="nm">{s.name}<span className="sr-only">, {r.state}</span></span>
                  {r.total > 0 && <span className="ct">{r.seen} of {r.total} {r.total === 1 ? "idea" : "ideas"}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="legend" aria-hidden="true">
        <span><i className="started" />started</span>
        <span><i className="explored" />explored, every idea opened</span>
      </p>
    </>
  );
}
