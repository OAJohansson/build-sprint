"use client";

import { Check, Flame } from "lucide-react";
import { SectionLabel } from "@/components/ui/bits";
import { type Trend, WEEKLY_GOAL, benchmarkRepeats, fmtKg, movingLifts, weeklyGoal } from "@/lib/progress";
import { type Session, formatDate, today } from "@/lib/types";

/** Tiny line of a lift's top set per day; the latest point is emphasised. */
export function Sparkline({ values, width = 96, height = 28 }: { values: number[]; width?: number; height?: number }) {
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [
    pad + (i * (width - 2 * pad)) / Math.max(values.length - 1, 1),
    height - pad - ((v - min) * (height - 2 * pad)) / (max - min || 1),
  ]);
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="flex-none">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r="3.5" fill="var(--primary)" stroke="var(--background)" strokeWidth="2" />
    </svg>
  );
}

/**
 * This week against the weekly goal: one dot per training day. The streak badge
 * is always there (muted at 0) so people know there's a streak to build.
 */
export function WeeklyGoal({ sessions, onOpen }: { sessions: Session[]; onOpen: () => void }) {
  const { streak, thisWeek } = weeklyGoal(sessions, today());
  const dots = Math.max(WEEKLY_GOAL, thisWeek);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-2xl bg-[#1a1a18] p-4 text-left"
      aria-label={`This week: ${thisWeek} of ${WEEKLY_GOAL} training days. Streak: ${streak} week${streak === 1 ? "" : "s"} in a row with ${WEEKLY_GOAL}+ days. Open calendar`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-display text-[26px] font-bold uppercase leading-none">This week</span>
        <span
          title={`Weeks in a row with ${WEEKLY_GOAL}+ training days`}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${streak > 0 ? "bg-[#3a2412] text-primary" : "bg-[#262624] text-muted-foreground"}`}
        >
          <Flame className="size-4" /> {streak} week{streak === 1 ? "" : "s"}
        </span>
      </span>
      <span className="flex gap-2.5">
        {Array.from({ length: dots }, (_, i) => (
          <span
            key={i}
            className={`flex size-9 items-center justify-center rounded-full ${i < thisWeek ? "bg-primary text-background" : "border-2 border-[#3a3a36]"}`}
          >
            {i < thisWeek && <Check className="size-5" strokeWidth={3} />}
          </span>
        ))}
      </span>
    </button>
  );
}

export function MovingUp({ sessions, onOpen }: { sessions: Session[]; onOpen: (movement: string) => void }) {
  const lifts = movingLifts(sessions).slice(0, 5);
  const benchmarks = benchmarkRepeats(sessions);
  if (!lifts.length && !benchmarks.length) return null;
  return (
    <section className="flex flex-col">
      <SectionLabel>Moving up</SectionLabel>
      <ul className="mt-1">
        {lifts.map((t) => (
          <li key={t.movement}>
            <button
              type="button"
              onClick={() => onOpen(t.movement)}
              className="grid min-h-12 w-full grid-cols-[1fr_96px_96px] items-center gap-2.5 border-b border-border py-2 text-left"
            >
              <span className="truncate text-base font-medium">{t.movement}</span>
              <Sparkline values={t.points.map((p) => p.value)} />
              <span className="flex flex-col items-end">
                <span className="font-display text-xl font-bold tabular-nums">
                  {t.change >= 0 ? "+" : "−"}
                  {fmtKg(Math.abs(t.change))} kg
                </span>
                <span className="text-[11px] text-muted-foreground">since {formatDate(t.first.date)}</span>
              </span>
            </button>
          </li>
        ))}
        {benchmarks.map((b) => (
          <li key={b.movement} className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-2">
            <span className="text-base font-medium">{b.movement}</span>
            <span className="font-display text-xl font-bold tabular-nums">
              {b.first} → {b.last} <span className="text-[15px] text-muted-foreground">{b.change}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A lift's heaviest set per training day, with the 1RM as a dashed reference line. */
export function TrendChart({ trend, oneRm }: { trend: Trend; oneRm?: number }) {
  const W = 350;
  const H = 170;
  const left = 32;
  const right = 8;
  const top = 12;
  const bottom = 146;
  const values = trend.points.map((p) => p.value);
  const lo = Math.floor((Math.min(...values) - 5) / 10) * 10;
  const hi = Math.ceil((Math.max(...values, oneRm ?? 0) + 5) / 10) * 10;
  const t0 = Date.parse(`${trend.first.date}T12:00:00`);
  const span = Math.max(Date.parse(`${trend.last.date}T12:00:00`) - t0, 1);
  const x = (date: string) => left + ((Date.parse(`${date}T12:00:00`) - t0) / span) * (W - left - right);
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const step = hi - lo > 60 ? 20 : 10;
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const months = trend.points.filter((p, i, all) => i === 0 || p.date.slice(5, 7) !== all[i - 1].date.slice(5, 7));
  const last = trend.points[trend.points.length - 1];

  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Heaviest set per session, ${fmtKg(trend.first.value)} kg on ${formatDate(trend.first.date)} to ${fmtKg(last.value)} kg on ${formatDate(last.date)}${oneRm ? `, against a 1RM of ${fmtKg(oneRm)} kg` : ""}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={0} y={y(t) + 4} fill="var(--muted-foreground)" fontSize="11">{t}</text>
          </g>
        ))}
        {oneRm != null && (
          <g>
            <line x1={left} x2={W - right} y1={y(oneRm)} y2={y(oneRm)} stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={W - right} y={y(oneRm) - 5} fill="var(--muted-foreground)" fontSize="11" textAnchor="end">1RM {fmtKg(oneRm)}</text>
          </g>
        )}
        <polyline
          points={trend.points.map((p) => `${x(p.date)},${y(p.value)}`).join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {trend.points.map((p, i) => {
          const isLast = i === trend.points.length - 1;
          return (
            <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={isLast ? 5 : 3.5} fill="var(--primary)" opacity={isLast ? 1 : 0.75} stroke="var(--background)" strokeWidth="2">
              <title>{`${formatDate(p.date)}: ${fmtKg(p.value)} kg`}</title>
            </circle>
          );
        })}
        <text x={x(last.date) - 8} y={y(last.value) - 10} fill="var(--foreground)" fontSize="13" fontWeight="600" textAnchor="end">
          {fmtKg(last.value)}
        </text>
        {months.map((m) => (
          <text key={m.date} x={x(m.date)} y={H - 4} fill="var(--muted-foreground)" fontSize="11" textAnchor={x(m.date) > W - 40 ? "end" : "start"}>
            {new Date(`${m.date}T12:00:00`).toLocaleDateString("en-GB", { month: "short" })}
          </text>
        ))}
      </svg>
      <figcaption className="text-xs text-muted-foreground">
        Heaviest set per session{oneRm != null ? " · dashed line is your 1RM" : ""}
      </figcaption>
    </figure>
  );
}
