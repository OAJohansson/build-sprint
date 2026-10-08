"use client";

import { TypewriterShell } from "./shell";

// Direction 3 · Ink drawing: the typewriter as a fine sepia line drawing on cream, like an old
// patent sketch. Flat and calm; the fan of typebars is the giveaway.
const r2 = (n: number) => Math.round(n * 100) / 100;

function Drawing() {
  const bars = Array.from({ length: 23 }, (_, i) => Math.PI + (Math.PI * (i + 0.5)) / 23);
  const rows = [
    { y: 128, n: 10, x0: 54 },
    { y: 150, n: 9, x0: 66 },
    { y: 172, n: 8, x0: 78 },
  ];
  return (
    <svg className="dr-svg" viewBox="0 0 360 200" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* platen and knobs */}
        <rect x="26" y="2" width="308" height="16" rx="8" className="dr-fill" />
        <line x1="34" y1="10" x2="326" y2="10" strokeWidth="0.6" />
        <rect x="8" y="0" width="16" height="20" rx="4" className="dr-fill" />
        <rect x="336" y="0" width="16" height="20" rx="4" className="dr-fill" />
        {[11, 14, 17, 20].map((x) => <line key={x} x1={x} y1="3" x2={x} y2="17" strokeWidth="0.6" />)}
        {[339, 342, 345, 348].map((x) => <line key={x} x1={x} y1="3" x2={x} y2="17" strokeWidth="0.6" />)}
        {/* body */}
        <path d="M30 24 H330 Q346 24 348 40 L356 182 Q358 196 344 196 H16 Q2 196 4 182 L12 40 Q14 24 30 24 Z" />
        {/* typebar fan */}
        <path d="M120 92 A60 60 0 0 1 240 92" />
        {bars.map((a, i) => (
          <line key={i} x1={r2(180 + Math.cos(a) * 24)} y1={r2(92 + Math.sin(a) * 24)} x2={r2(180 + Math.cos(a) * 56)} y2={r2(92 + Math.sin(a) * 56)} strokeWidth="0.8" />
        ))}
        <rect x="170" y="30" width="20" height="10" rx="2" />
        <line x1="40" y1="104" x2="320" y2="104" strokeWidth="0.8" />
        {/* keys */}
        {rows.map((r) =>
          Array.from({ length: r.n }, (_, i) => <circle key={`${r.y}-${i}`} cx={r.x0 + i * 25} cy={r.y} r="8.5" />),
        )}
        <rect x="110" y="186" width="140" height="6" rx="3" />
      </g>
    </svg>
  );
}

export default function Drawn() {
  return (
    <TypewriterShell
      theme="tw-drawn"
      machine={({ s }) => (
        <div className="dr-body">
          <Drawing />
          <div className="dr-actions">
            <button className="dr-btn" onClick={s.anotherSpark}>
              Another spark
            </button>
            <button className="dr-btn dr-main" onClick={s.setDown}>
              Set down the pen
            </button>
          </div>
        </div>
      )}
    />
  );
}
