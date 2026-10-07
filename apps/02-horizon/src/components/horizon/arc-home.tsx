"use client";

// The home screen ("Arc", chosen from three prototypes): the day is drawn as the sun's path over
// the horizon, and the countdown is the sun's position on it. The landmark anchors the horizon;
// the day's times sit below it.
import { LocateFixed } from "lucide-react";
import { clock, dayFraction, gradient, nextOf, shortDate, sunDay, view, type Place } from "@/lib/sun";
import { Landmark } from "./landmark";
import { PlaceButton } from "./place-button";
import { Stars } from "./stars";
import "./horizon.css";

const W = 360;
const BASE = 200; // horizon y in the SVG
const R = 150; // half the arc's width
const RY = 180; // the arc's height: taller than a half circle, to give the countdown room
const NIGHT = 46; // depth of the night arc below the horizon
const H = BASE + NIGHT + 8; // SVG height
const MORNING = "#ffd27a"; // morning golden light
const EVENING = "#ff8f54"; // evening golden hour, warmer, like the sunset itself
// The countdown sits midway between the top of the arc and the top of the landmark.
const LANDMARK_W = 0.32; // share of the width
const LANDMARK_TOP = BASE - (W * LANDMARK_W) / 2;
const TEXT_H = 82; // countdown + label, in SVG units
const TEXT_TOP = (BASE - RY + LANDMARK_TOP) / 2 - TEXT_H / 2;

const dayPt = (f: number) => [W / 2 - R * Math.cos(Math.PI * f), BASE - RY * Math.sin(Math.PI * f)] as const;
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

