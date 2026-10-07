"use client";

// Prototype harness for the Horizon home screen (the /prototype skill). Not production code:
// delete this folder once a direction is promoted. Clock starts at 16:45 Bali time on 7 Oct 2026;
// `?at=06:10` starts it elsewhere, so every sky can be checked.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PlaceSearch } from "./_components/place-search";
import { PLACES, baliInstant, type Place } from "./_lib/sky";
import { Arc } from "./variant-arc";
import { Scrub } from "./variant-scrub";
import { Window } from "./variant-window";
import "./picker.css";

export type VariantProps = { place: Place; now: Date; onSearch: () => void };

const VARIANTS = [
  { name: "Window", Component: Window },
  { name: "Arc", Component: Arc },
  { name: "Scrub", Component: Scrub },
];

// Client-only (see page.tsx), so the URL can be read during the first render.
function useClock() {
  const [start] = useState(() => {
    const at = new URLSearchParams(location.search).get("at");
    return baliInstant(at && /^\d{1,2}:\d{2}$/.test(at) ? at : "16:45");
  });
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date(start.getTime() + (Date.now() - t0))), 1000);
    return () => clearInterval(id);
  }, [start, t0]);
  return now;
}

export default function Harness() {
  const now = useClock();
  const [current, setCurrent] = useState(() => {
    const v = parseInt(new URLSearchParams(location.search).get("v") ?? "", 10);
    return v >= 1 && v <= VARIANTS.length ? v - 1 : 0;
  });
  const [mountKey, setMountKey] = useState(0);
  const [place, setPlace] = useState<Place>(PLACES[0]);
  const [searching, setSearching] = useState(false);
  const [ready, setReady] = useState(false);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const highlight = useRef<HTMLSpanElement>(null);

  const moveHighlight = useCallback(() => {
    const el = items.current[current];
    if (!el || !highlight.current) return;
    highlight.current.style.width = `${el.offsetWidth}px`;
    highlight.current.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [current]);

  const setActive = useCallback((i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    setMountKey((k) => k + 1);
    const url = new URL(location.href);
    url.searchParams.set("v", String(i + 1));
    history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    // Enable the slide only after first paint, so load doesn't animate.
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  useLayoutEffect(moveHighlight, [moveHighlight]);
  useEffect(() => {
    window.addEventListener("resize", moveHighlight);
    return () => window.removeEventListener("resize", moveHighlight);
  }, [moveHighlight]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= VARIANTS.length) setActive(num - 1);
      else if (e.key === "ArrowRight") setActive((current + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft") setActive((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === "r" || e.key === "R") setMountKey((k) => k + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, setActive]);

  const { Component } = VARIANTS[current];

  return (
    <>
      <Component key={mountKey} place={place} now={now} onSearch={() => setSearching(true)} />
      {searching && (
        <PlaceSearch
          onClose={() => setSearching(false)}
          onPick={(p) => {
            setPlace(p);
            setSearching(false);
          }}
        />
      )}
      <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
        {VARIANTS.map((v, i) => (
          <button
            key={v.name}
            ref={(el) => {
              items.current[i] = el;
            }}
            className="proto-picker-item"
            data-active={i === current ? "" : undefined}
            aria-current={i === current ? "true" : undefined}
            onClick={() => setActive(i)}
          >
            {v.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={() => setMountKey((k) => k + 1)}>
          ↻
        </button>
      </nav>
    </>
  );
}
