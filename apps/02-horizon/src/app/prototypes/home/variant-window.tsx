"use client";

// Window: scene first. The screen is a window onto the place's sky; the sun sits at its real
// height and sinks toward the landmark; the countdown floats on the sky.
import { Landmark } from "./_components/landmark";
import { PlaceButton } from "./_components/place-button";
import { Stars } from "./_components/stars";
import { clock, dayFraction, gradient, view } from "./_lib/sky";
import type { VariantProps } from "./harness";
import "./variants.css";

const HORIZON = 74; // % from the top where the land meets the sky

export function Window({ place, now, onSearch }: VariantProps) {
  const v = view(place, now);
  const { f } = dayFraction(place, now);
  const sunUp = v.alt > -4;
  // Across: 12% → 88% of the width through the day. Up: 0° sits on the horizon, 50° near the top.
  const sunX = 12 + f * 76;
  const sunY = HORIZON - (Math.min(48, Math.max(-6, v.alt)) / 50) * (HORIZON - 14);
  const kind = v.event?.kind;
  const golden = kind === "sunset" ? v.day.goldenStart : v.day.goldenEnd;

  return (
    <main className="hz fixed inset-0 overflow-hidden bg-[#0b1022]">
      <div key={place.id} className="hz-sky-in absolute inset-0" style={{ background: gradient(v.sky) }} />
      <Stars opacity={v.sky.stars} />

      {sunUp && (
        <div
          className="pointer-events-none absolute"
          style={{ left: `${sunX}%`, top: `${sunY}%`, transform: "translate(-50%, -50%)", transition: "left 1s linear, top 1s linear" }}
          aria-hidden="true"
        >
          <div className="hz-sun-in size-16 rounded-full" style={{ background: "radial-gradient(circle, #fff8e7 0%, #ffe2a8 45%, rgb(255 210 140 / 0) 72%)", boxShadow: "0 0 80px 30px rgb(255 214 150 / 0.35)" }} />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0" style={{ top: `${HORIZON}%`, background: v.sky.land }} />
      <Landmark id={place.landmark} fill={v.sky.land} className="pointer-events-none absolute inset-x-0 w-full" style={{ bottom: `${100 - HORIZON - 0.2}%`, height: "24%" }} />

      <div className="relative flex h-full flex-col px-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="hz-rise" style={{ ["--i" as string]: 0 }}>
          <PlaceButton place={place} localTime={v.localTime} ink={v.sky.ink} inkSoft={v.sky.inkSoft} onClick={onSearch} />
        </div>

        <section className="mt-[12vh]" style={{ color: v.sky.ink }} aria-live="polite">
          {v.event && v.left ? (
            <>
              <p className="hz-rise text-[clamp(64px,22vw,96px)] font-extralight leading-none tracking-[-0.04em] tabular-nums" style={{ ["--i" as string]: 1 }}>
                {v.left.short}
              </p>
              <p className="hz-rise mt-3 text-lg" style={{ ["--i" as string]: 2, color: v.sky.inkSoft }}>
                until {kind}
                {v.tomorrow ? " tomorrow" : ""} · {clock(v.event.at, place.tz)}
              </p>
              <p className="hz-rise mt-1 text-sm tabular-nums" style={{ ["--i" as string]: 3, color: v.sky.inkSoft }}>
                {golden && (kind === "sunset" ? `Golden hour from ${clock(golden, place.tz)}` : `Golden light until ${clock(golden, place.tz)}`)}
                {golden ? " · " : ""}
                {kind === "sunset" ? `Sunrise ${clock(v.day.sunrise, place.tz)}` : `Sunset ${clock(v.day.sunset, place.tz)}`}
              </p>
            </>
          ) : (
            <p className="hz-rise text-3xl font-light" style={{ ["--i" as string]: 1 }}>
              {v.day.alwaysUp ? "The sun doesn’t set here today" : "The sun doesn’t rise here today"}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
