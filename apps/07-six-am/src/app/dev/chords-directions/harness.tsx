"use client";

// Chords directions (Phase 6, dev only). The prototype picker (prototype skill, PICKER.md), wired as in its reference: 1–N and ←/→
// switch, R re-mounts, ?v=N persists. The variant swap is instant.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./picker.css";
import type { St } from "./shared";
import { V01Cells } from "./v01-cells";
import { V02Swap } from "./v02-swap";
import { V03Roll } from "./v03-roll";
import { V04Ladder } from "./v04-ladder";
import { V05Mentor } from "./v05-mentor";
import { V06Palette } from "./v06-palette";
import { V07Keys } from "./v07-keys";
import { V08Clips } from "./v08-clips";
import { V09Chart } from "./v09-chart";
import { V10Ear } from "./v10-ear";

const VARIANTS: { name: string; C: (p: { st: St }) => React.JSX.Element; top?: boolean }[] = [
  { name: "Cells", C: V01Cells },
  { name: "Swap", C: V02Swap },
  { name: "Roll", C: V03Roll },
  { name: "Ladder", C: V04Ladder },
  { name: "Mentor", C: V05Mentor },
  { name: "Palette", C: V06Palette },
  { name: "Keyboard", C: V07Keys },
  { name: "Clips", C: V08Clips },
  { name: "Chart", C: V09Chart },
  { name: "Ear", C: V10Ear },
].map((x) => ({ ...x, top: true }));

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
      if (e.key === "0") return set(9);
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
      <C key={key} st={st} />
      {clean && <style>{"nextjs-portal{display:none}"}</style>}
      {!clean && (
        <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined} data-position={VARIANTS[cur].top ? "top" : undefined}>
          <span ref={hl} className="proto-picker-highlight" aria-hidden="true" />
          {VARIANTS.map((v, i) => (
            <button key={v.name} ref={(el) => { items.current[i] = el; }} className="proto-picker-item" data-active={i === cur ? "" : undefined} aria-current={i === cur ? "true" : undefined} onClick={() => set(i)}>
              {v.name}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
