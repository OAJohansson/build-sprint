"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import MallowApp from "./app";
import type { JourneyKind } from "./journey";

// Prototype harness: the Mallow app, with three directions for the Journey tab behind the picker.
// Delete once one is chosen.
const variants: { name: string; kind: JourneyKind }[] = [
  { name: "Timeline", kind: "timeline" },
  { name: "Calendar", kind: "calendar" },
  { name: "Chapters", kind: "chapters" },
];

export default function HomePrototypes() {
  const [current, setCurrent] = useState(0);
  const [mountKey, setMountKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const highlightRef = useRef<HTMLSpanElement>(null);

  const setActive = useCallback((i: number) => {
    if (i < 0 || i >= variants.length) return;
    setCurrent(i);
    setMountKey((k) => k + 1);
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(i + 1));
    history.replaceState(null, "", url);
  }, []);

  // Start from ?v= so a reload keeps the selection.
  useEffect(() => {
    const v = parseInt(new URLSearchParams(window.location.search).get("v") ?? "", 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL once on mount
    if (v >= 1 && v <= variants.length) setCurrent(v - 1);
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  const moveHighlight = useCallback(() => {
    const el = itemRefs.current[current];
    const hl = highlightRef.current;
    if (!el || !hl) return;
    hl.style.width = `${el.offsetWidth}px`;
    hl.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [current]);

  useLayoutEffect(() => {
    moveHighlight();
    window.addEventListener("resize", moveHighlight);
    return () => window.removeEventListener("resize", moveHighlight);
  }, [moveHighlight]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= variants.length) setActive(num - 1);
      else if (e.key === "ArrowRight") setActive((current + 1) % variants.length);
      else if (e.key === "ArrowLeft") setActive((current - 1 + variants.length) % variants.length);
      else if (e.key === "r" || e.key === "R") setMountKey((k) => k + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, setActive]);

  return (
    <>
      {/* The app reads the URL on its first render, so it only renders in the browser. */}
      {mounted && <MallowApp key={mountKey} journey={variants[current].kind} />}
      <nav className="proto-picker" aria-label="Prototype variants" data-position="top" data-ready={ready ? "" : undefined}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={highlightRef} />
        {variants.map((v, i) => (
          <button
            key={v.name}
            ref={(el) => {
              itemRefs.current[i] = el;
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
        <button
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay animation (R)"
          onClick={() => setMountKey((k) => k + 1)}
        >
          ↻
        </button>
      </nav>
    </>
  );
}
