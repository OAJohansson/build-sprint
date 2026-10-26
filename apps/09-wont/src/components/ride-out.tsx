"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { Wonton } from "./wonton";

// The urge's 60-second "ride it out" pause (T2, T13): full screen, one tap to leave at any time.
// The urge is already logged when this opens, so leaving early loses nothing.
const RIDE_S = 60;

export function RideOut({
  replacement,
  onExit,
  onComplete,
}: {
  replacement: string;
  /** Left early with "I'm OK now". */
  onExit: () => void;
  /** The 60 s ran to the end: the urge was ridden out. */
  onComplete: () => void;
}) {
  const [left, setLeft] = useState(RIDE_S);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const next = RIDE_S - Math.floor((Date.now() - start) / 1000);
      if (next <= 0) {
        window.clearInterval(id);
        onComplete();
      } else setLeft(next);
    }, 250);
    return () => window.clearInterval(id);
  }, [onComplete]);

  return (
    <section className="w-ride" role="dialog" aria-modal="true" aria-label={copy.ride.label}>
      <div className="w-ring">
        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
          <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(246,232,204,.14)" strokeWidth="6" />
          <circle
            className="w-ring-progress"
            cx="110"
            cy="110"
            r="100"
            fill="none"
            stroke="#b9d29a"
            strokeWidth="6"
            strokeLinecap="round"
            transform="rotate(-90 110 110)"
          />
        </svg>
        <Wonton size={110} />
      </div>
      <p className="w-ride-time" aria-live="off">{copy.ride.seconds(left)}</p>
      <h2>{copy.ride.title}</h2>
      <p>{copy.ride.body(replacement)}</p>
      <button type="button" className="w-ride-exit" onClick={onExit} autoFocus>
        {copy.ride.exit}
      </button>
    </section>
  );
}
