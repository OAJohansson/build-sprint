"use client";

import { useEffect, useRef } from "react";
import { Dots, useAutoGrow, useScribble } from "./shared";

// Axis: an exchange of letters. The prompt arrives from "your reader", you write back, they reply.
// The WhatsApp feeling: a topic comes to you, and someone answers.
export default function Letters() {
  const s = useScribble();
  const ref = useAutoGrow(s.text);
  const end = useRef<HTMLDivElement>(null);
  const writing = s.stage === "writing";

  useEffect(() => {
    if (!writing) end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [s.stage, writing]);

  return (
    <div className="lt">
      <header className="lt-head">
        <div>
          <p className="lt-who">Your reader</p>
          <p className="muted small">usually replies in a moment</p>
        </div>
        <Dots done={s.done} label={false} />
      </header>

      <main className="lt-thread">
        <p className="lt-day muted small">Tonight</p>

        <article className="letter from ink-in" key={s.prompt}>
          <p>{s.prompt}</p>
          <p className="sig">— R.</p>
        </article>
        {writing && (
          <button className="link-btn lt-spark" onClick={s.anotherSpark}>
            Another spark
          </button>
        )}

        {!writing && (
          <article className="letter mine ink-in">
            <p className="pre">{s.text}</p>
          </article>
        )}

        {s.stage === "set" && (
          <div className="lt-ask ink-in">
            <button className="ghost-btn" onClick={s.askReader}>
              Ask for a reader
            </button>
            <button className="link-btn" onClick={s.startOver}>
              Not tonight
            </button>
          </div>
        )}
        {s.stage === "reading" && (
          <p className="letter from typing" aria-label="Your reader is reading">
            <span className="breathe">reading your letter…</span>
          </p>
        )}
        {s.stage === "read" && s.feedback && (
          <>
            <article className="letter from ink-in">
              <p>{s.feedback.strength}</p>
              <p>{s.feedback.tryNext}</p>
              <p className="sig">— R.</p>
            </article>
            <button className="link-btn lt-spark" onClick={s.startOver}>
              Write again
            </button>
          </>
        )}
        <div ref={end} />
      </main>

      {writing && (
        <footer className="lt-compose">
          {s.nudge && <p className="muted small lt-nudge" aria-live="polite">A few words is enough.</p>}
          <textarea
            ref={ref}
            className="lt-text"
            value={s.text}
            onChange={(e) => s.setText(e.target.value)}
            placeholder="Dear R., …"
            aria-label="Your reply"
            autoFocus
            rows={3}
          />
          <div className="lt-actions">
            <button className="solid-btn" onClick={s.setDown}>
              Set down the pen
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
