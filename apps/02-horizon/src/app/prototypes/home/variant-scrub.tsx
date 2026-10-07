"use client";

// Scrub: interactive. The screen is split at the horizon, the landmark reflected in the water
// below. Drag anywhere to move through the day and watch the light change; the text is a sentence.
import { useRef, useState } from "react";
import { Landmark } from "./_components/landmark";
import { PlaceButton } from "./_components/place-button";
import { Stars } from "./_components/stars";
import { clock, dayFraction, gradient, phaseName, until, view } from "./_lib/sky";
import type { VariantProps } from "./harness";
import "./variants.css";

const HORIZON = 60; // % from the top
const MIN_PER_PX = 0.9; // a phone's width ≈ 6 hours
const RANGE = [-12 * 60, 24 * 60];

export function Scrub({ place, now, onSearch }: VariantProps) {
  const [offset, setOffset] = useState(0);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const at = new Date(+now + offset * 60000);
  const v = view(place, at);
  const live = view(place, now);
  const { f } = dayFraction(place, at);
  const sunX = 10 + f * 80;
  const sunY = HORIZON - (Math.min(52, Math.max(-6, v.alt)) / 55) * (HORIZON - 12);
  const scrubbing = Math.abs(offset) >= 1;
  const clamp = (m: number) => Math.round(Math.min(RANGE[1], Math.max(RANGE[0], m)));

  const backToNow = () => {
    const from = offset;
    const t0 = performance.now();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (t: number) => {
      const p = reduce ? 1 : Math.min(1, (t - t0) / 320);
      setOffset(from * (1 - (1 - (1 - p) ** 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const golden = live.event?.kind === "sunset" ? live.day.goldenStart : live.day.goldenEnd;

  return (
    <main
      className="hz fixed inset-0 touch-pan-y select-none overflow-hidden bg-[#0b1022]"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button, input")) return;
        drag.current = { x: e.clientX, start: offset };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current) setOffset(clamp(drag.current.start + (e.clientX - drag.current.x) * MIN_PER_PX));
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      {/* sky */}
      <div key={place.id} className="hz-sky-in absolute inset-x-0 top-0" style={{ height: `${HORIZON}%`, background: gradient(v.sky) }} />
      <div className="absolute inset-x-0 top-0" style={{ height: `${HORIZON}%` }}>
        <Stars opacity={v.sky.stars} />
      </div>
      {v.alt > -4 && (
        <div className="pointer-events-none absolute" style={{ left: `${sunX}%`, top: `${sunY}%`, transform: "translate(-50%, -50%)" }} aria-hidden="true">
          <div className="hz-sun-in size-14 rounded-full" style={{ background: "radial-gradient(circle, #fff8e7 0%, #ffe2a8 45%, rgb(255 210 140 / 0) 72%)", boxShadow: "0 0 70px 26px rgb(255 214 150 / 0.32)" }} />
        </div>
      )}
      <Landmark id={place.landmark} fill={v.sky.land} className="pointer-events-none absolute inset-x-0 w-full" style={{ bottom: `${100 - HORIZON}%`, height: "26%" }} />

      {/* water, with the landmark and the sun reflected */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: `${HORIZON}%`, background: `linear-gradient(to bottom, ${v.sky.horizon}, ${v.sky.land} 22%)` }} />
      <div className="pointer-events-none absolute inset-x-0 overflow-hidden" style={{ top: `${HORIZON}%`, height: "26%", maskImage: "linear-gradient(to bottom, rgb(0 0 0 / 0.45), transparent 80%)" }} aria-hidden="true">
        <Landmark id={place.landmark} fill={v.sky.land} className="absolute inset-x-0 top-0 h-full w-full -scale-y-100" />
        {v.alt > -2 && <div className="absolute top-0 h-full w-10 -translate-x-1/2 rounded-full blur-md" style={{ left: `${sunX}%`, background: "linear-gradient(to bottom, rgb(255 226 168 / 0.7), transparent)" }} />}
      </div>

      {/* text */}
      <div className="relative flex h-full flex-col px-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="hz-rise">
          <PlaceButton place={place} localTime={live.localTime} ink={v.sky.ink} inkSoft={v.sky.inkSoft} onClick={onSearch} />
        </div>

        <section className="absolute inset-x-6 text-white" style={{ top: `calc(${HORIZON}% + 9%)` }} aria-live="polite">
          {scrubbing ? (
            <>
              <p className="text-5xl font-extralight tracking-[-0.03em] tabular-nums">{clock(at, place.tz)}</p>
              <p className="mt-2 text-lg text-white/75">
                {phaseName(v.alt, v.morning)} · {offset > 0 ? "in" : ""} {until(Math.abs(offset) * 60000).long} {offset < 0 ? "ago" : ""}
              </p>
              <button onClick={backToNow} className="mt-5 rounded-full bg-white/14 px-4 py-2 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.97]">
                Back to now
              </button>
            </>
          ) : live.event && live.left ? (
            <>
              <p className="hz-rise text-[clamp(30px,9vw,40px)] font-light leading-tight tracking-[-0.02em]" style={{ ["--i" as string]: 1 }}>
                {live.event.kind === "sunset" ? "Sunset" : "Sunrise"} {live.tomorrow ? "tomorrow, " : ""}in <span className="tabular-nums">{live.left.long}</span>.
              </p>
              <p className="hz-rise mt-3 text-white/70 tabular-nums" style={{ ["--i" as string]: 2 }}>
                {clock(live.event.at, place.tz)}
                {golden ? ` · golden ${live.event.kind === "sunset" ? "from" : "until"} ${clock(golden, place.tz)}` : ""}
              </p>
              <p className="hz-rise mt-8 text-sm text-white/45" style={{ ["--i" as string]: 3 }}>
                ← Drag to see the light later →
              </p>
            </>
          ) : (
            <p className="text-3xl font-light">{live.day.alwaysUp ? "The sun doesn’t set here today." : "The sun doesn’t rise here today."}</p>
          )}
        </section>

        <label className="sr-only">
          Preview the light at another time
          <input type="range" min={RANGE[0]} max={RANGE[1]} step={15} value={Math.round(offset)} onChange={(e) => setOffset(Number(e.target.value))} />
        </label>
      </div>
    </main>
  );
}
