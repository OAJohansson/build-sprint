"use client";

// The timeline (#41, desktop): the same schools laid out in time on the 1440 × 900 stage, earliest at the top left,
// one row each so nothing overlaps. Hover or focus shows a school's links as quiet bone curves (L31: brass only for
// the current one); a click opens the school's card, as on the globe.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { splitName, traditionOf, type School } from "@/lib/content";
import { makeScale, timelineRows, yearLabel, type RawSpan } from "@/lib/timeline";

// Dev only (break-ui): ?timeline=worst adds a school spanning nearly everything and gives one school a very long name.
const WORST: Record<string, RawSpan> = { "worst-everything": { from: -600, to: "present" } };
const worstSchools = (schools: School[]) => [
  ...schools.map((s) => (s.id === "feminist-philosophy" ? { ...s, name: "The Very Long School of Post-Analytic Neo-Pragmatist Phenomenological Hermeneutics (Second Wave)" } : s)),
  { ...schools[0], id: "worst-everything", name: "Perennial Philosophy Across Every Tradition", dates: "c. 600 BCE–present" },
];
import { stateLabel } from "@/lib/progress";
import type { Nav } from "./meander";

const X0 = 70;
/** The axis ends at the stage's right edge, or before the card when one is open. */
const X1_FULL = 1370, X1_CARD = 950;
const TOP = 150, BOTTOM = 800;
const GAP = 12;

type Side = "after" | "before" | "on";

