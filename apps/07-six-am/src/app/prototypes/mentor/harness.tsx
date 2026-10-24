"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { DemoAnalyse } from "@/components/analyse/analyse-view";
import { useMentor, useSelectedTrack, type Mentor, type Preset } from "./use-mentor";
import { Counter } from "./variant-counter";
import { Liner } from "./variant-liner";
import { Rack } from "./variant-rack";
import "./picker.css";
import t from "./toggle.module.css";

const VARIANTS = [
  { name: "Counter", C: Counter, push: false },
  { name: "Liner notes", C: Liner, push: true },
  { name: "Rack", C: Rack, push: false },
];

export function Harness({ preset, v }: { preset: Preset; v: number }) {
  const [current, setCurrent] = useState(v >= 0 && v < VARIANTS.length ? v : 0);
  const [mountKey, setMountKey] = useState(0);
  const [open, setOpen] = useState(preset !== "closed");
  const pickerRef = useRef<HTMLElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const analyseRef = useRef<HTMLDivElement>(null);
  const track = useSelectedTrack(analyseRef);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => pickerRef.current?.setAttribute("data-ready", "")));
  }, []);

  const move = () => {
    const el = itemRefs.current[current];
    if (!el || !hlRef.current) return;
    hlRef.current.style.width = el.offsetWidth + "px";
    hlRef.current.style.transform = `translateX(${el.offsetLeft}px)`;
  };
  useLayoutEffect(move);
  useEffect(() => { window.addEventListener("resize", move); return () => window.removeEventListener("resize", move); });

  const set = (i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    setMountKey((k) => k + 1);
    const url = new URL(location.href);
    url.searchParams.set("v", String(i + 1));
    history.replaceState(null, "", url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) set(n - 1);
      else if (e.key === "ArrowRight") set((current + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft") set((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === "r" || e.key === "R") setMountKey((k) => k + 1);
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const V = VARIANTS[current];
  return (
    <div className={V.push && open ? t.pushWrap : t.wrap}>
      <div ref={analyseRef} className={t.analyse}>
        <DemoAnalyse listening />
      </div>
      <button className={V.push && open ? `${t.toggle} ${t.togglePush}` : t.toggle} aria-pressed={open} onClick={() => setOpen((o) => !o)}>Mentor</button>
      <Variant key={`${current}-${mountKey}`} V={V.C} track={track} preset={preset} open={open} onClose={() => setOpen(false)} />
      <nav className="proto-picker" aria-label="Prototype variants" ref={pickerRef}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={hlRef}></span>
        {VARIANTS.map((v, i) => (
          <button key={v.name} ref={(el) => { itemRefs.current[i] = el; }} className="proto-picker-item" data-active={i === current ? "" : undefined} aria-current={i === current ? "true" : undefined} onClick={() => set(i)}>{v.name}</button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true"></span>
        <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={() => setMountKey((k) => k + 1)}>↻</button>
      </nav>
    </div>
  );
}

type VProps = { V: ComponentType<{ m: Mentor; open: boolean; onClose: () => void }>; track: ReturnType<typeof useSelectedTrack>; preset: Preset; open: boolean; onClose: () => void };
function Variant({ V, track, preset, open, onClose }: VProps) {
  const m = useMentor(track, preset);
  return <V m={m} open={open} onClose={onClose} />;
}
