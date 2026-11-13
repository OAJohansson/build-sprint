"use client";

// The card's contents, shared by the desktop card and the phone screen: a school's sections,
// a thinker, and the "Your thread" panel (handoff "The card", "Your thread").
import { Fragment, useEffect, useRef, useState } from "react";
import { getSchool, getThinker, studyPrompt, type School, type Thinker } from "@/lib/content";
import { countLine, formatDay, summarise, type Visit } from "@/lib/visits";
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

export function SchoolSections({ school, nav, phone = false }: { school: School; nav: Nav; phone?: boolean }) {
  const sec = phone ? "psec" : "sec";
  const sep = phone ? null : <hr />;
  const empty = !school.questions.length && !school.themes.length && !school.thinkers.length;
  if (empty) {
    return (
      <>
        <h2 className={phone ? "psec" : "sec first"}>It asks</h2>
        <p className="pending">This school’s questions, themes and thinkers are still being written.</p>
      </>
    );
  }
  return (
    <>
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
                    {t.name}
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
      <p className="dates">{thinker.dates}</p>
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

export function ThreadSections({ visits, nav, headingRef }: { visits: Visit[]; nav: Nav; headingRef?: React.Ref<HTMLHeadingElement> }) {
  const s = summarise(visits);
  return (
    <>
      <button type="button" className="x" onClick={nav.closeThread}>Close</button>
      <h2 className="sec" tabIndex={-1} ref={headingRef}>Your thread</h2>
      <p className="big">{countLine(s)}</p>
      {s.since && <p className="since">since {formatDay(s.since)}</p>}
      <ol className="hist">
        {s.rows.map((row) => (
          <li key={row.day}>
            <time dateTime={row.day}>{formatDay(row.day)}{row.isToday ? " · today" : ""}</time>
            <div>
              {row.items.map((it) => {
                const name = it.kind === "school" ? getSchool(it.id)?.name : getThinker(it.id)?.name;
                if (!name) return null; // content changed since the visit; skip it quietly
                return (
                  <button
                    key={it.kind + it.id}
                    type="button"
                    className={it.kind === "thinker" ? "p" : undefined}
                    onClick={() => (it.kind === "school" ? nav.openSchool(it.id) : nav.openThinker(it.id))}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
