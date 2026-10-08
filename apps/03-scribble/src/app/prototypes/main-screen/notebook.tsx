"use client";

import { Dots, useAutoGrow, useScribble, wordCount } from "./shared";

// Axis: one page, everything inline. You write on the page and scroll down it, like a notebook.
export default function Notebook() {
  const s = useScribble();
  const ref = useAutoGrow(s.text);
  const writing = s.stage === "writing";

  return (
    <div className="nb">
      <header className="nb-head">
        <span className="nb-mark">Scribble</span>
        <Dots done={s.done} />
      </header>

      <main className="nb-page">
        <p className="nb-date">Wednesday, 8 October</p>
        <h1 className="nb-prompt" key={s.prompt}>{s.prompt}</h1>
        {writing && (
          <button className="link-btn nb-spark" onClick={s.anotherSpark}>
            Another spark
          </button>
        )}

        {writing ? (
          <textarea
            ref={ref}
            className="nb-text"
            value={s.text}
            onChange={(e) => s.setText(e.target.value)}
            placeholder="Begin anywhere…"
            aria-label="Your piece"
            autoFocus
            rows={6}
          />
        ) : (
          <div className="nb-text nb-set ink-in">{s.text}</div>
        )}

        {!writing && (
          <section className="nb-after">
            <p className="fleuron" aria-hidden="true">{"\u2766\uFE0E"}</p>
            {s.stage === "set" && (
              <div className="ink-in nb-center">
                <p className="muted">Set down. {wordCount(s.text)} words on the page.</p>
                <button className="ghost-btn" onClick={s.askReader}>
                  Ask for a reader
                </button>
              </div>
            )}
            {s.stage === "reading" && <p className="muted nb-center breathe">Your reader is reading…</p>}
            {s.stage === "read" && s.feedback && (
              <aside className="nb-note ink-in" aria-label="Your reader's note">
                <p className="note-label">What’s working</p>
                <p>{s.feedback.strength}</p>
                <p className="note-label">Try next time</p>
                <p>{s.feedback.tryNext}</p>
              </aside>
            )}
            {(s.stage === "set" || s.stage === "read") && (
              <button className="link-btn nb-center nb-again" onClick={s.startOver}>
                Begin another
              </button>
            )}
          </section>
        )}
      </main>

      {writing && (
        <footer className="nb-foot">
          <span className="muted small" aria-live="polite">
            {s.nudge ? "A few words is enough." : `${wordCount(s.text)} words`}
          </span>
          <button className="solid-btn" onClick={s.setDown}>
            Set down the pen
          </button>
        </footer>
      )}
    </div>
  );
}
