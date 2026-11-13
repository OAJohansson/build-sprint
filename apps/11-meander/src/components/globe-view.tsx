"use client";

// Desktop: the whole field as one globe turned to face the focused school (handoff "Where a school
// sits", "Where a label sits"), with the card or the "Your thread" panel on the right.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getSchool, getThinker, hereLine, links, neighbours, positions, schools, splitName, type Neighbour } from "@/lib/content";
import {
  FADE, FAR, R, centre, emptiest, placeLabels, project, samplePolyline, thread, vec,
  type LabelPlace, type Projected, type Rect, type ThreadPoint, type Vec3,
} from "@/lib/globe";
import { visitedSchools } from "@/lib/visits";
import { SchoolSections, ThinkerSections, ThreadSections } from "./card-parts";
import { Mark } from "./mark";
import type { Nav } from "./meander";

const W = 1440, H = 900;
// SSR and the browser must print the same numbers, so positions are rounded to 0.1 px.
const round1 = (v: number) => Math.round(v * 10) / 10;
const ORDER: Record<string, number> = Object.fromEntries(schools.map((s, i) => [s.id, i]));
const V: Record<string, Vec3> = Object.fromEntries(schools.map((s) => [s.id, vec(positions[s.id])]));
let overviewFacing: Vec3 | null = null;
const facing = () => (overviewFacing ??= emptiest(Object.values(V)));
// The faint "yarn" rings drawn on the globe: [flattening, rotation, opacity].
const YARN: [number, number, number][] = [[0.9, -18, 0.05], [0.46, 28, 0.045], [0.2, -54, 0.05]];

type Path = { key: string; a: string; b: string; d: string; cls: string; pts: Projected[]; focus: boolean };
type Node = { id: string; name: string; label: string; p: Projected; r: number; near?: Neighbour; far: boolean };

function useLayout(focus: string | null, hasCard: boolean) {
  return useMemo(() => {
    const C = centre(hasCard);
    const f = focus ? V[focus] : facing();
    const P: Record<string, Projected> = Object.fromEntries(schools.map((s) => [s.id, project(f, V[s.id], C, R)]));
    const near = new Map(focus ? neighbours(focus).map((n) => [n.school.id, n]) : []);
    const rOf = (id: string) => (id === focus ? 0 : near.has(id) ? 6 : P[id].theta > FAR ? 3 : 4);
    const paths: Path[] = [];
    for (const l of links) {
      const isF = l.from === focus || l.to === focus;
      const pa = P[l.from], pb = P[l.to];
      const pts = thread(f, V[l.from], V[l.to], C, R).filter(
        (p) => Math.hypot(p.x - pa.x, p.y - pa.y) > rOf(l.from) + 5 && Math.hypot(p.x - pb.x, p.y - pb.y) > rOf(l.to) + 5,
      );
      if (pts.length < 2) continue;
      const cls = ["th", isF && "focus", isF && l.type === "against" && "against", isF && l.type === "built-then-against" && "mixed", !isF && Math.max(pa.theta, pb.theta) > FAR && "far"]
        .filter(Boolean).join(" ");
      paths.push({ key: `${l.from}-${l.to}`, a: l.from, b: l.to, d: "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L"), cls, pts, focus: isF });
    }
    // Tab order (handoff): schools one thread away first, then the others nearest first.
    const nodes: Node[] = schools
      .filter((s) => s.id !== focus)
      .map((s) => ({ id: s.id, name: s.name, label: splitName(s.name).short, p: P[s.id], r: rOf(s.id), near: near.get(s.id), far: P[s.id].theta > FAR }))
      .sort((a, b) => (a.near ? 0 : 1) - (b.near ? 0 : 1) || a.p.theta - b.p.theta);
    const threadPts: ThreadPoint[] = paths.flatMap((p) => samplePolyline(p.pts, p.focus ? 14 : 1));
    return { C, paths, nodes, threadPts };
  }, [focus, hasCard]);
}

