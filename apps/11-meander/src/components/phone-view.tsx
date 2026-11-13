"use client";

// Phone (under 1024 wide): no globe, one school at a time (handoff "Phone", T8). The school screen
// follows phone.png; the overview, thinker and "Your thread" screens reuse the card's contents.
import { useEffect, useMemo, useRef } from "react";
import { getSchool, getThinker, hereLine, ledeOf, neighbours, schools, splitName } from "@/lib/content";
import { visitedSchools } from "@/lib/visits";
import { SchoolSections, ThinkerSections, ThreadSections } from "./card-parts";
import { Mark } from "./mark";
import type { Nav } from "./meander";

export function PhoneView({ nav }: { nav: Nav }) {
  const { focus, thinker, threadOpen, visits } = nav;
  const visited = useMemo(() => visitedSchools(visits), [visits]);
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
  }, [focus, thinker, threadOpen]);

  let body: React.ReactNode;
  if (threadOpen) {
    body = (
      <section className="pcard" style={{ position: "relative" }} aria-label="Your thread">
        <ThreadSections visits={visits} nav={nav} headingRef={heading} />
      </section>
    );
  } else if (thinkerData) {
    body = (
      <section className="pcard" aria-label={thinkerData.name}>
        <ThinkerSections thinker={thinkerData} nav={nav} headingRef={heading} />
      </section>
    );
  } else if (school) {
    const near = neighbours(school.id);
    body = (
      <>
        <i className="here" aria-hidden="true" />
        <h1 tabIndex={-1} ref={heading} aria-label={school.name}>{splitName(school.name).short}</h1>
        <p className="meta">{hereLine(school)}</p>
        {ledeOf(school) && <p className="plede">{ledeOf(school)}</p>}
        {near.length > 0 && (
          <>
            <h2 className="psec">One thread away</h2>
            <ul className="near">
              {near.map((n) => {
                const v = visited.has(n.school.id);
                return (
                  <li key={n.school.id}>
                    <button type="button" className={v ? "v" : undefined} onClick={() => nav.openSchool(n.school.id)}>
                      <i aria-hidden="true" />
                      <span>
                        <em>{n.verb}</em>
                        <b>{n.school.name}</b>
                        {n.link.label && <small>{n.link.label}</small>}
                        {v && <span className="sr-only">, visited</span>}
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
  } else {
    // Overview on the phone: every school as a plain list (the globe is a laptop job).
    body = (
      <>
        <h1 tabIndex={-1} ref={heading} className="sr-only">Schools of philosophy</h1>
        <h2 className="psec">Schools</h2>
        <ul className="field-list">
          {schools.map((s) => {
            const v = visited.has(s.id);
            return (
              <li key={s.id}>
                <button type="button" className={v ? "v" : undefined} onClick={() => nav.openSchool(s.id)}>
                  <i aria-hidden="true" />
                  <span>
                    <b>{s.name}</b>
                    {v && <span className="sr-only">, visited</span>}
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
        {visits.length > 0 && (
          <button type="button" className="ytp" aria-expanded={threadOpen} onClick={nav.toggleThread}>Your thread</button>
        )}
      </header>
      <main>{body}</main>
    </div>
  );
}
