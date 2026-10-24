import type { Mark, VesselProps } from "./vessels";

// Wontons v2: purse wontons in a steamer with a fixed footprint and seven seats (the 7-day window).
// Thin, slightly see-through wrapper, gathered pleats to a pinched top, filling showing through,
// a small highlight. A comeback wonton has a rose filling: a mark, not a warning.
function Purse({ x, y, m, fresh, pending }: { x: number; y: number; m?: Mark; fresh?: boolean; pending?: boolean }) {
  if (pending) {
    return (
      <g fill="none" stroke="#c9a874" strokeWidth="1.2" strokeDasharray="2.4 2">
        <path d={`M${x - 9} ${y + 5} Q${x - 10} ${y - 2} ${x - 4} ${y - 5} Q${x} ${y - 12} ${x + 4} ${y - 5} Q${x + 10} ${y - 2} ${x + 9} ${y + 5} Q${x} ${y + 9} ${x - 9} ${y + 5} Z`} />
      </g>
    );
  }
  const filling = m === "c" ? "#e7a1ac" : "#dcae74";
  return (
    <g className={fresh ? "w2-fresh" : undefined}>
      <ellipse cx={x} cy={y + 7.5} rx="9" ry="2" fill="#7a5a33" opacity=".18" />
      {/* wrapper body */}
      <path d={`M${x - 9.5} ${y + 5} Q${x - 10.5} ${y - 2} ${x - 4} ${y - 5} L${x + 4} ${y - 5} Q${x + 10.5} ${y - 2} ${x + 9.5} ${y + 5} Q${x} ${y + 9.5} ${x - 9.5} ${y + 5} Z`} fill="#fbf2df" stroke="#d9bd90" strokeWidth="1" />
      {/* filling showing through */}
      <ellipse cx={x} cy={y + 2} rx="6" ry="4.2" fill={filling} opacity=".55" />
      {/* gathered top, pinched */}
      <path d={`M${x - 4.5} ${y - 4.5} Q${x - 7} ${y - 9} ${x - 2.5} ${y - 10.5} Q${x} ${y - 13.5} ${x + 2.5} ${y - 10.5} Q${x + 7} ${y - 9} ${x + 4.5} ${y - 4.5} Z`} fill="#fbf2df" stroke="#d9bd90" strokeWidth="1" />
      {/* pleats */}
      <path d={`M${x - 6.5} ${y - 1} L${x - 1.6} ${y - 8} M${x} ${y - 2.5} L${x} ${y - 9} M${x + 6.5} ${y - 1} L${x + 1.6} ${y - 8}`} stroke="#d9bd90" strokeWidth=".9" strokeLinecap="round" />
      {/* highlight */}
      <ellipse cx={x - 5.2} cy={y + 1} rx="1.4" ry="2.4" fill="#fff" opacity=".85" />
    </g>
  );
}

const SEATS = [[16, 56], [32, 56], [48, 56], [64, 56], [24, 45], [40, 45], [56, 45]];

export function Steamer2(p: VesselProps) {
  const items = p.marks.slice(0, 7).map((m, i) => ({ m, i, x: SEATS[i][0], y: SEATS[i][1] }));
  const pend = p.pending && p.marks.length < 7 ? SEATS[p.marks.length] : null;
  const fresh = (i: number) => p.fresh && i === p.marks.length - 1;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
      {/* inside of the basket, always the same footprint */}
      <ellipse cx="42" cy="62" rx="37" ry="8" fill="#c79e66" />
      <ellipse cx="42" cy="62" rx="33" ry="6" fill="#d8b47c" />
      {items.filter((w) => w.y < 50).map((w) => <Purse key={w.i} x={w.x} y={w.y} m={w.m} fresh={fresh(w.i)} />)}
      {pend && pend[1] < 50 && <Purse x={pend[0]} y={pend[1]} pending />}
      {items.filter((w) => w.y >= 50).map((w) => <Purse key={w.i} x={w.x} y={w.y} m={w.m} fresh={fresh(w.i)} />)}
      {pend && pend[1] >= 50 && <Purse x={pend[0]} y={pend[1]} pending />}
      {/* front of the basket */}
      <path d="M5 62 Q42 71 79 62 V74 Q79 81 71 81 H13 Q5 81 5 74 Z" fill="#e2c08c" stroke="#b98f55" strokeWidth="1.4" />
      <path d="M6 70 Q42 78 78 70" fill="none" stroke="#c9a067" strokeWidth="1.1" />
    </svg>
  );
}
