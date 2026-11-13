"use client";

// A Make macro knob (Lab S3; shared with the Studio's library block drawer, T110): drag up or
// down (Shift: finer), arrows and Page keys, Home/End, double-click resets; the word under it is
// what the value sounds like (macroWord). A gold tick marks a suggestion when there is one.
import { useRef } from "react";
import { MACRO_SPECS, macroWord, type MacroId } from "@/lib/make/presets";
import type { DrumKnobId } from "@/lib/make/drum-synth";
import s from "./knob.module.css";

/** A 96 px knob (handoff §Make 5): 270° track at 25% white, value arc in the part's colour, a dot at
 *  zero, a gold tick at the suggestion. Drag up/down (Shift for fine), arrows, Page keys, Home/End;
 *  double-click goes back to the preset's value. */
export function Knob({ id, value, sug, color, disabled, onChange, reset, size = 96, spec: own, wordOf }: { id: MacroId | DrumKnobId; value: number; sug?: number; color: string; disabled: boolean; onChange: (v: number) => void; reset: number; size?: number;
  /** Phase 5: a drum knob brings its own name, explanation and words (drum-synth.ts). */
  spec?: { name: string; explain: string }; wordOf?: (v: number) => string }) {
  const spec = own ?? MACRO_SPECS[id as MacroId];
  const say = wordOf ?? ((v: number) => macroWord(id as MacroId, v));
  const drag = useRef<{ y: number; v: number } | null>(null);
  const a0 = -135, a = a0 + 270 * value, r = size / 2 - 6, c = size / 2;
  const pt = (deg: number, rr = r) => [c + rr * Math.sin((deg * Math.PI) / 180), c - rr * Math.cos((deg * Math.PI) / 180)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a), [xe, ye] = pt(135);
  const sa = sug !== undefined ? a0 + 270 * sug : null;
  const set = (v: number) => onChange(Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000);
  const word = say(value);
  return (
    <div className={s.knob} role="slider" tabIndex={disabled ? -1 : 0} aria-label={spec.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      aria-valuetext={`${word}${sug !== undefined ? `, suggestion ${say(sug)}` : ""}`} aria-disabled={disabled || undefined} title={spec.explain}
      onPointerDown={(e) => { if (disabled || e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { y: e.clientY, v: value }; }}
      onPointerMove={(e) => { const d = drag.current; if (!d) return; set(d.v + (d.y - e.clientY) / (e.shiftKey ? 720 : 180)); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onDoubleClick={() => { if (!disabled) set(reset); }}
      onKeyDown={(e) => {
        if (disabled) return;
        const step = e.shiftKey ? 0.1 : 0.05;
        const k: Record<string, number> = { ArrowUp: value + step, ArrowRight: value + step, ArrowDown: value - step, ArrowLeft: value - step, PageUp: value + 0.1, PageDown: value - 0.1, Home: 0, End: 1 };
        if (e.key in k) { e.preventDefault(); set(k[e.key]); }
      }}>
      <svg width={size} height={size} aria-hidden>
        <path d={`M${x0} ${y0} A${r} ${r} 0 1 1 ${xe} ${ye}`} fill="none" stroke="rgba(241,230,211,.25)" strokeWidth="2" strokeLinecap="round" />
        {value <= 0.005 && <circle cx={x0} cy={y0} r="2" fill={color} />}
        {value > 0.005 && <path d={`M${x0} ${y0} A${r} ${r} 0 ${a - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {sa !== null && (() => { const [p1, q1] = pt(sa, r + 5), [p2, q2] = pt(sa, r - 5); return <line x1={p1} y1={q1} x2={p2} y2={q2} stroke="#f2b134" strokeWidth="2.5" strokeLinecap="round" />; })()}
      </svg>
      <span>{spec.name}</span>
      <small>{word}</small>
    </div>
  );
}