export function GlobeView({ nav }: { nav: Nav }) {
  const { focus, thinker, threadOpen, visits } = nav;
  const hasCard = !!focus || threadOpen;
  const showThinker = !!focus && !!thinker && !threadOpen;
  const { C, paths, nodes, threadPts } = useLayout(focus, hasCard);
  const visited = useMemo(() => visitedSchools(visits), [visits]);
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
  }, [hoverId]);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setTick((t) => t + 1));
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => { alive = false; window.removeEventListener("resize", onResize); };
  }, []);

  const key = `${focus}|${hasCard}|${showThinker ? thinker : ""}|${threadOpen}|${nav.openTheme}|${visits.length > 0}`;
  const [placed, setPlaced] = useState<{ key: string; map: Record<string, LabelPlace>; ko: Rect[]; fade: { cx: number; cy: number; rx: number; ry: number } | null } | null>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || stage.getClientRects().length === 0) return; // hidden at phone width
    const s = stage.getBoundingClientRect(), k = s.width / W;
    const rectOf = (el: Element | null): Rect | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
    };
    const satRect = rectOf(satRef.current);
    const fixed = [rectOf(headerRef.current), rectOf(titleRef.current), satRect, rectOf(cardRef.current)].filter((r): r is Rect => !!r);
    const inputs = nodes.map((n) => {
      const el = labelRefs.current.get(n.id);
      // ties keep the content's order, as in the design's runtime
      return { id: n.id, x: n.p.x, y: n.p.y, r: n.r, pref: n.p.out, ord: (n.near ? 0 : Math.round(n.p.theta)) + ORDER[n.id] * 1e-4, w: el?.offsetWidth ?? 0, h: el?.offsetHeight ?? 0 };
    });
    const map = placeLabels(inputs, fixed, threadPts, C, R, W, H);
    const ko = Object.values(map).map((p) => p.rect).concat(satRect ? [satRect] : []);
    // Threads from the focus fade out inside an oval round the title (and the thinker hanging under it);
    // the design's 186 × 86 is the minimum, a title on two lines gets a taller one.
    const t = rectOf(titleRef.current);
    const box = t && satRect ? { x: Math.min(t.x, satRect.x), y: t.y, w: Math.max(t.x + t.w, satRect.x + satRect.w) - Math.min(t.x, satRect.x), h: satRect.y + satRect.h - t.y } : t;
    const fade = box ? { cx: C[0], cy: box.y + box.h / 2, rx: Math.max(FADE.rx, box.w / 2 + 40), ry: Math.max(FADE.ry, box.h / 2 + 22) } : null;
    setPlaced({ key, map, ko, fade });
  }, [key, tick, nodes, threadPts, C]);

  // Move keyboard focus to what just opened, so Tab continues from there into the card.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = threadOpen ? threadH.current : showThinker ? thinkerH.current : focus ? titleH1.current : null;
    if (el && el.getClientRects().length) el.focus({ preventScroll: true });
  }, [focus, showThinker, thinker, threadOpen]);

  const ready = placed?.key === key ? placed : null;

  const onStageClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("button, .card, .title, .sat")) return;
    if (focus || threadOpen) nav.overview();
  };

  return (
    <div className="desk">
      {/* Clicking empty space returns to the overview; Esc and the logo do the same for keyboard users. */}
      <div
        className={["stage", still && "still", lit && "hovering"].filter(Boolean).join(" ")}
        ref={stageRef}
        onClick={onStageClick}
        onMouseMove={still ? () => setStill(false) : undefined}
        data-cx={C[0]}
        data-cy={C[1]}
        data-r={R}
      >
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
            {ready?.ko.map((p, i) => (
              <rect key={i} x={p.x - 5} y={p.y - 3} width={p.w + 10} height={p.h + 6} rx="6" fill="#000" />
            ))}
          </mask>
          <g mask="url(#ko)">
            {paths.map((p) => <path key={p.key} className={lit && (p.a === hoverId || p.b === hoverId) ? `${p.cls} lit` : p.cls} d={p.d} />)}
          </g>
        </svg>

        <header ref={headerRef}>
          <button type="button" className="wm" translate="no" title="Back to the whole field" aria-label="Meander, back to the whole field" onClick={nav.overview}>
            <Mark />Meander
          </button>
          {visits.length > 0 && (
            <button type="button" className="yt" aria-expanded={threadOpen} aria-controls="thread-panel" onClick={nav.toggleThread}>
              <i />Your thread
            </button>
          )}
        </header>

        <main>
          {nodes.map((n) => {
            const v = visited.has(n.id);
            const pl = ready?.map[n.id];
            const cls = ["n", n.near && "t1", n.far && "back2", v && "v", lit?.has(n.id) && "lit"].filter(Boolean).join(" ");
            return (
              <button key={n.id} type="button" className={cls} style={{ left: round1(n.p.x), top: round1(n.p.y) }} onClick={() => { setStill(true); setHovered(null); nav.openSchool(n.id); }}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered((h) => (h === n.id ? null : h))}
                data-id={n.id}
              >
                <i className="dot" style={{ width: 2 * n.r, height: 2 * n.r }} />
                <span
                  className={pl ? "lb placed" : "lb"}
                  ref={(el) => { if (el) labelRefs.current.set(n.id, el); else labelRefs.current.delete(n.id); }}
                  style={pl ? { left: pl.left, top: pl.top, alignItems: pl.align, textAlign: pl.text } : undefined}
                >
                  {n.near && (
                    <em>
                      {n.near.verb}
                      {/* the link's reason, on hover or keyboard focus only (L20) */}
                      {n.near.link.label && <span className="why">· {n.near.link.label}</span>}
                    </em>
                  )}
                  <b className={n.label.length > 20 ? "wrap" : undefined}>{n.label}</b>
                  {v && <span className="sr-only">, visited</span>}
                </span>
              </button>
            );
          })}
          {school && (
            <div className="title" ref={titleRef} style={{ left: C[0], top: C[1] }}>
              <i className="here" aria-hidden="true" />
              <h1 tabIndex={-1} ref={titleH1} aria-label={school.name}>{splitName(school.name).short}</h1>
              <p>{hereLine(school)}</p>
              {/* The open thinker hangs under the title on a short brass thread, however tall the title is. */}
              {showThinker && thinkerData && (
                <div className="sat" ref={satRef} aria-hidden="true">
                  <i />{thinkerData.name}
                </div>
              )}
            </div>
          )}
        </main>

        {threadOpen ? (
          <aside className="card" id="thread-panel" aria-label="Your thread" ref={cardRef}>
            <ThreadSections visits={visits} nav={nav} headingRef={threadH} />
          </aside>
        ) : showThinker && thinkerData ? (
          <aside className="card" key={`t-${thinker}`} aria-label={thinkerData.name} ref={cardRef}>
            <ThinkerSections thinker={thinkerData} nav={nav} headingRef={thinkerH} />
          </aside>
        ) : school ? (
          <aside className="card" key={`s-${focus}`} aria-label={school.name} ref={cardRef}>
            <SchoolSections school={school} nav={nav} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
