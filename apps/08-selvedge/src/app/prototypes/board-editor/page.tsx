"use client";

// Prototype harness for the board editor: three layouts of the same editor behind the picker.
// Number keys or arrows switch; the choice is kept in ?v=. Nothing here is imported by the app.
// shortcut: a throwaway surface, delete it once a winner is promoted (prototype skill, rule 5).

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Desk from "./desk";
import Gallery from "./gallery";
import "./picker.css";
import Workbench from "./workbench";

const VARIANTS = [
  { name: "Workbench", C: Workbench, top: false },
  { name: "Desk", C: Desk, top: true },
  { name: "Gallery", C: Gallery, top: true },
];

export default function BoardEditorPrototypes() {
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const highlight = useRef<HTMLSpanElement>(null);

  // Start on ?v= (1-based), falling back to the first variant.
  useEffect(() => {
    const v = parseInt(new URLSearchParams(location.search).get("v") ?? "", 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after mount
    if (v >= 1 && v <= VARIANTS.length) setCurrent(v - 1);
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  useLayoutEffect(() => {
    const move = () => {
      const el = items.current[current], h = highlight.current;
      if (el && h) { h.style.width = `${el.offsetWidth}px`; h.style.transform = `translateX(${el.offsetLeft}px)`; }
    };
    move();
    addEventListener("resize", move);
    return () => removeEventListener("resize", move);
  }, [current]);

  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set("v", String(current + 1));
    history.replaceState(null, "", url);
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) setCurrent(n - 1);
      else if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + VARIANTS.length) % VARIANTS.length);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const { C, top } = VARIANTS[current];
  return (
    <>
      <C key={current} />
      <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined} data-position={top ? "top" : undefined}>
        <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map((v, i) => (
          <button key={v.name} ref={(el) => { items.current[i] = el; }} className="proto-picker-item"
            data-active={i === current ? "" : undefined} aria-current={i === current ? "true" : undefined}
            onClick={() => setCurrent(i)}>
            {v.name}
          </button>
        ))}
      </nav>
    </>
  );
}
