"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Board, type DemoState } from "./board";
import { Jar, Pot, Steamer, type VesselProps } from "./vessels";
import "./picker.css";

const VARIANTS: { name: string; title: string; Vessel: (p: VesselProps) => React.ReactNode }[] = [
  { name: "Jars", title: "Saturday's jars", Vessel: Jar },
  { name: "Wontons", title: "Saturday's wontons", Vessel: Steamer },
  { name: "Seed sprout", title: "Saturday's garden", Vessel: Pot },
];

// Prototype picker (prototype skill, PICKER.md): same markup, classes and behaviour.
export function Harness({ initial, demo }: { initial: number; demo: DemoState }) {
  const [current, setCurrent] = useState(initial);
  const [nonce, setNonce] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setActive = (i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    const url = new URL(location.href);
    url.searchParams.set("v", String(i + 1));
    history.replaceState(null, "", url);
  };

  useLayoutEffect(() => {
    const move = () => {
      const el = itemRefs.current[current];
      const hl = highlightRef.current;
      if (!el || !hl) return;
      hl.style.width = el.offsetWidth + "px";
      hl.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    move();
    addEventListener("resize", move);
    return () => removeEventListener("resize", move);
  }, [current]);

  useEffect(() => {
    // Enable the slide only after first paint, so load doesn't animate.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => navRef.current?.setAttribute("data-ready", "")));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      const n = VARIANTS.length;
      if (num >= 1 && num <= n) setActive(num - 1);
      else if (e.key === "ArrowRight") setActive((current + 1) % n);
      else if (e.key === "ArrowLeft") setActive((current - 1 + n) % n);
      else if (e.key === "r" || e.key === "R") setNonce((x) => x + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const v = VARIANTS[current];
  return (
    <>
      <Board key={`${current}-${nonce}`} title={v.title} Vessel={v.Vessel} demo={demo} />
      <nav ref={navRef} className="proto-picker" aria-label="Prototype variants">
        <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map((x, i) => (
          <button
            key={x.name}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="proto-picker-item"
            data-active={i === current ? "" : undefined}
            aria-current={i === current ? "true" : undefined}
            onClick={() => setActive(i)}
          >
            {x.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={() => setNonce((x) => x + 1)}>
          ↻
        </button>
      </nav>
    </>
  );
}
