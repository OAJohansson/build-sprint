"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Steamer3 } from "../board/steamer3";
import { Wonton } from "../_shared/wonton";

// First-launch intro (R1): three messages, about 18 s, skippable and replayable.
// Gate (animate skill): rare / first-time, purpose = explanation. Tool: CSS keyframes for the
// predetermined entrances (transform + opacity, strong ease-out), a linear progress bar,
// React state only to step the scenes. Reduced motion: fades only, no movement.
const SCENE_MS = 6000;
type Scene = 0 | 1 | 2 | 3; // 3 = the end card

export function Intro({ start, hold }: { start: Scene; hold: boolean }) {
  const [scene, setScene] = useState<Scene>(start);
  const [run, setRun] = useState(0); // re-mount key for "watch again"
  const [winked, setWinked] = useState(hold && start === 2);

  useEffect(() => {
    if (hold || scene === 3) return;
    const next = setTimeout(() => setScene((s) => (s + 1) as Scene), SCENE_MS);
    // Scene 3: the comeback wonton drops in, then the big wonton winks.
    const wink = scene === 2 ? setTimeout(() => setWinked(true), 2200) : undefined;
    return () => { clearTimeout(next); if (wink) clearTimeout(wink); };
  }, [scene, run, hold]);

  const replay = () => { setWinked(false); setScene(0); setRun((r) => r + 1); };

  return (
    <main className="in">
      {scene < 3 && (
        <div className="in-top">
          <div className="in-progress" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i}>
                <i key={`${run}-${scene}`} className={i < scene ? "done" : i === scene ? (hold ? "done" : "now") : ""} style={{ animationDuration: `${SCENE_MS}ms` }} />
              </span>
            ))}
          </div>
          <button type="button" className="in-skip" onClick={() => setScene(3)}>Skip</button>
        </div>
      )}

      <section key={`${run}-${scene}`} className="in-scene" aria-live="polite">
        {scene === 0 && (
          <>
            <div className="in-art in-weeks">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="in-a" style={{ ["--d" as string]: `${300 + i * 140}ms` }}>
                  <Wonton size={50} />
                  <small>{i + 1}</small>
                </div>
              ))}
              <p className="in-a in-axis" style={{ ["--d" as string]: "1700ms" }}>weeks</p>
            </div>
            <h1 className="in-a" style={{ ["--d" as string]: "100ms" }}>About two months, not 21 days.</h1>
            <p className="in-a" style={{ ["--d" as string]: "200ms" }}>Most habits take around two months to feel automatic, sometimes longer. That&apos;s normal, not a failure.</p>
          </>
        )}

        {scene === 1 && (
          <>
            <div className="in-art in-tie">
              <div className="in-a in-pill" style={{ ["--d" as string]: "300ms" }}>After my morning coffee</div>
              <div className="in-a in-link" style={{ ["--d" as string]: "800ms" }}><Wonton size={56} /></div>
              <div className="in-a in-pill dough" style={{ ["--d" as string]: "1200ms" }}>I write one sentence</div>
            </div>
            <h1 className="in-a" style={{ ["--d" as string]: "100ms" }}>Tie it to something you already do.</h1>
            <p className="in-a" style={{ ["--d" as string]: "200ms" }}>Pick a moment that already happens every day. The new habit rides along with it.</p>
          </>
        )}

        {scene === 2 && (
          <>
            <div className="in-art in-back">
              <div className="in-a" style={{ ["--d" as string]: "200ms" }}>
                <Wonton size={110} wink={winked} matcha={winked} />
              </div>
              <div className="in-a" style={{ ["--d" as string]: "500ms" }}>
                <Steamer3 marks={winked || hold ? ["k", "k", "k", "c"] : ["k", "k", "k"]} fresh={winked && !hold} />
              </div>
            </div>
            <h1 className="in-a" style={{ ["--d" as string]: "100ms" }}>Missing a day doesn&apos;t reset you.</h1>
            <p className="in-a" style={{ ["--d" as string]: "200ms" }}>Coming back counts. The day you return gets its own wonton, with a wink.</p>
          </>
        )}

        {scene === 3 && (
          <>
            <div className="in-art"><div className="in-a" style={{ ["--d" as string]: "100ms" }}><Wonton size={130} /></div></div>
            <h1 className="in-a" style={{ ["--d" as string]: "200ms" }}>Ready when you are.</h1>
            <p className="in-a" style={{ ["--d" as string]: "300ms" }}>Start with one promise to yourself.</p>
            <div className="in-actions in-a" style={{ ["--d" as string]: "450ms" }}>
              <Link href="/prototypes/new-habit" className="in-go">Make my first promise</Link>
              <button type="button" className="in-again" onClick={replay}>Watch again</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
