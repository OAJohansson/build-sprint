"use client";

// Round 2 (dev only). The prototype picker (prototype skill, PICKER.md), wired as in its reference: 1–N and ←/→
// switch, R re-mounts, ?v=N persists. The variant swap is instant.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./picker.css";
import { V01Bench } from "./v01-bench";
import { V02Drawer } from "./v02-drawer";
import { V03Rooms } from "./v03-rooms";
import { V04Steps } from "./v04-steps";
import { V05Margin } from "./v05-margin";
import { V06Twin } from "./v06-twin";
import { V07Ear } from "./v07-ear";
import { V08Lesson } from "./v08-lesson";
import { V09Rack } from "./v09-rack";
import { V10Command } from "./v10-command";

const VARIANTS: { name: string; C: () => React.JSX.Element; top?: boolean }[] = [
  { name: "Bench", C: V01Bench },
  { name: "Drawer", C: V02Drawer },
  { name: "Two rooms", C: V03Rooms },
  { name: "Steps", C: V04Steps },
  { name: "Margin notes", C: V05Margin },
  { name: "Twin lane", C: V06Twin },
  { name: "Ear trainer", C: V07Ear },
  { name: "Lesson", C: V08Lesson },
  { name: "Rack", C: V09Rack, top: true },
  { name: "Command line", C: V10Command, top: true },
];

export function Harness({ clean }: { clean: boolean }) {
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
      <C key={key} />
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
