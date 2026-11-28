"use client";

// Desktop: the whole field as one globe turned to face the focused school (handoff "Where a school
// sits", "Where a label sits"), with the card or the "Your thread" panel on the right.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { splitName, themeSummary, type Field, type Neighbour } from "@/lib/content";
import {
  FADE, FAR, R, centre, emptiest, placeLabels, project, samplePolyline, thread, vec,
  type LabelPlace, type Projected, type Rect, type ThreadPoint, type Vec3,
} from "@/lib/globe";
import { SchoolSections, ThinkerSections, ThreadSections } from "./card-parts";
import { Mark } from "./mark";
import { FieldSwitch, MenuBar } from "./menu-bar";
import { TimelineView } from "./timeline-view";
import { FirstPage, Knot } from "./skeleton";
import { stateLabel } from "@/lib/progress";
import type { Nav } from "./meander";
import { useGlobeMode } from "@/lib/globe-proto";
import { GlobeIndex, GlobeSwitch, SpinGlobe } from "./spin-globe";

const W = 1440, H = 900;
// SSR and the browser must print the same numbers, so positions are rounded to 0.1 px.
const round1 = (v: number) => Math.round(v * 10) / 10;
type Sphere = { ORDER: Record<string, number>; V: Record<string, Vec3>; facing: () => Vec3 };
const spheres = new Map<string, Sphere>();
/** Each field's schools on the sphere, its content order, and where the overview faces (its emptiest spot). */
function sphereOf(f: Field): Sphere {
  let sp = spheres.get(f.id);
  if (!sp) {
    const V: Record<string, Vec3> = Object.fromEntries(f.schools.map((s) => [s.id, vec(f.positions[s.id])]));
    let overviewFacing: Vec3 | null = null;
    sp = { ORDER: Object.fromEntries(f.schools.map((s, i) => [s.id, i])), V, facing: () => (overviewFacing ??= emptiest(Object.values(V))) };
    spheres.set(f.id, sp);
  }
  return sp;
}
// The faint "yarn" rings drawn on the globe: [flattening, rotation, opacity].
const YARN: [number, number, number][] = [[0.9, -18, 0.05], [0.46, 28, 0.045], [0.2, -54, 0.05]];

/** A label's width as drawn. A wrapped name (b.wrap) is narrower than its box, which is as wide as its max-width,
 * so it is measured line by line; other labels are as wide as their box. */
function inkWidth(el: HTMLElement, k: number): number {
  const b = el.querySelector("b");
  if (!b?.classList.contains("wrap")) return el.offsetWidth;
  const range = document.createRange();
  range.selectNodeContents(b);
  let w = range.getBoundingClientRect().width / k;
  const verb = el.querySelector("em")?.firstChild; // the verb only; its reason is hidden until hover
  if (verb) { range.selectNodeContents(verb); w = Math.max(w, range.getBoundingClientRect().width / k); }
  return Math.ceil(w);
}

type Path = { key: string; a: string; b: string; d: string; cls: string; pts: Projected[]; focus: boolean };
// rest: a school with no thread to the focus. Focus mode shows it as a faint dot with no label (feedback #16).
type Node = { id: string; name: string; label: string; p: Projected; r: number; near?: Neighbour; far: boolean; rest: boolean };

