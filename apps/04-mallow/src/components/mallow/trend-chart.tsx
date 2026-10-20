"use client";

import { useEffect, useRef, useState } from "react";
import { amountLabel, daysBetween, gradeWord, long, short, symptomById, today } from "@/lib/mallow/data";
import { activeOn, amountOn } from "@/lib/mallow/history";
import { dayOf, type Store } from "@/lib/mallow/store";
import { medicineBars, plainLine, rangeLabel, rangeStart, series, type Range } from "@/lib/mallow/trend";

// Is it changing? One symptom over time (daily dots, a 7-day average line, gaps left open), the
// medicines taken underneath on the same time axis, appointments as hairlines and the
// before-treatment grade on the left. What it must make obvious (owner, 20 Oct): how the symptom
// has been changing, and what the patient was on at the time. Harder grades sit at the top, so
// "pain is lower" reads as the line going down.

const LABEL_W = 76; // grade words
const BEFORE_W = 34; // before-treatment column
const GAP = 8;
const PLOT_H = 132;
const ROW_H = 32; // one medicine: name and amount, then the bar
const AXIS_H = 22;

export function TrendChart({ store, symptom, range }: { store: Store; symptom: string; range: Range }) {
  const [box, width] = useWidth();
  const [hover, setHover] = useState<number>();
  const sym = symptomById(symptom);
  const end = today();
  const from = rangeStart(store, range, end);
  const pts = series(store, symptom, from, end);
  const bars = medicineBars(store.meds, from, end);
  const baseline = store.baseline[symptom];
  const logged = pts.filter((p) => p.grade !== undefined).length;

  const x0 = LABEL_W + BEFORE_W + GAP;
  const x1 = Math.max(width - 4, x0 + 40);
  const span = Math.max(pts.length - 1, 1);
  const x = (i: number) => x0 + (i / span) * (x1 - x0);
  const xDate = (d: string) => x(daysBetween(from, d));
  // Grade 0 (easiest) on the bottom row, 3 (hardest) on the top.
  const yg = (g: number) => 10 + ((3 - g) / 3) * (PLOT_H - 20);
  const stripTop = PLOT_H + AXIS_H;
  const height = stripTop + Math.max(bars.length, 1) * ROW_H + 4;

  // The average line, broken wherever there were too few check-ins.
  const segments: string[] = [];
  let cur = "";
  pts.forEach((p, i) => {
    if (p.avg === undefined) {
      if (cur) segments.push(cur);
      cur = "";
      return;
    }
    cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${yg(p.avg).toFixed(1)}`;
  });
  if (cur) segments.push(cur);

  const appts = [...store.past, store.next].filter((d) => d && d >= from && d <= end);
  const ticks = [0, Math.round(span / 2), span];
  const h = hover !== undefined ? pts[hover] : undefined;
  // What was being taken that day: scheduled medicines in the plan, as-needed ones only if used.
  const isAsNeeded = (m: Store["meds"][number]) => !m.when.some((w) => w !== "When needed");
  const onMeds = h
    ? store.meds.filter((m) => activeOn(m, h.date) && (!isAsNeeded(m) || dayOf(store, h.date).doses.some((d) => d.med === m.id)))
    : [];

  const pick = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * span);
    setHover(Math.max(0, Math.min(span, i)));
  };

  return (
    <figure className="m-0">
      {/* The takeaway first: what the doctor should read before looking at the lines. */}
      <figcaption className="mb-3 text-base leading-relaxed">
        {plainLine(store, symptom) ?? <span style={{ color: "var(--ink-soft)" }}>A few days of check-ins and your trend appears here.</span>}
      </figcaption>
      {/* One readout row, always the same height: the range at rest, the picked day when scrubbing. */}
      <p className="tnum min-h-10 text-sm leading-snug" style={{ color: "var(--ink-soft)" }} aria-live="polite">
        {h ? (
          <>
            <span className="font-medium" style={{ color: "var(--ink)" }}>
              {long(h.date)}
            </span>
            {" · "}
            {h.grade !== undefined ? sym.grades[h.grade][0] : "Not logged"}
            {h.avg !== undefined ? ` (that week: ${gradeWord(sym, h.avg).toLowerCase()})` : ""}
            <br />
            {onMeds.length ? onMeds.map((m) => `${amountLabel(m, amountOn(m, h.date))} ${m.name}`).join(", ") : "No medicine in your plan"}
          </>
        ) : (
          <>
            {rangeLabel[range]} · {logged} of {pts.length} days logged
            <br />
            <span style={{ color: "var(--ink-faint)" }}>Touch the graph to see a day</span>
          </>
        )}
      </p>

      <div ref={box} className="mt-2 w-full">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={`${sym.name} over ${rangeLabel[range].toLowerCase()}, with your medicines underneath`} className="block overflow-visible">
            {/* Grade rows: the words are the axis. */}
            {sym.grades.map(([word], g) => (
              <g key={word}>
                <line x1={x0} x2={x1} y1={yg(g)} y2={yg(g)} stroke="var(--line)" strokeWidth={1} />
                <text x={0} y={yg(g)} dy="0.35em" fontSize={11} fill="var(--ink-soft)">
                  {word}
                </text>
              </g>
            ))}

            {/* Before treatment: a quiet column on the left with the grade it started from. */}
            {baseline !== undefined && (
              <g>
                <rect x={LABEL_W} y={yg(baseline) - 9} width={BEFORE_W - 4} height={18} rx={5} fill="var(--mallow-tint)" />
                <line x1={LABEL_W + 6} x2={LABEL_W + BEFORE_W - 10} y1={yg(baseline)} y2={yg(baseline)} stroke="var(--mallow-deep)" strokeWidth={2.5} strokeLinecap="round" />
              </g>
            )}
            {baseline !== undefined && (
              <text x={LABEL_W + (BEFORE_W - 4) / 2} y={baseline === 0 ? yg(baseline) - 14 : yg(baseline) + 22} fontSize={10} textAnchor="middle" fill="var(--ink-soft)">
                Before
              </text>
            )}

            {/* Appointments: hairlines through graph and strip, a small ink tick on the axis (key below). */}
            {appts.map((d) => (
              <g key={d}>
                <line x1={xDate(d)} x2={xDate(d)} y1={4} y2={height - 4} stroke="var(--line)" strokeWidth={1} />
                <line x1={xDate(d)} x2={xDate(d)} y1={PLOT_H - 4} y2={PLOT_H + 3} stroke="var(--ink-soft)" strokeWidth={2} strokeLinecap="round" />
              </g>
            ))}

            {/* Daily dots, then the 7-day average on top. */}
            {/* Daily dots only over 4 weeks; across months they turn into bands and drown the line. */}
            {range === "4w" &&
              pts.map((p, i) => (p.grade === undefined ? null : <circle key={p.date} cx={x(i)} cy={yg(p.grade)} r={3} fill="var(--mallow)" opacity={0.6} />))}
            {segments.map((d) => (
              <path key={d} d={d} fill="none" stroke="var(--mallow-deep)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            ))}

            {/* Date ticks. */}
            {ticks.map((i, k) => (
              <text key={i} x={k === 0 ? x(i) + 2 : x(i)} y={PLOT_H + 14} fontSize={10} fill="var(--ink-faint)" textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}>
                {i === span ? "Today" : short(pts[i].date)}
              </text>
            ))}

            {/* The medicine strip: a row per medicine, its name above a bar from start to stop. */}
            {bars.length === 0 && (
              <text x={x0} y={stripTop + 16} fontSize={11} fill="var(--ink-faint)">
                No medicine in your plan for these dates
              </text>
            )}
            {bars.map((b, r) => {
              const top = stripTop + r * ROW_H;
              const bx = xDate(b.from);
              const bw = Math.max(xDate(b.to) - bx, 4);
              const asNeeded = isAsNeeded(b.med);
              const form = b.med.name.toLowerCase().includes(b.med.form.toLowerCase()) ? "" : ` · ${b.med.form.toLowerCase()}`;
              const amounts = asNeeded
                ? "when needed"
                : [amountOn(b.med, b.from), ...b.changes.map((c) => c.amount)].map((a) => amountLabel(b.med, a)).join(" → ");
              const label = `${b.med.name}${form} · ${amounts}`;
              // An as-needed medicine: a light bar with a tick on each day it was taken.
              const used = asNeeded ? pts.filter((p) => dayOf(store, p.date).doses.some((d) => d.med === b.med.id)).map((p) => p.date) : [];
              return (
                <g key={b.med.id}>
                  {/* Label at the bar's start, pulled left only as far as it needs to fit (about 6px a character). */}
                  <text x={Math.max(x0, Math.min(bx, x1 - Math.min(label.length, 34) * 6))} y={top + 10} fontSize={11} fill="var(--ink-soft)">
                    {label.length > 34 ? `${label.slice(0, 33)}…` : label}
                  </text>
                  <rect x={bx} y={top + 17} width={bw} height={asNeeded ? 2 : 6} rx={3} fill={asNeeded ? "var(--line)" : "var(--ink-faint)"} />
                  {used.map((d) => (
                    <circle key={d} cx={xDate(d)} cy={top + 18} r={2.5} fill="var(--ink-soft)" />
                  ))}
                  {b.changes.map((c) => {
                    const cx = xDate(c.date);
                    return (
                      <g key={c.date}>
                        {/* A step, not a knob: the bar thickens from the day the amount changed. */}
                        <rect x={cx} y={top + 15} width={Math.max(bx + bw - cx, 2)} height={10} rx={3} fill="var(--ink-soft)" />
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Scrubbing: a crosshair and the picked day's dot. */}
            {h && hover !== undefined && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={4} y2={PLOT_H} stroke="var(--ink-soft)" strokeWidth={1} />
                {h.grade !== undefined && <circle cx={x(hover)} cy={yg(h.grade)} r={5} fill="var(--mallow-deep)" stroke="var(--card)" strokeWidth={2} />}
              </g>
            )}
            <rect
              x={x0 - 6}
              y={0}
              width={x1 - x0 + 12}
              height={height}
              fill="transparent"
              style={{ touchAction: "pan-y", cursor: "crosshair" }}
              onPointerDown={pick}
              onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons) && pick(e)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setHover(undefined)}
            />
          </svg>
        )}
      </div>

      {appts.length > 0 && (
        <p className="mt-1 flex items-center gap-2 text-xs" style={{ color: "var(--ink-faint)", paddingLeft: x0 }}>
          <span aria-hidden className="inline-block h-2 w-0.5 rounded-full" style={{ background: "var(--ink-soft)" }} />
          Appointments
        </p>
      )}

    </figure>
  );
}

// The chart draws at its real width, so text stays 11px on every phone.
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
