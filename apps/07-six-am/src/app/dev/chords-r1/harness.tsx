"use client";

// Chords round 1 (Phase 6, dev only): the owner's three picks (L260) behind the prototype picker.
// 1–3 and ←/→ switch, ?v=N persists, the swap is instant.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "../chords-directions/picker.css";
import { Ear } from "./e-ear";
import { Keyboard } from "./k-keyboard";
import { Palette } from "./p-palette";
import type { St } from "./lib";

const VARIANTS: { name: string; C: (p: { st: St }) => React.JSX.Element }[] = [
  { name: "Palette", C: Palette },
  { name: "Keyboard", C: Keyboard },
  { name: "Ear", C: Ear },
];

export function Harness({ clean, st }: { clean: boolean; st: St }) {
  const [cur, setCur] = useState(0);
  const [key, setKey] = useState(0);
  const [ready, setReady] = useState(false);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const hl = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const v = parseInt(new URLSearchParams(location.search).get("v") ?? "1", 10) - 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dev picker: reads ?v= after mount
    if (v >= 0 && v < VARIANTS.length) setCur(v);
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);
  const move = useCallback(() => {
    const el = items.current[cur];
    if (!el || !hl.current) return;
    hl.current.style.width = el.offsetWidth + "px";
    hl.current.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [cur]);
  useLayoutEffect(move, [move]);
  const set = useCallback((i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCur(i); setKey((k) => k + 1);
    const url = new URL(location.href); url.searchParams.set("v", String(i + 1)); history.replaceState(null, "", url);
  }, []);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) set(n - 1);
      else if (e.key === "ArrowRight") set((cur + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft") set((cur - 1 + VARIANTS.length) % VARIANTS.length);
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, [cur, set]);
  const { C } = VARIANTS[cur];
  return (
    <>
      <C key={key} st={st} />
      {clean && <style>{"nextjs-portal{display:none}"}</style>}
      {!clean && (
        <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined} data-position="top">
          <span ref={hl} className="proto-picker-highlight" aria-hidden="true" />
          {VARIANTS.map((x, i) => (
            <button key={x.name} ref={(el) => { items.current[i] = el; }} className="proto-picker-item" data-active={i === cur ? "" : undefined} aria-current={i === cur ? "true" : undefined} onClick={() => set(i)}>{x.name}</button>
          ))}
        </nav>
      )}
    </>
  );
}
