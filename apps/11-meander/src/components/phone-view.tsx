"use client";

// Phone (under 1024 wide): no globe, one school at a time (handoff "Phone", T8). The school screen
// follows phone.png; the overview, thinker and "Your thread" screens reuse the card's contents.
import { useEffect, useRef } from "react";
import { ledeOf, splitName, traditionOf } from "@/lib/content";
import { timelineRows } from "@/lib/timeline";
import { SchoolSections, StepInside, ThinkerSections, ThreadSections } from "./card-parts";
import { PhoneSkeleton } from "./skeleton";
import { Mark } from "./mark";
import { FieldSwitch, MenuBar } from "./menu-bar";
import { stateLabel } from "@/lib/progress";
import type { Nav } from "./meander";

export function PhoneView({ nav }: { nav: Nav }) {
  const { focus, thinker, threadOpen, inside, states, field } = nav;
  const { getSchool, getThinker, hereLine, neighbours, schools, whenOf, words } = field;
  const label = (id: string) => stateLabel(states.get(id), words.allSeen);
  /** "v" for started, "v xp" for explored: a brass ring, or filled brass. */
  const mark = (id: string) => {
    const st = states.get(id);
    return st === "explored" ? "v xp" : st === "started" ? "v" : undefined;
  };
  const school = focus ? getSchool(focus) : undefined;
  const thinkerData = focus && thinker ? getThinker(thinker) : undefined;
  const heading = useRef<HTMLHeadingElement>(null);

  // A new screen starts at the top, with keyboard focus on its heading.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = heading.current;
    if (!el || !el.getClientRects().length) return; // desktop is showing
    window.scrollTo(0, 0);
    el.focus({ preventScroll: true });
  }, [focus, thinker, threadOpen, inside, nav.view, field.id]);

  let body: React.ReactNode;
  if (threadOpen) {
    body = (
      <section className="pcard" style={{ position: "relative" }} aria-label="Your thread">
        <ThreadSections nav={nav} headingRef={heading} />
      </section>
    );
  } else if (thinkerData) {
    body = (
      <section className="pcard" aria-label={thinkerData.name}>
        <ThinkerSections thinker={thinkerData} nav={nav} headingRef={heading} />
      </section>
    );
  } else if (school && inside) {
    body = <PhoneSkeleton key={school.id} school={school} nav={nav} headingRef={heading} />;
  } else if (school) {
    const near = neighbours(school.id);
    body = (
      <>
        <i className="here" aria-hidden="true" />
        <h1 tabIndex={-1} ref={heading} aria-label={school.name}>{splitName(school.name).short}</h1>
        <p className="meta">{hereLine(school)}</p>
        {ledeOf(school) && <p className="plede">{ledeOf(school)}</p>}
        {school.themes.length > 0 && <StepInside school={school} nav={nav} />}
        {near.length > 0 && (
          <>
            <h2 className="psec">One thread away</h2>
            <ul className="near">
              {near.map((n) => {
                const v = mark(n.school.id);
                return (
                  <li key={n.school.id}>
                    <button type="button" className={v} onClick={() => nav.openSchool(n.school.id)}>
                      <i aria-hidden="true" />
                      <span>
                        <b>{n.school.name}</b>
                        <em>{n.verb}</em>
                        {n.reason && <small>{n.reason}</small>}
                        {v && <span className="sr-only">, {label(n.school.id)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <SchoolSections school={school} nav={nav} phone />
      </>
    );
  } else if (nav.view === "timeline") {
    // The phone's timeline (#41): era headings, and under each the schools in order with their span.
    const rows = timelineRows(schools, undefined, field.spans, field.eras);
    body = (
      <>
        <h1 tabIndex={-1} ref={heading} className="sr-only">{words.timelineTitle}</h1>
        {field.eras.map((e, i) => {
          const inEra = rows.filter((r) => r.era === i);
          if (!inEra.length) return null;
          return (
            <section key={e.name} className="tl-era" aria-label={e.name}>
              <h2 className="psec">{e.name}</h2>
              <ul className="field-list tlp">
                {inEra.map(({ item: s }) => {
                  const v = mark(s.id);
                  return (
                    <li key={s.id}>
                      <button type="button" className={v} onClick={() => nav.openSchool(s.id)}>
                        <i aria-hidden="true" />
                        <span>
                          <b>{s.name}</b>
                          <small>{[traditionOf(s), whenOf(s)].filter(Boolean).join(" · ")}</small>
                          {v && <span className="sr-only">, {label(s.id)}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </>
    );
  } else {
    // Overview on the phone: every school as a plain list (the globe is a laptop job).
    body = (
      <>
        <h1 tabIndex={-1} ref={heading} className="sr-only">{words.listTitle}</h1>
        {/* the menu's "Schools" names this list, so it has no heading of its own */}
        <ul className="field-list">
          {schools.map((s) => {
            const v = mark(s.id);
            return (
              <li key={s.id}>
                <button type="button" className={v} onClick={() => nav.openSchool(s.id)}>
                  <i aria-hidden="true" />
                  <span>
                    <b>{s.name}</b>
                    {traditionOf(s) && <small className="ptag">{traditionOf(s)}</small>}
                    {v && <span className="sr-only">, {label(s.id)}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <div className="phone">
      <header>
        <button type="button" className="wm" translate="no" title="Back to the whole field" aria-label="Meander, back to the whole field" onClick={nav.overview}>
          <Mark size={22} />Meander
        </button>
        <FieldSwitch nav={nav} />
      </header>
      <MenuBar nav={nav} phone />
      <main>{body}</main>
    </div>
  );
}
