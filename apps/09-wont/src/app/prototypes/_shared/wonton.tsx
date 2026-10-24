import { DOUGH, LINE, MATCHA, PURSE } from "../board/steamer3";

// The mark as a character, at any size: dough with eyes closed, or matcha (or dough) winking.
export function Wonton({ size = 120, wink = false, matcha = false, className }: { size?: number; wink?: boolean; matcha?: boolean; className?: string }) {
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