export function ArcHome({ place, now, onSearch, onLocate }: { place: Place; now: Date; onSearch: () => void; onLocate: () => void }) {
  const v = view(place, now);
  const { daylight, f } = dayFraction(place, now);
  const ink = v.sky.ink;
  const gEve = frac(v.day.goldenStart, place);
  const gMorn = frac(v.day.goldenEnd, place);
  const [sx, sy] = daylight ? dayPt(f) : nightPt(f);
  // Fade the sun when it passes behind the countdown (F6).
  const behindText = sy > TEXT_TOP - 12 && sy < TEXT_TOP + TEXT_H && Math.abs(sx - W / 2) < 95;
  const polar = v.day.alwaysUp || v.day.alwaysDown;
  const polarNext = polar ? nextOf(place, now, v.day.alwaysUp ? "sunset" : "sunrise") : null;
  // The rows describe the day of the next event: tomorrow's times once today's sun has set (F7).
  const tomorrow = !polar && v.tomorrow && v.event;
  const day = tomorrow && v.event ? sunDay(place, v.event.at) : v.day;
  const rows = [
    { label: "Sunrise", at: day.sunrise },
    v.event?.kind === "sunrise" && !polar
      ? { label: "Golden light until", at: day.goldenEnd }
      : { label: "Golden hour", at: day.goldenStart },
    { label: "Sunset", at: day.sunset },
  ];

  return (
    <main className="hz fixed inset-0 flex flex-col overflow-hidden bg-[#0b1022]">
      <div key={place.id} className="hz-sky-in absolute inset-0" style={{ background: gradient(v.sky) }} />
      <Stars opacity={v.sky.stars} />
      <h1 className="sr-only">Horizon: {place.name}</h1>

      <div className="hz-rise relative flex items-center justify-between gap-3 px-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <PlaceButton place={place} localTime={v.localTime} ink={v.sky.inkTop} inkSoft={v.sky.inkTopSoft} onClick={onSearch} />
        {!place.here && (
          <button
            onClick={onLocate}
            aria-label="Back to my location"
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full transition-transform duration-150 ease-out active:scale-[0.97]"
            style={{ color: v.sky.inkTop }}
          >
            <LocateFixed className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Sky above, the instrument on the horizon, ground below: the ground starts at the horizon line. */}
      <div className="flex-1" />
      <div className="relative w-full" style={{ background: `linear-gradient(to bottom, transparent ${(BASE / H) * 100}%, ${v.sky.land} ${(BASE / H) * 100}%)` }}>
        <div className="relative mx-auto w-full max-w-[420px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full overflow-visible" aria-hidden="true">
            {/* daylight arc: elapsed solid, still to come faint */}
            <path d={arc(dayPt, R, RY, 0, 1)} pathLength={1} className="hz-draw" fill="none" stroke={ink} strokeOpacity={0.28} strokeWidth={1.5} />
            {daylight && <path d={arc(dayPt, R, RY, 0, f)} fill="none" stroke={ink} strokeOpacity={0.85} strokeWidth={1.5} />}
            {gMorn != null && <path d={arc(dayPt, R, RY, 0, gMorn)} fill="none" stroke={MORNING} strokeWidth={4} strokeLinecap="round" />}
            {gEve != null && <path d={arc(dayPt, R, RY, gEve, 1)} fill="none" stroke={EVENING} strokeWidth={4} strokeLinecap="round" />}
            {/* the night, below the horizon */}
            <path d={arc(nightPt, R, NIGHT, 0, 1)} fill="none" stroke="#ffffff" strokeOpacity={0.16} strokeWidth={1.5} strokeDasharray="2 5" />
            <line x1={0} x2={W} y1={BASE} y2={BASE} stroke={ink} strokeOpacity={0.4} />
            <g className="hz-glide" style={{ transform: `translate(${sx}px, ${sy}px)`, opacity: behindText ? 0.3 : 1 }}>
              <circle r={daylight ? 9 : 6} fill={daylight ? "#fff3d6" : "#dfe6ff"} className="hz-sun-in" />
              {daylight && <circle r={18} fill="#ffd79a" opacity={0.28} />}
            </g>
          </svg>

          <Landmark id={place.landmark} fill={v.sky.land} className="pointer-events-none absolute left-1/2 -translate-x-1/2" style={{ width: `${LANDMARK_W * 100}%`, bottom: `${((NIGHT + 8) / H) * 100}%` }} />

          <div className="absolute inset-x-0 flex flex-col items-center justify-center text-center" style={{ top: `${(TEXT_TOP / H) * 100}%`, height: `${(TEXT_H / H) * 100}%`, color: ink, textShadow: v.sky.shadow }}>
            {!polar && v.event && v.left ? (
              <>
                <p className="hz-rise text-[clamp(44px,14vw,56px)] font-light leading-none tracking-[-0.03em] tabular-nums" style={{ ["--i" as string]: 1 }}>
                  {v.left.h}:{String(v.left.m).padStart(2, "0")}
                </p>
                <p className="hz-rise mt-2.5 text-sm" style={{ ["--i" as string]: 2, color: v.sky.inkSoft }}>
                  until {v.event.kind}
                  {v.tomorrow ? " tomorrow" : ""}
                </p>
              </>
            ) : (
              <div className="hz-rise px-8">
                <p className="text-xl font-light">{v.day.alwaysUp ? "No sunset today" : "No sunrise today"}</p>
                {polarNext && (
                  <p className="mt-1 text-sm" style={{ color: v.sky.inkSoft }}>
                    Next {v.day.alwaysUp ? "sunset" : "sunrise"} {shortDate(polarNext, place.tz)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      <div className="relative flex flex-[1.15] flex-col justify-end px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]" style={{ background: v.sky.land }}>
          {tomorrow && <p className="mx-auto w-full max-w-[420px] pb-1 text-xs font-medium uppercase tracking-wider text-white/55">Tomorrow</p>}
          <ul className="mx-auto w-full max-w-[420px] divide-y divide-white/10 text-white">
            {rows.map((r, i) => {
              const next = v.event && r.at && +r.at === +v.event.at;
              return (
                <li key={r.label} className="hz-rise flex items-baseline justify-between py-3" style={{ ["--i" as string]: 3 + i }}>
                  <span className={next ? "font-medium" : "text-white/65"}>
                    {r.label.startsWith("Golden") && (
                      <span className="mr-2 inline-block size-2 rounded-full align-middle" style={{ background: r.label === "Golden hour" ? EVENING : MORNING }} aria-hidden="true" />
                    )}
                    {r.label}
                  </span>
                  <span className={`tabular-nums ${next ? "font-medium" : "text-white/65"}`}>
                    {r.at ? clock(r.at, place.tz) : day.alwaysUp ? "Sun up all day" : day.alwaysDown ? "Sun down all day" : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
      </div>
    </main>
  );
}
