"use client";

// The school skeleton (L26–L33, design P7): step inside a school and its knot opens into one thread per idea
// (left), beside the school's first page (right). Picking an idea turns its thread brass and the first page
// shows that idea. The phone gets the same content as one column (PhoneSkeleton).
import { useLayoutEffect, useRef, useState } from "react";
import { andList, schoolFacts, splitName, surnames, themeSummary, type School } from "@/lib/content";
import { EDGE, knotStrands, sideTransform } from "@/lib/knot";
import { ReadingRows } from "./card-parts";
import type { Nav } from "./meander";

const H = 900;

// shortcut: no school has a written article yet, so "Read it · about N minutes" and "Read this part" are never shown; render them from the article's word count and section anchors once articles exist.
const HAS_ARTICLE = false;

/** The first page's question: the school's first, smaller when long (P7 `data-long`). */
const askClass = (q: string) => (q.length > 70 ? "ask long" : "ask");

/** The knot: threads, beads and the idea labels, on the 1440 × 900 stage. */
export function Knot({ school, nav, tick }: { school: School; nav: Nav; tick: number }) {
  const themes = school.themes;
  const strands = knotStrands(themes.length);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Each label is shrink-wrapped to its wrapped lines, so the gap to its bead is the same on every side (P7),
  // then nudged up or down if it would come within EDGE of the top or bottom.
  const [fit, setFit] = useState<{ key: string; w: number[]; dy: number[] | null } | null>(null);
  const key = `${school.id}|${tick}`;

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || wrap.getClientRects().length === 0) return; // phone width: the knot isn't shown
    const box = wrap.getBoundingClientRect(), k = box.width / 1440 || 1;
    const labels = [...wrap.querySelectorAll<HTMLElement>(".idea")];
    if (!fit || fit.key !== key) {
      const range = document.createRange();
      const w = labels.map((el) => {
        const ink = Math.max(...[...el.querySelectorAll(".tt, small")].map((e) => {
          range.selectNodeContents(e);
          return range.getBoundingClientRect().width / k;
        }));
        const no = (el.querySelector(".no")?.getBoundingClientRect().width ?? 0) / k;
        return Math.ceil(no + 9 + ink + 26);
      });
      setFit({ key, w, dy: null });
      return;
    }
    if (fit.dy === null) {
      const dy = labels.map((el) => {
        const r = el.getBoundingClientRect(), top = (r.top - box.top) / k, bottom = (r.bottom - box.top) / k;
        return top < EDGE ? EDGE - top : bottom > H - EDGE ? H - EDGE - bottom : 0;
      });
      setFit({ ...fit, dy });
    }
  }, [key, fit]);

  const ready = fit?.key === key ? fit : null;
  return (
    <div className="knotwrap" ref={wrapRef}>
      <svg className="ov" aria-hidden="true">
        {strands.map((s, i) => (
          <path key={i} className={nav.pick === i ? "sp on" : "sp"} d={s.d} />
        ))}
        {strands.map((s, i) => (
          <circle key={i} className={nav.pick === i ? "bead on" : "bead"} cx={s.bead[0].toFixed(1)} cy={s.bead[1].toFixed(1)} r="3.5" />
        ))}
      </svg>
      <i className="knot" aria-hidden="true" />
      <ol className="ideas-k" tabIndex={-1} aria-label={`${splitName(school.name).short}: ${themes.length} ideas`}>
        {themes.map((t, i) => {
          const s = strands[i];
          const who = surnames(t.thinkers);
          return (
            <li
              key={t.name}
              className={["idea", nav.pick === i && "on", ready && "fitted"].filter(Boolean).join(" ")}
              style={{
                left: s.anchor[0].toFixed(1) + "px",
                top: (s.anchor[1] + (ready?.dy?.[i] ?? 0)).toFixed(1) + "px",
                transform: sideTransform[s.side],
                maxWidth: s.maxW,
                width: ready ? Math.min(ready.w[i], s.maxW) : undefined,
              }}
            >
              <button type="button" aria-pressed={nav.pick === i} onClick={() => nav.togglePick(i)}>
                <span className="no">{i + 1}</span>
                <span className="tt">{t.name}</span>
                {who.length > 0 && <small>{who.join(", ")}</small>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The first page (right): the school's name, its big question and the labelled facts; or the picked idea. */
export function FirstPage({ school, nav, headingRef }: { school: School; nav: Nav; headingRef?: React.Ref<HTMLHeadingElement> }) {
  const short = splitName(school.name).short;
  const q = school.questions[0];
  const facts = schoolFacts(school);
  // While the picked idea fades out, it keeps showing the last one.
  const [shown, setShown] = useState(nav.pick ?? 0);
  if (nav.pick !== null && nav.pick !== shown) setShown(nav.pick);
  const t = school.themes[shown];
  const picked = nav.pick !== null;
  const summary = t ? themeSummary(t) : "";
  const who = t ? andList(surnames(t.thinkers)) : "";
  return (
    <section className="info" aria-label={school.name}>
      <div className="school" inert={picked}>
        <div className="mid">
          <h2 className="d name" tabIndex={-1} ref={headingRef} aria-label={school.name}>{short}</h2>
          <i className="rule" aria-hidden="true" />
          {q && <p className={`d it ${askClass(q)}`}>{q}</p>}
          <dl className="fx2">
            {facts.map((f) => (
              <div key={f.label} className="fx">
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
            {/* Further reading (#39) as two more labelled lines */}
            <ReadingRows school={school} />
          </dl>
          {HAS_ARTICLE && <a className="lnk" href="#read"><u>Read it</u></a>}
        </div>
      </div>
      <div className="pk" inert={!picked}>
        {t && (
          <div className="mid" key={shown}>
            <p className="kick">Idea {shown + 1} of {school.themes.length}</p>
            <h3 className="d">{t.name}</h3>
            <i className="rule" aria-hidden="true" />
            {summary && <p className={`d it sum${summary.length > 100 ? " long" : ""}`}>{summary}</p>}
            {who && <p className="with">{who}</p>}
            <p className="row">
              {HAS_ARTICLE && <a className="lnk" href="#read"><u>Read this part</u></a>}
              <button type="button" className="lnk back" onClick={nav.stepBack}><u>Back to {short}</u></button>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/** Phone: the first page on top, then the ideas as a numbered list; tapping one opens its summary in place. */
export function PhoneSkeleton({ school, nav, headingRef }: { school: School; nav: Nav; headingRef?: React.Ref<HTMLHeadingElement> }) {
  const short = splitName(school.name).short;
  const q = school.questions[0];
  const facts = schoolFacts(school);
  return (
    <section className="pskel" aria-label={school.name}>
      <button type="button" className="up" onClick={nav.stepOut}>← Back to {short}</button>
      <h1 tabIndex={-1} ref={headingRef} aria-label={school.name}>{short}</h1>
      <i className="rule" aria-hidden="true" />
      {q && <p className="d it ask">{q}</p>}
      <dl className="fx2">
        {facts.map((f) => (
          <div key={f.label} className="fx">
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
        <ReadingRows school={school} />
      </dl>
      <h2 className="psec">{school.themes.length} big ideas</h2>
      <ol className="pideas">
        {school.themes.map((t, i) => {
          const open = nav.pick === i;
          const id = `pidea-${school.id}-${i}`;
          const who = surnames(t.thinkers);
          const summary = themeSummary(t);
          const label = (
            <>
              <span className="no">{i + 1}</span>
              <span className="tt">{t.name}</span>
              {who.length > 0 && <small>{who.join(", ")}</small>}
            </>
          );
          return (
            <li key={t.name} className={open ? "open" : undefined}>
              {summary ? (
                <>
                  <button type="button" aria-expanded={open} aria-controls={id} onClick={() => nav.togglePick(i)}>{label}</button>
                  <div id={id} className="pnote" hidden={!open}>
                    <p className="d it">{summary}</p>
                  </div>
                </>
              ) : (
                // nothing to open until the theme's text is written (T28)
                <div className="prow">{label}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
