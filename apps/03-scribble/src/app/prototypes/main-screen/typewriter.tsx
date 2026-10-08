"use client";

import { useEffect, useRef, useState } from "react";
import { Dots, useAutoGrow, useScribble, wordCount } from "./shared";

// Axis: focus mode. Chrome fades while you type and the current line stays centred;
// pausing brings the controls back. Finishing turns the page.
export default function Typewriter() {
  const s = useScribble();
  const ref = useAutoGrow(s.text);
  const [typing, setTyping] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writing = s.stage === "writing";

  useEffect(() => () => {
    if (idle.current) clearTimeout(idle.current);
  }, []);

  function onType(v: string) {
    s.setText(v);
    setTyping(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setTyping(false), 1800);
    // Keep the caret line near the middle of the screen.
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const target = rect.bottom - window.innerHeight * 0.5;
      if (target > 0) window.scrollBy({ top: target });
    });
  }

  if (!writing) {
    return (
      <div className="tw tw-page page-turn">
        <header className="tw-head">
          <Dots done={s.done} />
        </header>
        <main className="tw-sheet">
          <p className="tw-prompt small">{s.prompt}</p>
          <p className="tw-typed pre">{s.text}</p>
          <p className="muted small tw-count">— {wordCount(s.text)} words</p>
        </main>
        <section className="tw-cards">
          {s.stage === "set" && (
            <button className="ghost-btn ink-in" onClick={s.askReader}>
              Ask for a reader
            </button>
          )}
          {s.stage === "reading" && <p className="muted breathe">Your reader is reading…</p>}
          {s.stage === "read" && s.feedback && (
            <>
              <div className="card ink-in">
                <p className="note-label">What’s working</p>
                <p>{s.feedback.strength}</p>
              </div>
              <div className="card ink-in delay">
                <p className="note-label">Try next time</p>
                <p>{s.feedback.tryNext}</p>
              </div>
            </>
          )}
          {s.stage !== "reading" && (
            <button className="link-btn" onClick={s.startOver}>
              New sheet
            </button>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="tw" data-typing={typing ? "" : undefined}>
      <header className="tw-head fades">
        <Dots done={s.done} />
      </header>
      <main className="tw-desk">
        <p className={`tw-prompt ${s.text ? "small" : ""}`} key={s.prompt}>{s.prompt}</p>
        <button className="link-btn fades tw-spark" onClick={s.anotherSpark}>
          Another spark
        </button>
        <textarea
          ref={ref}
          className="tw-text"
          value={s.text}
          onChange={(e) => onType(e.target.value)}
          placeholder="_"
          aria-label="Your piece"
          autoFocus
          rows={2}
        />
      </main>
      <footer className="tw-foot fades">
        <span className="muted small" aria-live="polite">
          {s.nudge ? "A few words is enough." : wordCount(s.text) ? `${wordCount(s.text)} words` : ""}
        </span>
        <button className="solid-btn" onClick={s.setDown}>
          Set down the pen
        </button>
      </footer>
    </div>
  );
}
