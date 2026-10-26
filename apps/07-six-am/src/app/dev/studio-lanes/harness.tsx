"use client";

// The prototype picker (prototype skill, PICKER.md), wired as in its reference: 1–N and ←/→
// switch, R re-mounts, ?v=N persists. The variant swap is instant. Picker sits on top: the
// bottom of the screen is the crate or the sounds panel.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./picker.css";
import { V1Fold } from "./v1-fold";
import { V2Inspect } from "./v2-inspect";
import { V3Shelf } from "./v3-shelf";

const VARIANTS = [
  { name: "Fold", C: V1Fold },
  { name: "Inspect", C: V2Inspect },
  { name: "Shelf", C: V3Shelf },
];

export function Harness({ clean, state, worst }: { clean: boolean; state: string; worst: boolean }) {
  const [cur, setCur] = useState(0);
  const [key, setKey] = useState(0);
  const [ready, setReady] = useState(false);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const hl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const n = parseInt(new URLSearchParams(location.search).get("v") ?? "1", 10) - 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dev picker: reads ?v= after mount
    if (n >= 0 && n < VARIANTS.length) setCur(n);
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  const move = useCallback(() => {
    const el = items.current[cur];
    if (!el || !hl.current) return;
    hl.current.style.width = el.offsetWidth + "px";
    hl.current.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [cur]);
  useLayoutEffect(move, [move]);
  useEffect(() => { addEventListener("resize", move); return () => removeEventListener("resize", move); }, [move]);

  const set = useCallback((i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCur(i);
    setKey((k) => k + 1);
    const url = new URL(location.href);
    url.searchParams.set("v", String(i + 1));
    history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) set(n - 1);
      else if (e.key === "ArrowRight") set((cur + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft") set((cur - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === "r" || e.key === "R") setKey((k) => k + 1);
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, [cur, set]);

  const { C } = VARIANTS[cur];
  return (
    <>
      <C key={key} state={state} worst={worst} />
      {clean && <style>{"nextjs-portal{display:none} *{animation:none!important}"}</style>}
      {!clean && (
        <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined} data-position="top">
          <span ref={hl} className="proto-picker-highlight" aria-hidden="true" />
          {VARIANTS.map((x, i) => (
            <button key={x.name} ref={(el) => { items.current[i] = el; }} className="proto-picker-item" data-active={i === cur ? "" : undefined} aria-current={i === cur ? "true" : undefined} onClick={() => set(i)}>
              {x.name}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
