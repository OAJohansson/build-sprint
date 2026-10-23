"use client";

// Prototype harness: one Analyse direction at a time, full size, behind the standard picker
// (prototype skill, PICKER.md). ?v=1..3 picks the direction, ?state=main|empty|listen the state,
// ?shot=1 hides the picker for screenshots.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Inspector } from "./variant-inspector";
import { Inline } from "./variant-inline";
import { Deck } from "./variant-deck";
import { START_AT, WINDOW } from "./sample";
import "./picker.css";

export type ProtoState = "main" | "empty" | "listen";
export type VariantProps = { state: ProtoState; seconds: number };

const VARIANTS = [
  { name: "Inspector", C: Inspector, top: false },
  { name: "Inline", C: Inline, top: false },
  { name: "Deck", C: Deck, top: true }, // the deck sits bottom-centre, so the picker moves up
];

export function Harness({ state }: { state: ProtoState }) {
  const [current, setCurrent] = useState(0);
  const [shot, setShot] = useState(false);
  const [seconds, setSeconds] = useState(START_AT);
  const picker = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const v = (parseInt(p.get("v") ?? "1", 10) || 1) - 1;
    // Reading the URL once on mount; the server can't know ?v without a round trip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(v >= 0 && v < VARIANTS.length ? v : 0);
    setShot(p.get("shot") === "1");
    requestAnimationFrame(() => requestAnimationFrame(() => picker.current?.setAttribute("data-ready", "")));
  }, []);

  // The listening window counts up while a track is analysed (the one thing that moves).
  useEffect(() => {
    if (state !== "main" || shot) return;
    const id = setInterval(() => setSeconds((s) => Math.min(WINDOW, s + 1)), 1000);
    return () => clearInterval(id);
  }, [state, shot]);

  useLayoutEffect(() => {
    const el = items.current[current];
    if (!el || !highlight.current) return;
    highlight.current.style.width = `${el.offsetWidth}px`;
    highlight.current.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [current, shot]);

  const set = (i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    const url = new URL(location.href);
    url.searchParams.set("v", String(i + 1));
    history.replaceState(null, "", url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) set(n - 1);
      else if (e.key === "ArrowRight") set((current + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft") set((current - 1 + VARIANTS.length) % VARIANTS.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const V = VARIANTS[current].C;
  return (
    <>
      <V key={current} state={state} seconds={seconds} />
      {shot ? null : (
        <nav ref={picker} className="proto-picker" aria-label="Prototype variants" data-position={VARIANTS[current].top ? "top" : undefined}>
          <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
          {VARIANTS.map((v, i) => (
            <button
              key={v.name}
              ref={(el) => { items.current[i] = el; }}
              className="proto-picker-item"
              data-active={i === current ? "" : undefined}
              aria-current={i === current ? "true" : undefined}
              onClick={() => set(i)}
            >
              {v.name}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
