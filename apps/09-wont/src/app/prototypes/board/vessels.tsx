// The three containers on the left of each card. Same props, same 84 x 84 box.
// Honey = a kept day, rose = a comeback day, dashed = today, still open (stop habit).
export type Mark = "k" | "c";
export type VesselProps = { marks: Mark[]; fresh: boolean; pending?: boolean };

const HONEY = "#e2a43b";
const ROSE = "#d9788a";

// Index of the newest mark, which gets the one small celebration when it was just logged.
const isFresh = (i: number, p: VesselProps) => p.fresh && i === p.marks.length - 1;

export function Jar(p: VesselProps) {
  const pos = [[30, 70], [42, 70], [54, 70], [36, 59], [48, 59], [30, 48], [42, 48], [54, 48]];
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
      <rect x="26" y="4" width="32" height="9" rx="3" fill="#c9b8a0" />
      <path d="M20 17 Q20 13 24 13 H60 Q64 13 64 17 V72 Q64 80 56 80 H28 Q20 80 20 72 Z" fill="#e3eeec" stroke="#9fbcb8" strokeWidth="1.5" />
      {p.marks.slice(0, 8).map((m, i) => (
        <circle key={i} className={isFresh(i, p) ? "wb-fresh" : undefined} cx={pos[i][0]} cy={pos[i][1]} r="5.6" fill={m === "c" ? ROSE : HONEY} />
      ))}
      {p.pending && <circle cx={pos[p.marks.length][0]} cy={pos[p.marks.length][1]} r="5" fill="none" stroke={HONEY} strokeWidth="1.5" strokeDasharray="2.5 2" />}
    </svg>
  );
}

// A flat wonton: a soft dome with a pinched knot on top.
function Wonton({ x, y, m, fresh, pending }: { x: number; y: number; m?: Mark; fresh?: boolean; pending?: boolean }) {
  const fill = pending ? "none" : m === "c" ? "#f3c6cd" : "#f5d58f";
  const stroke = m === "c" ? ROSE : HONEY;
  return (
    <g className={fresh ? "wb-fresh" : undefined} strokeDasharray={pending ? "2.5 2" : undefined} strokeLinejoin="round">
      <path d={`M${x - 10} ${y + 5} Q${x - 11} ${y - 5} ${x} ${y - 6} Q${x + 11} ${y - 5} ${x + 10} ${y + 5} Q${x} ${y + 9} ${x - 10} ${y + 5} Z`} fill={fill} stroke={stroke} strokeWidth="1.4" />
      <path d={`M${x - 4.5} ${y - 5.5} Q${x - 3} ${y - 13} ${x} ${y - 10} Q${x + 3} ${y - 13} ${x + 4.5} ${y - 5.5}`} fill={fill} stroke={stroke} strokeWidth="1.4" />
      {!pending && <path d={`M${x - 4} ${y + 2} Q${x} ${y + 4} ${x + 4} ${y + 2}`} fill="none" stroke={stroke} strokeWidth="1" opacity=".6" />}
    </g>
  );
}

export function Steamer(p: VesselProps) {
  // Front row of four fills first, then a back row of three peeking over it.
  const pos = [[18, 54], [34, 54], [50, 54], [66, 54], [26, 42], [42, 42], [58, 42]];
  const items = p.marks.slice(0, 7).map((m, i) => ({ m, i, x: pos[i][0], y: pos[i][1] }));
  const pend = p.pending && p.marks.length < 7 ? { x: pos[p.marks.length][0], y: pos[p.marks.length][1] } : null;
  const back = items.filter((w) => w.y < 50);
  const front = items.filter((w) => w.y >= 50);
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
      <ellipse cx="42" cy="60" rx="36" ry="7" fill="#c49a62" />
      {back.map((w) => <Wonton key={w.i} x={w.x} y={w.y} m={w.m} fresh={isFresh(w.i, p)} />)}
      {pend && pend.y < 50 && <Wonton x={pend.x} y={pend.y} pending />}
      {front.map((w) => <Wonton key={w.i} x={w.x} y={w.y} m={w.m} fresh={isFresh(w.i, p)} />)}
      {pend && pend.y >= 50 && <Wonton x={pend.x} y={pend.y} pending />}
      <path d="M6 61 Q42 70 78 61 V74 Q78 81 70 81 H14 Q6 81 6 74 Z" fill="#dcb883" stroke="#b98f55" strokeWidth="1.5" />
      <line x1="8" y1="74" x2="76" y2="74" stroke="#c9a067" strokeWidth="1.2" />
    </svg>
  );
}

export function Pot(p: VesselProps) {
  const n = Math.min(p.marks.length, 8);
  const top = 58 - 6 - (n + (p.pending ? 1 : 0)) * 6.4;
  const leaf = (i: number) => {
    const y = 52 - i * 6.4, d = i % 2 ? 1 : -1, lx = 42 + d * 8.5;
    return { y, d, lx };
  };
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
      <path d={`M42 58 L42 ${top}`} stroke="#5e7d4a" strokeWidth="2.2" strokeLinecap="round" />
      {p.marks.slice(0, 8).map((m, i) => {
        const { y, d, lx } = leaf(i);
        return (
          <ellipse key={i} className={isFresh(i, p) ? "wb-fresh-leaf" : undefined} cx={lx} cy={y} rx="8.5" ry="3.6" fill={m === "c" ? ROSE : "#7a9a5a"} transform={`rotate(${d * -25} ${lx} ${y})`} />
        );
      })}
      {p.pending && (() => {
        const { y, d, lx } = leaf(n);
        return <ellipse cx={lx} cy={y} rx="8.5" ry="3.6" fill="none" stroke="#7a9a5a" strokeWidth="1.3" strokeDasharray="2.5 2" transform={`rotate(${d * -25} ${lx} ${y})`} />;
      })()}
      <rect x="22" y="58" width="40" height="7" rx="2" fill="#b5865a" />
      <path d="M25 65 H59 L55 80 H29 Z" fill="#c69a6b" />
    </svg>
  );
}
