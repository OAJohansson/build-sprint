"use client";

import { useEffect, useRef, useState } from "react";
import { Steamer3 } from "../board/steamer3";
import { Wonton } from "../_shared/wonton";

// The slip and urge moments on the stop card (P7, P14, P16, A12).
// Slip: pick the size, then one warm line and one next step; clean days never drop.
// Urge: a 60-second "ride it out" pause, one tap to leave at any time.
export type SlipDemo = "card" | "size" | "slipped" | "urge" | "urge-done";
const RIDE = 60;

export function SlipMoments({ demo }: { demo: SlipDemo }) {
  const [clean, setClean] = useState(demo === "card" || demo === "size" || demo === "urge" || demo === "urge-done");
  const [sheet, setSheet] = useState(demo === "size");
  const [size, setSize] = useState<string | null>(demo === "slipped" ? "1" : null);
  const [urges, setUrges] = useState(demo === "urge-done" ? 1 : 0);
  const [riding, setRiding] = useState(demo === "urge");
  const [left, setLeft] = useState(demo === "urge" ? 42 : RIDE);
  const leftRef = useRef(left);

  useEffect(() => {
    if (!riding) return;
    const id = setInterval(() => {
      leftRef.current -= 1;
      if (leftRef.current <= 0) {
        clearInterval(id);
        setRiding(false);
        setUrges((u) => u + 1);
      } else setLeft(leftRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [riding]);

  const startRide = () => { leftRef.current = RIDE; setLeft(RIDE); setRiding(true); };
  const endRide = () => { setRiding(false); setUrges((u) => u + 1); };
  const pick = (s: string) => { setSize(s); setClean(false); setSheet(false); };
  const status = size
    ? `${size === "1" ? "1 pouch" : `${size} pouches`} today · 2 clean days still count`
    : clean ? "Clean so far" : "Tap if clean so far";

  return (
    <main className="ws">
      <header className="ws-band">
        <h1>Saturday</h1>
        <p>The stop card, on its own</p>
      </header>

      <div className="ws-body">
        <article className={`ws-card ws-tappable ${clean ? "kept" : ""}`} style={{ gridTemplateColumns: "124px 1fr" }}>
          <button type="button" className="ws-hit" aria-pressed={clean} aria-label={clean ? "Clean so far, tap to undo" : "Tap if clean so far"} onClick={() => { setClean(!clean); setSize(null); }} />
          <div className="art"><Steamer3 marks={["k", "k"]} fresh={false} /></div>
          <div>
            <h2>Nicotine pouches</h2>
            <p className="rate">2 clean days</p>
            <p className="an">After meals, with coffee. Instead: chewing gum</p>
            <p className="st">
              {status}
              {urges > 0 && ` · ${urges === 1 ? "an urge" : `${urges} urges`} ridden out`}
            </p>
            {size && <p className="an" style={{ color: "var(--ink)" }}>Next coffee: gum first.</p>}
            <div className="ws-over" style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" className="ws-quiet" style={{ flex: 1 }} onClick={() => setSheet(true)}>Slipped</button>
              <button type="button" className="ws-quiet" style={{ flex: 1 }} onClick={startRide}>Had an urge</button>
            </div>
          </div>
        </article>
        <p className="ws-label">Tap the card for clean so far. Slipped and Had an urge are separate.</p>
      </div>

      {/* Slip size sheet */}
      <div className="sl-scrim" data-open={sheet ? "" : undefined} onClick={() => setSheet(false)} />
      <section className="sl-sheet" data-open={sheet ? "" : undefined} aria-hidden={!sheet} aria-label="Log a slip">
        <h2>How many today?</h2>
        <p>It happens. Logging it honestly is the habit.</p>
        <div className="sl-sizes">
          {["1", "2", "3+"].map((s) => (
            <button key={s} type="button" className="ws-quiet" onClick={() => pick(s)}>{s}</button>
          ))}
        </div>
        <button type="button" className="sl-link" onClick={() => setSheet(false)}>Not now</button>
      </section>

      {/* Ride it out */}
      {riding && (
        <section className="sl-ride" role="dialog" aria-label="Ride out the urge">
          <div className="sl-ring">
            <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
              <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(246,232,204,.14)" strokeWidth="6" />
              <circle className="sl-progress" cx="110" cy="110" r="100" fill="none" stroke="#b9d29a" strokeWidth="6" strokeLinecap="round"
                style={{ animationDelay: `-${RIDE - left}s` }} transform="rotate(-90 110 110)" />
            </svg>
            <Wonton size={110} className="sl-char" />
          </div>
          <p className="sl-time" aria-live="polite">{left} s</p>
          <h2>Let this one pass</h2>
          <p>Urges rise and fall, usually within a few minutes. Chew a piece of gum and breathe out slowly.</p>
          <button type="button" className="sl-exit" onClick={endRide}>I&apos;m OK now</button>
        </section>
      )}
    </main>
  );
}