function useLayout(field: Field, focus: string | null, hasCard: boolean) {
  return useMemo(() => {
    const { schools, links, neighbours } = field;
    const { V, facing } = sphereOf(field);
    const C = centre(hasCard);
    const f = focus ? V[focus] : facing();
    const P: Record<string, Projected> = Object.fromEntries(schools.map((s) => [s.id, project(f, V[s.id], C, R)]));
    const near = new Map(focus ? neighbours(focus).map((n) => [n.school.id, n]) : []);
    const rOf = (id: string) => (id === focus ? 0 : near.has(id) ? 6 : focus ? 2.5 : P[id].theta > FAR ? 3 : 4);
    const paths: Path[] = [];
    for (const l of links) {
      const isF = l.from === focus || l.to === focus;
      const pa = P[l.from], pb = P[l.to];
      const pts = thread(f, V[l.from], V[l.to], C, R).filter(
        (p) => Math.hypot(p.x - pa.x, p.y - pa.y) > rOf(l.from) + 5 && Math.hypot(p.x - pb.x, p.y - pb.y) > rOf(l.to) + 5,
      );
      if (pts.length < 2) continue;
      const cls = ["th", isF && "focus", isF && l.type === "against" && "against", isF && l.type === "built-then-against" && "mixed", !isF && Math.max(pa.theta, pb.theta) > FAR && "far", !!focus && !isF && "rest"]
        .filter(Boolean).join(" ");
      paths.push({ key: `${l.from}-${l.to}`, a: l.from, b: l.to, d: "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L"), cls, pts, focus: isF });
    }
    // Tab order (handoff): schools one thread away first, then the others nearest first.
    const nodes: Node[] = schools
      .filter((s) => s.id !== focus)
      .map((s) => ({ id: s.id, name: s.name, label: splitName(s.name).short, p: P[s.id], r: rOf(s.id), near: near.get(s.id), far: P[s.id].theta > FAR, rest: !!focus && !near.has(s.id) }))
      .sort((a, b) => (a.near ? 0 : 1) - (b.near ? 0 : 1) || a.p.theta - b.p.theta);
    const threadPts: ThreadPoint[] = paths.filter((p) => !focus || p.focus).flatMap((p) => samplePolyline(p.pts, p.focus ? 14 : 1));
    return { C, paths, nodes, threadPts };
  }, [field, focus, hasCard]);
}

