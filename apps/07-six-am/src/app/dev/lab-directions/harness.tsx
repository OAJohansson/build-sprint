"use client";

// The prototype picker (prototype skill, PICKER.md), wired as in its reference: 1–N and ←/→
// switch, R re-mounts, ?v=N persists. The variant swap is instant.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./picker.css";
import { V01Map } from "./v01-map";
import { V02Columns } from "./v02-columns";
import { V03Tabs } from "./v03-tabs";
import { V04Steps } from "./v04-steps";
import { V05Bench } from "./v05-bench";
import { V06Mentor } from "./v06-mentor";
import { V07Room } from "./v07-room";
import { V08Crate } from "./v08-crate";
import { V09Subtitles } from "./v09-subtitles";
import { V10Chain } from "./v10-chain";

const VARIANTS = [
  { name: "Map", C: V01Map },
  { name: "Columns", C: V02Columns },
  { name: "Tabs", C: V03Tabs },
  { name: "Steps", C: V04Steps },
  { name: "Bench", C: V05Bench },
  { name: "Mentor", C: V06Mentor },
  { name: "Room", C: V07Room },
  { name: "Crate", C: V08Crate },
  { name: "Subtitles", C: V09Subtitles, top: true },
  { name: "Chain", C: V10Chain },
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
