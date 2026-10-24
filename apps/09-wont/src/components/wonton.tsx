// The mark (Dough on ink, L24): a dough purse with a pinched top, two pleats and a fine brown
// outline. Kept = dough, eyes closed in content. Comeback = matcha, winking. Empty seat = nothing.
// Promoted from the board v3 prototype (steamer3.tsx, _shared/wonton.tsx).

/** k = kept (or clean) day, c = comeback day. */
export type Mark = "k" | "c";

export const DOUGH = "#f6e8cc";
export const MATCHA = "#b9d29a";
export const LINE = "#3b2f2a";
export const PURSE = "M-11 5 Q-12 -4 -4.5 -5.5 Q0 -12 4.5 -5.5 Q12 -4 11 5 Q0 10 -11 5 Z";

export function MarkWonton({ m }: { m: Mark }) {
  const wink = m === "c";
  return (
    <g fill="none" stroke={LINE} strokeLinecap="round">
      <path d={PURSE} fill={wink ? MATCHA : DOUGH} strokeWidth=".9" strokeLinejoin="round" />
      <path d="M-4.6 -5.4 Q0 -3.8 4.6 -5.4 M-1.3 -7.9 L-1 -5.9 M1.3 -7.9 L1 -5.9" strokeWidth=".75" />
      {wink ? (
        <>
          <circle cx="-2.8" cy="1.5" r=".9" fill={LINE} stroke="none" />
          <path d="M1.8 1.2 Q2.8 2.3 3.8 1.2" strokeWidth=".75" />
        </>
      ) : (
        <path d="M-3.8 1.2 Q-2.8 2.3 -1.8 1.2 M1.8 1.2 Q2.8 2.3 3.8 1.2" strokeWidth=".75" />
      )}
      <path d="M-.8 3.6 Q0 4.1 .8 3.6" strokeWidth=".7" />
    </g>
  );
}

// Fixed footprint, seven seats (the 7-day window): four in front, three behind.
const SEATS: [number, number][] = [[16, 60], [35, 60], [54, 60], [73, 60], [25.5, 46], [44.5, 46], [63.5, 46]];
const SCALE = 0.86;

/** The steamer basket with one wonton per kept day in the window, oldest first. */
export function Steamer({ marks, fresh = false }: { marks: Mark[]; fresh?: boolean }) {
  const items = marks.slice(0, 7).map((m, i) => ({ m, i, x: SEATS[i][0], y: SEATS[i][1] }));
  const last = Math.min(marks.length, 7) - 1;
  const row = (back: boolean) =>
    items
      .filter((w) => w.y < 52 === back)
      .map((w) => (
        <g key={w.i} transform={`translate(${w.x} ${w.y}) scale(${SCALE})`}>
          <g className={fresh && w.i === last ? "w-fresh" : undefined}>
            <MarkWonton m={w.m} />
          </g>
        </g>
      ));
  return (
    <svg width="124" height="123" viewBox="0 0 89 88" aria-hidden="true">
      <ellipse cx="44.5" cy="66" rx="40" ry="7.5" fill="#c49a62" />
      {row(true)}
      {row(false)}
      <path d="M4 67 Q44.5 76.5 85 67 V79 Q85 86 77 86 H12 Q4 86 4 79 Z" fill="#dcb883" stroke="#b98f55" strokeWidth="1.5" />
      <line x1="6" y1="79.5" x2="83" y2="79.5" stroke="#c9a067" strokeWidth="1.2" />
    </svg>
  );
}

/** The mark as a character, at any size: dough with eyes closed, or matcha (or dough) winking. */
export function Wonton({
  size = 120,
  wink = false,
  matcha = false,
  className,
}: {
  size?: number;
  wink?: boolean;
  matcha?: boolean;
  className?: string;
}) {
  return (
    <svg className={className} width={size} height={size} viewBox="-14 -14 28 26" aria-hidden="true">
      <g fill="none" stroke={LINE} strokeLinecap="round">
        <path d={PURSE} fill={matcha ? MATCHA : DOUGH} strokeWidth=".7" strokeLinejoin="round" />
        <path d="M-4.6 -5.4 Q0 -3.8 4.6 -5.4 M-1.3 -7.9 L-1 -5.9 M1.3 -7.9 L1 -5.9" strokeWidth=".6" />
        {wink ? (
          <>
            <circle cx="-2.8" cy="1.5" r=".85" fill={LINE} stroke="none" />
            <path d="M1.8 1.2 Q2.8 2.3 3.8 1.2" strokeWidth=".6" />
          </>
        ) : (
          <path d="M-3.8 1.2 Q-2.8 2.3 -1.8 1.2 M1.8 1.2 Q2.8 2.3 3.8 1.2" strokeWidth=".6" />
        )}
        <path d="M-.8 3.6 Q0 4.1 .8 3.6" strokeWidth=".55" />
      </g>
    </svg>
  );
}