export function GlobeView({ nav }: { nav: Nav }) {
  const { focus, thinker, threadOpen, inside, pick, states, view, field } = nav;
  const { getSchool, getThinker, links, metaLine, words } = field;
  const { ORDER } = sphereOf(field);
  const timeline = view === "timeline";
  const hasCard = !!focus || threadOpen;
  const showThinker = !!focus && !!thinker && !threadOpen;
  const { C, paths, nodes, threadPts } = useLayout(field, focus, hasCard);
  const school = focus ? getSchool(focus) : undefined;
  const thinkerData = thinker ? getThinker(thinker) : undefined;

  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleH1 = useRef<HTMLHeadingElement>(null);
  const satRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const thinkerH = useRef<HTMLHeadingElement>(null);
  const threadH = useRef<HTMLHeadingElement>(null);
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());
  const enterRef = useRef<HTMLButtonElement>(null);
  // Phase 5 prototype (L62): the flat globe, or a real one you spin (A with a light overview, B pure).
  const [gmode, setGmode] = useGlobeMode();
  const spin = gmode !== "flat";
  const [litIds, setLitIds] = useState<Set<string> | null>(null);
  const [turnTo, setTurnTo] = useState<{ v: Vec3; n: number } | null>(null);

  // Re-place labels when fonts arrive or the window changes (e.g. from phone width to desktop).
  const [tick, setTick] = useState(0);
  // After a click turns the globe, a new label can land under the resting pointer; no hover look until it moves.
  const [still, setStill] = useState(false);
  // Overview only: hovering or focusing a school lights its own threads and its neighbours' names (L20).
  const [hovered, setHovered] = useState<string | null>(null);
  const hoverId = focus ? null : hovered;
  const lit = useMemo(() => {
    if (!hoverId) return null;
    const ids = new Set([hoverId]);
    for (const l of links) if (l.from === hoverId) ids.add(l.to); else if (l.to === hoverId) ids.add(l.from);
    return ids;
  }, [hoverId, links]);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setTick((t) => t + 1));
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => { alive = false; window.removeEventListener("resize", onResize); };
  }, []);

  const key = `${field.id}|${focus}|${hasCard}|${showThinker ? thinker : ""}|${threadOpen}|${nav.openTheme}`;
  const [placed, setPlaced] = useState<{ key: string; map: Record<string, LabelPlace>; ko: Rect[]; fade: { cx: number; cy: number; rx: number; ry: number } | null; under: Set<string>; clear: Rect | null } | null>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || stage.getClientRects().length === 0) return; // hidden at phone width
    // Inside a school the globe is zoomed and hidden; its labels keep their places for the way back out.
    if (stage.classList.contains("inside")) return;
    const s = stage.getBoundingClientRect(), k = s.width / W;
    const rectOf = (el: Element | null): Rect | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
    };
    const satRect = rectOf(satRef.current);
    // The title as drawn: its box is as wide as its max-width when the date line wraps, which kept names away
    // from empty space and pushed one past the rim (#31).
    const titleInk = (() => {
      const el = titleRef.current;
      if (!el) return null;
      const range = document.createRange();
      const rs = [...el.querySelectorAll(":scope > .here, :scope > h1, :scope > p")].map((c) => {
        if (c.tagName === "I") return c.getBoundingClientRect();
        range.selectNodeContents(c);
        return range.getBoundingClientRect();
      });
      const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top));
      return { x: (l - s.left) / k, y: (t - s.top) / k, w: (Math.max(...rs.map((r) => r.right)) - l) / k, h: (Math.max(...rs.map((r) => r.bottom)) - t) / k };
    })();
    const fixed = [rectOf(headerRef.current), titleInk, satRect, rectOf(cardRef.current)].filter((r): r is Rect => !!r);
    // Schools at rest get no label, so they take no space from the neighbours' labels.
    const boxW: Record<string, number> = {};
    const inputs = nodes.filter((n) => !n.rest).map((n) => {
      const el = labelRefs.current.get(n.id);
      boxW[n.id] = el?.offsetWidth ?? 0;
      // ties keep the content's order, as in the design's runtime
      return { id: n.id, x: n.p.x, y: n.p.y, r: n.r, pref: n.p.out, ord: (n.near ? 0 : Math.round(n.p.theta)) + ORDER[n.id] * 1e-4, w: el ? inkWidth(el, k) : 0, h: el?.offsetHeight ?? 0 };
    });
    const map = placeLabels(inputs, fixed, threadPts, C, R, W, H, field.dense ? 4 : 6);
    // A wrapped name's box is wider than its lines; shift the box so the lines sit where the placer put them.
    for (const [id, pl] of Object.entries(map)) {
      const extra = boxW[id] - pl.rect.w;
      if (extra > 0.5) pl.left -= pl.text === "right" ? extra : pl.text === "center" ? extra / 2 : 0;
    }
    const ko = Object.values(map).map((p) => p.rect).concat(satRect ? [satRect] : []);
    // Threads from the focus fade out inside an oval round the title (and the thinker hanging under it);
    // the design's 186 × 86 is the minimum, a title on two lines gets a taller one.
    const t = rectOf(titleRef.current);
    const box = t && satRect ? { x: Math.min(t.x, satRect.x), y: t.y, w: Math.max(t.x + t.w, satRect.x + satRect.w) - Math.min(t.x, satRect.x), h: satRect.y + satRect.h - t.y } : t;
    const fade = box ? { cx: C[0], cy: box.y + box.h / 2, rx: Math.max(FADE.rx, box.w / 2 + 40), ry: Math.max(FADE.ry, box.h / 2 + 22) } : null;
    // A faint dot at rest that lands under a neighbour's label or the title is left out.
    const covers = ko.concat(t ? [t] : []);
    const under = new Set(nodes.filter((n) => n.rest && covers.some((r) => n.p.x > r.x - 8 && n.p.x < r.x + r.w + 8 && n.p.y > r.y - 8 && n.p.y < r.y + r.h + 8)).map((n) => n.id));
    // The oval fades threads round the title, but a wide or wrapped date line reaches past it; every line of the
    // title is knocked out too, at its measured width, so no thread crosses its text.
    const titleLines: Rect[] = [];
    const tEl = titleRef.current;
    if (tEl) {
      const range = document.createRange();
      for (const el of tEl.querySelectorAll(":scope > h1, :scope > p")) {
        range.selectNodeContents(el);
        for (const r of range.getClientRects()) {
          if (r.width > 1) titleLines.push({ x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k });
        }
      }
    }
    // Dense fields (music, L56): threads from the focus stop short of the whole title block, not only its text lines.
    const clear = field.dense && focus && box ? { x: box.x - 18, y: box.y - 14, w: box.w + 36, h: box.h + 28 } : null;
    setPlaced({ key, map, ko: ko.concat(titleLines), fade, under, clear });
  }, [key, tick, nodes, threadPts, C, ORDER, field.dense, focus]);

  // Move keyboard focus to what just opened, so Tab continues from there into the card.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    // On the timeline the clicked bar keeps keyboard focus, so arrow keys carry on along the bars.
    const el = threadOpen ? threadH.current : showThinker ? thinkerH.current : focus && !timeline ? titleH1.current : null;
    if (el && el.getClientRects().length) el.focus({ preventScroll: true });
  }, [focus, showThinker, thinker, threadOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- runs on what opened, not on a view switch

  // Stepping inside and back: keyboard focus follows (the list of ideas in, so Tab reaches idea 1 next, the "step inside" button out, the idea
  // just closed when its Back button had focus), and the live region says where you are.
  const said = inside && school
    ? pick !== null && school.themes[pick]
      ? `${words.ideaKick} ${pick + 1} of ${school.themes.length}: ${school.themes[pick].name}. ${themeSummary(school.themes[pick])}`
      : `Inside ${splitName(school.name).short}: ${school.themes.length} ${words.ideas}`
    : "";
  const was = useRef({ inside, pick, focus });
  useEffect(() => {
    const prev = was.current;
    was.current = { inside, pick, focus };
    const stage = stageRef.current;
    if (!stage || !stage.getClientRects().length || !school || prev.focus !== focus) return;
    const ideaBtn = (i: number) => stage.querySelectorAll<HTMLButtonElement>(".idea > button")[i];
    if (inside && !prev.inside) stage.querySelector<HTMLElement>(".ideas-k")?.focus({ preventScroll: true });
    else if (!inside && prev.inside) (timeline ? stage.querySelector<HTMLElement>(`.tb[data-id="${focus}"]`) : enterRef.current)?.focus({ preventScroll: true });
    else if (inside && pick === null && prev.pick !== null && !document.activeElement?.closest(".idea")) ideaBtn(prev.pick)?.focus({ preventScroll: true });
  }, [inside, pick, focus, school]); // eslint-disable-line react-hooks/exhaustive-deps -- the view only picks where focus lands

  const ready = placed?.key === key ? placed : null;
  const whyNode = (() => {
    const n = focus && hovered ? nodes.find((m) => m.id === hovered && m.near) : undefined;
    const text = n?.near ? n.near.link.reason || n.near.reason : "";
    return n && text ? { label: n.label, text } : null;
  })();

  const titleEl = (
    school && (
            // The whole title steps inside on a click; keyboard users get the "step inside" button under it.
            <div className={showThinker || !school.themes.length ? "title" : "title can-enter"} ref={titleRef} style={{ left: C[0], top: C[1] }} onClick={showThinker ? undefined : nav.stepInside}>
              <i className="here" aria-hidden="true" />
              <h1 tabIndex={-1} ref={titleH1} aria-label={school.name}>{splitName(school.name).short}</h1>
              <p>
                {metaLine(school)}
                {!showThinker && school.themes.length > 0 ? (
                  <> · <button type="button" className="enter" ref={enterRef} onClick={(e) => { e.stopPropagation(); nav.stepInside(); }}>step inside</button></>
                ) : (
                  " · you are here"
                )}
              </p>
              {/* The open thinker hangs under the title on a short brass thread, however tall the title is. */}
              {showThinker && thinkerData && (
                <div className="sat" ref={satRef} aria-hidden="true">
                  <i />{thinkerData.name}
                </div>
              )}
            </div>
          )
  );

  const onStageClick = (e: React.MouseEvent) => {
    if (inside) return;
    if ((e.target as Element).closest("button, .card, .title, .sat")) return;
    if (focus || threadOpen) nav.overview();
  };

  return (
    <div className="desk">
      {/* Clicking empty space returns to the overview; Esc and the logo do the same for keyboard users. */}
      <div
        className={["stage", timeline && "tl", still && "still", lit && "hovering", field.dense && showThinker && "sat-open", inside && school && "inside", inside && pick !== null && "has-pick"].filter(Boolean).join(" ")}
        ref={stageRef}
        onClick={onStageClick}
        onMouseMove={still ? () => setStill(false) : undefined}
        data-cx={C[0]}
        data-cy={C[1]}
        data-r={R}
      >
        {spin ? (
          <SpinGlobe
            key={field.id}
            field={field} mode={gmode as "a" | "b"} focus={focus} states={states} onOpen={(id) => { setLitIds(null); nav.openSchool(id); }}
            C={C} R={R} W={W} H={H} inert={inside || timeline} litIds={focus ? null : litIds} turnTo={turnTo} idPrefix="desk"
            fixed={[{ x: 0, y: 0, w: W, h: 84 }, ...(hasCard ? [{ x: 990, y: 0, w: 450, h: H }] : []), ...(gmode === "a" && !hasCard ? [{ x: 30, y: 96, w: 270, h: 780 }] : [])]}
          >
            {titleEl}
          </SpinGlobe>
        ) : (
        <>
        {/* The globe zooms into the focused school when you step inside (P7: about 560 ms). */}
        <div className="globe">
        <svg className="threads" aria-hidden="true">
          <defs>
            <radialGradient id="lit" cx="34%" cy="28%" r="78%">
              <stop offset="0" stopColor="#e9e2d4" stopOpacity=".085" />
              <stop offset=".55" stopColor="#e9e2d4" stopOpacity=".025" />
              <stop offset="1" stopColor="#e9e2d4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="fade">
              <stop offset="0" stopColor="#000" />
              <stop offset=".58" stopColor="#000" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={C[0]} cy={C[1]} r={R} fill="url(#lit)" />
          <g className="yarn">
            {YARN.map(([fl, ro, o]) => (
              <ellipse key={ro} cx={C[0]} cy={C[1]} rx={R} ry={R * fl} transform={`rotate(${ro} ${C[0]} ${C[1]})`} strokeOpacity={o} />
            ))}
            <circle cx={C[0]} cy={C[1]} r={R} strokeOpacity=".1" />
          </g>
          <mask id="ko" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <rect width={W} height={H} fill="#fff" />
            {focus && ready?.fade && (
              <ellipse cx={ready.fade.cx} cy={ready.fade.cy} rx={ready.fade.rx} ry={ready.fade.ry} fill="url(#fade)" />
            )}
            {ready?.clear && <rect x={ready.clear.x} y={ready.clear.y} width={ready.clear.w} height={ready.clear.h} rx="22" fill="#000" />}
            {ready?.ko.map((p, i) => (
              <rect key={i} x={p.x - 5} y={p.y - 3} width={p.w + 10} height={p.h + 6} rx="6" fill="#000" />
            ))}
          </mask>
          <g mask="url(#ko)">
            {paths.map((p) => <path key={p.key} className={lit && (p.a === hoverId || p.b === hoverId) ? `${p.cls} lit` : p.cls} d={p.d} />)}
          </g>
        </svg>


        <main inert={inside || timeline}>
          {nodes.map((n) => {
            const st = states.get(n.id);
            const v = st === "started" || st === "explored";
            const pl = ready?.map[n.id];
            const cls = ["n", n.near && "t1", n.far && "back2", n.rest && "rest", ready?.under.has(n.id) && "under", v && "v", st === "explored" && "xp", lit?.has(n.id) && "lit"].filter(Boolean).join(" ");
            return (
              <button key={n.id} type="button" className={cls} style={{ left: round1(n.p.x), top: round1(n.p.y) }} onClick={() => { setStill(true); setHovered(null); nav.openSchool(n.id); }}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered((h) => (h === n.id ? null : h))}
                data-id={n.id}
                aria-label={n.rest ? `${n.name}${v ? `, ${stateLabel(st, words.allSeen)}` : ""}` : undefined}
              >
                <i className="dot" style={{ width: 2 * n.r, height: 2 * n.r }} />
                <span
                  className={pl ? "lb placed" : "lb"}
                  ref={(el) => { if (el) labelRefs.current.set(n.id, el); else labelRefs.current.delete(n.id); }}
                  style={pl ? { left: pl.left, top: pl.top, alignItems: pl.align, textAlign: pl.text } : undefined}
                >
                  {/* name first, then what it did, so it reads as a sentence: "Marxism / inspired it" (#23) */}
                  <b className={n.label.length > 20 ? "wrap" : undefined}>{n.label}</b>
                  {n.near && <em>{n.near.verb}</em>}
                  {n.near && (n.near.link.reason || n.near.reason) && <span className="sr-only">: {n.near.link.reason || n.near.reason}</span>}
                  {v && <span className="sr-only">, {stateLabel(st, words.allSeen)}</span>}
                </span>
              </button>
            );
          })}
          {titleEl}
        </main>
        </div>
        </>
        )}
        {gmode === "a" && !hasCard && !timeline && !inside && (
          <GlobeIndex field={field} states={states} onLight={setLitIds} onOpen={(id) => { setLitIds(null); nav.openSchool(id); }} onTurn={(v) => setTurnTo((t) => ({ v, n: (t?.n ?? 0) + 1 }))} />
        )}
        <GlobeSwitch mode={gmode} setMode={setGmode} />

        <TimelineView nav={nav} hasCard={hasCard} tick={tick} />

        <header ref={headerRef}>
          <button type="button" className="wm" translate="no" title="Back to the whole field" aria-label="Meander, back to the whole field" onClick={nav.overview}>
            <Mark />Meander
          </button>
          <FieldSwitch nav={nav} />
          <MenuBar nav={nav} />
        </header>

        {school && !showThinker && school.themes.length > 0 && (
          <div className="skel" inert={!inside}>
            {/* the globe's lines dim to nothing behind the knot and the first page */}
            <div className="pool" aria-hidden="true" />
            <div className="veil" aria-hidden="true" />
            <Knot key={school.id} school={school} nav={nav} tick={tick} />
            <FirstPage key={`p-${school.id}`} school={school} nav={nav} />
          </div>
        )}
        <p className="sr-only" aria-live="polite">{said}</p>
        {/* F2 (L56): a hovered or focused neighbour's full reason, one quiet line under the globe, clear of every label */}
        {whyNode && !inside && !timeline && (
          <p className="why-line" style={{ left: C[0] }} aria-hidden="true">
            <b>{whyNode.label}</b> {whyNode.text}
          </p>
        )}

        {threadOpen ? (
          <aside className="card" id="thread-panel" aria-label="Your thread" ref={cardRef}>
            <ThreadSections nav={nav} headingRef={threadH} />
          </aside>
        ) : showThinker && thinkerData ? (
          <aside className="card" key={`t-${thinker}`} aria-label={thinkerData.name} ref={cardRef}>
            <ThinkerSections thinker={thinkerData} nav={nav} headingRef={thinkerH} />
          </aside>
        ) : school ? (
          <aside className="card" key={`s-${focus}`} aria-label={school.name} ref={cardRef} inert={inside}>
            <SchoolSections school={school} nav={nav} titled={timeline} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