export function TimelineView({ nav, hasCard, tick }: { nav: Nav; hasCard: boolean; tick: number }) {
  const { focus, states, field } = nav;
  const { links, schools, whenOf, words, spans, eras, ticks: TICKS } = field;
  const x1 = hasCard ? X1_CARD : X1_FULL;
  const [worst, setWorst] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the dev-only flag after hydration
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).get("timeline") === "worst") setWorst(true);
  }, []);
  const rows = useMemo(
    () => (worst ? timelineRows(worstSchools(schools), undefined, { ...spans, ...WORST }, eras) : timelineRows(schools, undefined, spans, eras)),
    [worst, schools, spans, eras],
  );
  const { scale, bands, end } = useMemo(() => makeScale(X0, x1, undefined, eras), [x1, eras]);
  const rowH = Math.min(30, (BOTTOM - TOP) / Math.max(1, rows.length));
  const y = (i: number) => TOP + rowH * (i + 0.5);
  const geo = useMemo(
    () => rows.map((r) => {
      const xs = scale(r.span.from), xe = Math.max(scale(r.span.to), xs + 3);
      return { xs, xe, xr: r.span.roots != null ? scale(r.span.roots) : null, xt: r.span.tail != null ? scale(r.span.tail) : null };
    }),
    [rows, scale],
  );

  // Each name sits after its bar when it fits, else before it, else on the bar (a span that covers nearly everything).
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());
  const [sides, setSides] = useState<{ key: string; map: Record<string, Side> } | null>(null);
  const key = `${field.id}|${x1}|${tick}`;
  useLayoutEffect(() => {
    const map: Record<string, Side> = {};
    const right = hasCard ? 995 : 1415;
    rows.forEach((r, i) => {
      const w = labelRefs.current.get(r.item.id)?.scrollWidth ?? 0; // full width, even when capped on the bar
      const g = geo[i];
      // a living tradition's name sits after its solid part, over the faint tail (knocked out behind the text)
      map[r.item.id] = g.xe + GAP + w <= right ? "after" : g.xs - GAP - w >= 24 ? "before" : "on";
    });
    setSides({ key, map });
  }, [key, rows, geo, hasCard]);
  const placed = sides?.key === key ? sides.map : null;

  // The current school: the one under the pointer or keyboard, else the open one.
  const [hovered, setHovered] = useState<string | null>(null);
  const cur = hovered ?? focus;
  const index = useMemo(() => new Map(rows.map((r, i) => [r.item.id, i])), [rows]);
  const curLinks = useMemo(
    () => (cur ? links.filter((l) => (l.from === cur || l.to === cur) && index.has(l.from) && index.has(l.to)) : []),
    [cur, index, links],
  );
  const lit = new Set(curLinks.flatMap((l) => [l.from, l.to]));

  /** A link drawn from the older school, at the moment the newer one starts (or its end, if it was over by then). */
  const curve = (from: string, to: string) => {
    const a = index.get(from)!, b = index.get(to)!;
    const ga = geo[a], gb = geo[b];
    const xA = Math.min(Math.max(gb.xs, ga.xs), ga.xt ?? ga.xe), yA = y(a);
    const xB = gb.xs, yB = y(b);
    // one soft bow out to the left, so a link between schools that start close together still reads as a thread
    const bow = 14 + Math.abs(yB - yA) * 0.18;
    const cx = Math.min(xA, xB) - bow, cy = (yA + yB) / 2;
    return `M${xA.toFixed(1)} ${yA.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${xB.toFixed(1)} ${yB.toFixed(1)}`;
  };

  // Arrow keys move along the bars in time order (Tab does too).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(e.key in keys) && e.key !== "Home" && e.key !== "End") return;
    const btns = [...e.currentTarget.querySelectorAll<HTMLButtonElement>(".tb")];
    const at = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    const next = e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : Math.min(btns.length - 1, Math.max(0, at + keys[e.key]));
    btns[next]?.focus();
    e.preventDefault();
  };

  return (
    <div className={["timeline", cur && "has-cur"].filter(Boolean).join(" ")} inert={nav.view !== "timeline" || nav.inside}>
      <h1 className="sr-only">{words.timelineTitle}</h1>
      <svg className="tl-svg" aria-hidden="true">
        {bands.map((b, i) => (
          <g key={b.name}>
            {i % 2 === 1 && <rect x={b.x} y={TOP - 40} width={b.w} height={BOTTOM - TOP + 50} className="band" />}
            {i > 0 && <line x1={b.x} x2={b.x} y1={TOP - 40} y2={BOTTOM + 10} className="div" />}
          </g>
        ))}
        <line x1={X0} x2={x1} y1={BOTTOM + 10} y2={BOTTOM + 10} className="axis" />
        {TICKS.filter((t) => t <= end).map((t) => (
          <line key={t} x1={scale(t)} x2={scale(t)} y1={BOTTOM + 10} y2={BOTTOM + 16} className="axis" />
        ))}
        {curLinks.map((l) => (
          <path key={`${l.from}-${l.to}`} className={l.type === "built" || l.type === "fused" ? "lk" : l.type === "against" ? "lk against" : "lk mixed"} d={curve(l.from, l.to)} />
        ))}
      </svg>
      <ol className="tl-eras" aria-hidden="true">
        {bands.map((b) => (
          <li key={b.name} style={{ left: b.x + 10, top: TOP - 34, maxWidth: b.w - 20 }}>{hasCard && b.w < 200 ? b.short : b.name}</li>
        ))}
      </ol>
      <ol className="tl-ticks" aria-hidden="true">
        {TICKS.filter((t) => t <= end).map((t) => (
          <li key={t} style={{ left: scale(t), top: BOTTOM + 22 }}>{yearLabel(t)}</li>
        ))}
      </ol>
      <ol className="tl-rows" onKeyDown={onKeyDown} aria-label={words.timelineList}>
        {rows.map((r, i) => {
          const s = r.item, g = geo[i], id = s.id;
          const st = states.get(id);
          const side = placed?.[id] ?? "after";
          const cls = ["tb", st === "started" && "v", st === "explored" && "v xp", id === cur && "cur", lit.has(id) && "lit", r.span.open && "open"].filter(Boolean).join(" ");
          const when = whenOf(s);
          return (
            <li key={id}>
              <button
                type="button"
                className={cls}
                style={{ top: y(i) }}
                data-id={id}
                aria-label={`${s.name}, ${when}${stateLabel(st) ? `, ${stateLabel(st, words.allSeen)}` : ""}`}
                aria-current={id === focus ? "true" : undefined}
                onClick={(e) => { e.stopPropagation(); nav.openSchool(id); }}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered((h) => (h === id ? null : h))}
                onFocus={() => setHovered(id)}
                onBlur={() => setHovered((h) => (h === id ? null : h))}
              >
                {g.xr != null && <i className="roots" style={{ left: g.xr, width: g.xs - g.xr }} />}
                <i className="bar" style={{ left: g.xs, width: g.xe - g.xs }} />
                {g.xt != null && g.xt > g.xe && <i className="tail" style={{ left: g.xe, width: g.xt - g.xe }} />}
                <i className="mk" style={{ left: g.xs }} />
                <span
                  className={["tl-lb", side, g.xt != null && "knock", placed && "placed"].filter(Boolean).join(" ")}
                  ref={(el) => { if (el) labelRefs.current.set(id, el); else labelRefs.current.delete(id); }}
                  style={{
                    left: side === "after" ? g.xe + GAP : side === "before" ? g.xs - GAP : g.xs + 16,
                    // on the bar: never past the axis's end; the button's label keeps the full name
                    maxWidth: side === "on" ? Math.max(80, x1 - g.xs - 24) : undefined,
                  }}
                  title={side === "on" ? s.name : undefined}
                >
                  {splitName(s.name).short}
                  {traditionOf(s) && <small className="tag">{traditionOf(s)}</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
