"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Diary } from "./diary";
import { Lines } from "./lines";
import { folio } from "./shared";
import { Wall } from "./wall";
import "./picker.css";

// Prototype harness (prototype skill): one shelf direction at a time, full size, with the
// standard picker. Nothing outside /prototypes imports from here.
const variants = [
  // Wall's sheet sits bottom-centre, so the picker moves to the top there (PICKER.md).
  { name: "Wall", Component: Wall, top: true },
  { name: "Diary", Component: Diary, top: false },
  { name: "Lines", Component: Lines, top: false },
];

export default function ShelfPrototypes() {
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const highlight = useRef<HTMLSpanElement>(null);

  const select = useCallback((i: number) => {
    if (i < 0 || i >= variants.length) return;
    setCurrent(i);
    const url = new URL(location.href);
    url.searchParams.set("v", String(i + 1));
    history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    const v = parseInt(new URLSearchParams(location.search).get("v") ?? "", 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the URL once after mount
    if (v >= 1 && v <= variants.length) setCurrent(v - 1);
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  useLayoutEffect(() => {
    const move = () => {
      const el = items.current[current];
      if (!el || !highlight.current) return;
      highlight.current.style.width = `${el.offsetWidth}px`;
      highlight.current.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= variants.length) select(num - 1);
      else if (e.key === "ArrowRight") select((current + 1) % variants.length);
      else if (e.key === "ArrowLeft") select((current - 1 + variants.length) % variants.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, select]);

  const { Component, top } = variants[current];

  return (
    <div style={folio} className="min-h-dvh bg-[var(--f-bg)] text-[var(--f-text)]">
      <Component key={current} />
      <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined}
        data-position={top ? "top" : undefined}
      >
        <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
        {variants.map((v, i) => (
          <button
            key={v.name}
            ref={(el) => {
              items.current[i] = el;
            }}
            className="proto-picker-item"
            data-active={i === current ? "" : undefined}
            aria-current={i === current ? "true" : undefined}
            onClick={() => select(i)}
          >
            {v.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
