"use client";
// Prototype harness: the picker (PICKER.md, verbatim) over ten arrangement-map directions.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TRACK } from "./data";
import { V1, V2, V3, V4, V5 } from "./variants-a";
import { V6, V7, V8, V9, V10 } from "./variants-b";
import "./picker.css";

const VARIANTS = [
  { name: "Studio", C: V1 }, { name: "Ledger", C: V2 }, { name: "Liner", C: V3 }, { name: "Grid", C: V4 },
  { name: "Timetable", C: V5 }, { name: "Skyline", C: V6 }, { name: "Label", C: V7 }, { name: "Vertical", C: V8 },
  { name: "Score", C: V9 }, { name: "Record", C: V10 },
];

export function Harness() {
  const [cur, setCur] = useState(0);
  const [heard, setHeard] = useState(TRACK.bars);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);
  const pickerRef = useRef<HTMLElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const v = (parseInt(p.get("v") ?? "", 10) || 1) - 1;
    setCur(v >= 0 && v < VARIANTS.length ? v : 0);
    if (p.get("state") === "listening") setHeard(151);
    loaded.current = true;
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  const move = () => {
    const el = items.current[cur], hl = hlRef.current;
    if (!el || !hl) return;
    hl.style.width = el.offsetWidth + "px";
    hl.style.transform = `translateX(${el.offsetLeft}px)`;
  };
  useLayoutEffect(() => {
    move();
    if (!loaded.current) return;
    const url = new URL(location.href);
    url.searchParams.set("v", String(cur + 1));
    history.replaceState(null, "", url);
  });
  useEffect(() => {
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9 && n <= VARIANTS.length) setCur(n - 1);
      else if (e.key === "0" && VARIANTS.length >= 10) setCur(9);
      else if (e.key === "ArrowRight") setCur((c) => (c + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft") setCur((c) => (c - 1 + VARIANTS.length) % VARIANTS.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const { C } = VARIANTS[cur];
  return (
    <>
      <C key={cur} heard={heard} />
      <nav ref={pickerRef} className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined}>
        <span ref={hlRef} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map((v, i) => (
          <button key={v.name} ref={(el) => { items.current[i] = el; }} className="proto-picker-item" data-active={i === cur ? "" : undefined} aria-current={i === cur ? "true" : undefined} onClick={() => setCur(i)}>{v.name}</button>
        ))}
      </nav>
    </>
  );
}
