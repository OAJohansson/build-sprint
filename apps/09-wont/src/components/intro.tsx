"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { useWont } from "@/lib/store";
import { Steamer, Wonton } from "./wonton";

// First-launch intro (R1): three messages, about 18 s, skippable and replayable from the board.
// Gate (animate skill): rare / first-time, purpose = explanation. CSS keyframes for the entrances
// (transform + opacity, strong ease-out), a linear progress bar, React state only to step the
// scenes. Reduced motion: fades only, no movement.
const SCENE_MS = 6000;
type Scene = 0 | 1 | 2 | 3; // 3 = the end card

export function Intro() {
  const w = useWont();
  const router = useRouter();
  const [scene, setScene] = useState<Scene>(0);
  const [run, setRun] = useState(0); // re-mount key for "watch again"
  const [winked, setWinked] = useState(false);
  const t = copy.intro;
  const { setIntroSeen } = w;
  const hasHabits = w.state.habits.length > 0;

  useEffect(() => {
    if (scene === 3) return;
    const next = setTimeout(() => setScene((s) => (s + 1) as Scene), SCENE_MS);
    // Scene 3: the comeback wonton drops in, then the big wonton winks.
    const wink = scene === 2 ? setTimeout(() => setWinked(true), 2200) : undefined;
    return () => {
      clearTimeout(next);
      if (wink) clearTimeout(wink);
    };
  }, [scene, run]);

  // Seen once the end card is reached (by watching or by Skip).
  useEffect(() => {
    if (scene === 3) setIntroSeen(true);
  }, [scene, setIntroSeen]);

  const skip = () => {
    setIntroSeen(true);
    router.replace("/");
  };
  const replay = () => {
    setWinked(false);
    setScene(0);
    setRun((r) => r + 1);
  };
  const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` });

  return (
    <main className="in">
      {scene < 3 && (
        <div className="in-top">
          <div className="in-progress" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i}>
                <i
                  key={`${run}-${scene}`}
                  className={i < scene ? "done" : i === scene ? "now" : ""}
                  style={{ animationDuration: `${SCENE_MS}ms` }}
                />
              </span>
            ))}
          </div>
          <button type="button" className="in-skip" onClick={skip}>{t.skip}</button>
        </div>
      )}

      <section key={`${run}-${scene}`} className="in-scene" aria-live="polite">
        {scene === 0 && (
          <>
            <div className="in-art in-weeks">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="in-a" style={d(300 + i * 140)}>
                  <Wonton size={50} />
                  <small>{i + 1}</small>
                </div>
              ))}
              <p className="in-a in-axis" style={d(1700)}>{t.s1Axis}</p>
            </div>
            <h1 className="in-a" style={d(100)}>{t.s1Title}</h1>
            <p className="in-a" style={d(200)}>{t.s1Body}</p>
          </>
        )}

        {scene === 1 && (
          <>
            <div className="in-art in-tie">
              <div className="in-a in-pill" style={d(300)}>{t.s2Anchor}</div>
              <div className="in-a" style={d(800)}><Wonton size={56} /></div>
              <div className="in-a in-pill dough" style={d(1200)}>{t.s2Action}</div>
            </div>
            <h1 className="in-a" style={d(100)}>{t.s2Title}</h1>
            <p className="in-a" style={d(200)}>{t.s2Body}</p>
          </>
        )}

        {scene === 2 && (
          <>
            <div className="in-art in-back">
              <div className="in-a" style={d(200)}>
                <Wonton size={110} wink={winked} matcha={winked} />
              </div>
              <div className="in-a" style={d(500)}>
                <Steamer marks={winked ? ["k", "k", "k", "c"] : ["k", "k", "k"]} fresh={winked} />
              </div>
            </div>
            <h1 className="in-a" style={d(100)}>{t.s3Title}</h1>
            <p className="in-a" style={d(200)}>{t.s3Body}</p>
          </>
        )}

        {scene === 3 && (
          <>
            <div className="in-art"><div className="in-a" style={d(100)}><Wonton size={130} /></div></div>
            <h1 className="in-a" style={d(200)}>{t.endTitle}</h1>
            <p className="in-a" style={d(300)}>{t.endBody}</p>
            <div className="in-actions in-a" style={d(450)}>
              {hasHabits ? (
                <Link href="/" replace className="in-go">{t.endBoard}</Link>
              ) : (
                <Link href="/new" className="in-go">{t.endFirst}</Link>
              )}
              <button type="button" className="in-again" onClick={replay}>{t.again}</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
