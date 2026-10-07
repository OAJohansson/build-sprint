"use client";

// Arc: an instrument. The day is drawn as the sun's path over the horizon; the countdown is the
// sun's position on it. The landmark is a small anchor on the horizon; the times sit below it.
import { Landmark } from "./_components/landmark";
import { PlaceButton } from "./_components/place-button";
import { Stars } from "./_components/stars";
import { clock, dayFraction, gradient, view, type Place } from "./_lib/sky";
import type { VariantProps } from "./harness";
import "./variants.css";

const W = 360;
const BASE = 200; // horizon y in the SVG
const R = 150;
const NIGHT = 46; // depth of the night arc below the horizon

const dayPt = (f: number) => [W / 2 - R * Math.cos(Math.PI * f), BASE - R * Math.sin(Math.PI * f)] as const;
const nightPt = (f: number) => [W / 2 + R * Math.cos(Math.PI * f), BASE + NIGHT * Math.sin(Math.PI * f)] as const;
const arc = (pt: typeof dayPt, rx: number, ry: number, a: number, b: number) => {
  const [x1, y1] = pt(a);
  const [x2, y2] = pt(b);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${rx} ${ry} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};
const frac = (d: Date | null, place: Place) => {
  if (!d) return null;
  const v = dayFraction(place, d);
  return v.daylight ? v.f : null;
};

export function Arc({ place, now, onSearch }: VariantProps) {
  const v = view(place, now);
  const { daylight, f } = dayFraction(place, now);
  const ink = v.sky.ink;
  const gEve = frac(v.day.goldenStart, place);
  const gMorn = frac(v.day.goldenEnd, place);
  const [sx, sy] = daylight ? dayPt(f) : nightPt(f);
  const rows = [
    { label: "Sunrise", at: v.day.sunrise },
    { label: "Golden hour", at: v.day.goldenStart },
    { label: "Sunset", at: v.day.sunset },
  ];

  return (
    <main className="hz fixed inset-0 flex flex-col overflow-hidden bg-[#0b1022]">
      <div key={place.id} className="hz-sky-in absolute inset-0" style={{ background: gradient(v.sky) }} />
      <Stars opacity={v.sky.stars} />

      <div className="relative px-6 pt-[max(1.25rem,env(safe-area-inset-top))] hz-rise">
        <PlaceButton place={place} localTime={v.localTime} ink={ink} inkSoft={v.sky.inkSoft} onClick={onSearch} />
      </div>

      <div className="relative mt-auto w-full">
        <div className="relative mx-auto w-full max-w-[420px]">
          <svg viewBox={`0 0 ${W} ${BASE + NIGHT + 8}`} className="block w-full overflow-visible" aria-hidden="true">
            {/* daylight arc: elapsed solid, still to come faint */}
            <path d={arc(dayPt, R, R, 0, 1)} pathLength={1} className="hz-draw" fill="none" stroke={ink} strokeOpacity={0.28} strokeWidth={1.5} />
            {daylight && <path d={arc(dayPt, R, R, 0, f)} fill="none" stroke={ink} strokeOpacity={0.85} strokeWidth={1.5} />}
            {gMorn != null && <path d={arc(dayPt, R, R, 0, gMorn)} fill="none" stroke="#ffc46b" strokeWidth={4} strokeLinecap="round" />}
            {gEve != null && <path d={arc(dayPt, R, R, gEve, 1)} fill="none" stroke="#ffc46b" strokeWidth={4} strokeLinecap="round" />}
            {/* the night, below the horizon */}
            <path d={arc(nightPt, R, NIGHT, 0, 1)} fill="none" stroke="#ffffff" strokeOpacity={0.16} strokeWidth={1.5} strokeDasharray="2 5" />
            <line x1={0} x2={W} y1={BASE} y2={BASE} stroke={ink} strokeOpacity={0.4} />
            <g style={{ transform: `translate(${sx}px, ${sy}px)`, transition: "transform 1s linear" }}>
              <circle r={daylight ? 9 : 6} fill={daylight ? "#fff3d6" : "#dfe6ff"} className="hz-sun-in" />
              {daylight && <circle r={18} fill="#ffd79a" opacity={0.28} />}
            </g>
          </svg>

          <Landmark id={place.landmark} fill={v.sky.land} className="pointer-events-none absolute left-1/2 w-[30%] -translate-x-1/2" style={{ bottom: `${((NIGHT + 8) / (BASE + NIGHT + 8)) * 100}%` }} />

          <div className="absolute inset-x-0 text-center" style={{ top: "25%", color: ink }} aria-live="polite">
            {v.event && v.left ? (
              <>
                <p className="hz-rise text-[clamp(44px,14vw,56px)] font-light leading-none tracking-[-0.03em] tabular-nums" style={{ ["--i" as string]: 1 }}>
                  {v.left.h}:{String(v.left.m).padStart(2, "0")}
                </p>
                <p className="hz-rise mt-2 text-sm" style={{ ["--i" as string]: 2, color: v.sky.inkSoft }}>
                  until {v.event.kind}
                  {v.tomorrow ? " tomorrow" : ""}
                </p>
              </>
            ) : (
              <p className="hz-rise px-8 text-xl font-light">{v.day.alwaysUp ? "No sunset today" : "No sunrise today"}</p>
            )}
          </div>
        </div>

        <div className="relative px-6 pb-28 pt-2" style={{ background: `linear-gradient(to bottom, transparent, ${v.sky.land} 30%)` }}>
          <ul className="mx-auto max-w-[420px] divide-y divide-white/10 text-white">
            {rows.map((r, i) => {
              const next = v.event && r.at && +r.at === +v.event.at;
              return (
                <li key={r.label} className="hz-rise flex items-baseline justify-between py-3" style={{ ["--i" as string]: 3 + i }}>
                  <span className={next ? "font-medium" : "text-white/65"}>
                    {r.label === "Golden hour" && <span className="mr-2 inline-block size-2 rounded-full bg-[#ffc46b] align-middle" aria-hidden="true" />}
                    {r.label}
                  </span>
                  <span className={`tabular-nums ${next ? "font-medium" : "text-white/65"}`}>{clock(r.at, place.tz)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
