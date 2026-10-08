"use client";

import { GOAL, useAutoGrow, useScribble, useTypedOut } from "./shared";

// Axis: a growing collection on the desk. Each piece is an index card; the week is a row of cards;
// finishing gets a date stamp; the reader clips a memo slip to the card.
export default function Cards() {
  const s = useScribble();
  const ref = useAutoGrow(s.text);
  const writing = s.stage === "writing";
  const reply = s.feedback ? `${s.feedback.strength}\n\n${s.feedback.tryNext}` : "";
  const typedReply = useTypedOut(reply, s.stage === "read", undefined, 14);

  return (
    <div className="ic">
      <header className="ic-week" aria-label={`${s.done} of ${GOAL} pieces this week`}>
        <span className="ic-week-label">This week</span>
        <div className="ic-slots">
          {Array.from({ length: GOAL }, (_, i) => (
            <span key={i} className="ic-slot" data-filled={i < s.done ? "" : undefined} style={{ "--r": `${(i % 2 ? 1 : -1) * (2 + i)}deg` } as React.CSSProperties} />
          ))}
        </div>
      </header>

      <main className="ic-desk">
        <div className="ic-stack">
          <div className="ic-pile">
          <div className="ic-card ic-behind one" aria-hidden="true" />
          <div className="ic-card ic-behind two" aria-hidden="true" />
          <div className="ic-card ic-main card-in" key={s.prompt}>
            <p className="ic-prompt">{s.prompt}</p>
            {writing ? (
              <textarea
                ref={ref}
                className="ic-text"
                value={s.text}
                onChange={(e) => s.setText(e.target.value)}
                placeholder="…"
                aria-label="Your piece"
                autoFocus
                rows={7}
              />
            ) : (
              <p className="ic-text pre">{s.text}</p>
            )}
            {!writing && (
              <span className="ic-stamp" aria-label="Filed 8 October">
                No. {s.done}
                <br />8 OCT 2026
              </span>
            )}
          </div>
          </div>
          {s.stage === "read" && (
            <aside className="ic-memo slip-in" aria-label="Your reader's memo">
              <span className="ic-clip" aria-hidden="true" />
              <p className="ic-memo-head">Memo · from your reader</p>
              <p className="pre">{typedReply}</p>
            </aside>
          )}
        </div>
      </main>

      <footer className="ic-actions">
        {writing && (
          <>
            <button className="ic-link" onClick={s.anotherSpark}>
              Another spark
            </button>
            <span className="ic-nudge" aria-live="polite">{s.nudge ? "A few words is enough." : ""}</span>
            <button className="ic-btn" onClick={s.setDown}>
              Set down the pen
            </button>
          </>
        )}
        {s.stage === "set" && (
          <>
            <button className="ic-link" onClick={s.startOver}>
              New card
            </button>
            <button className="ic-btn" onClick={s.askReader}>
              Ask for a reader
            </button>
          </>
        )}
        {s.stage === "reading" && <p className="ic-nudge breathe">Your reader is reading…</p>}
        {s.stage === "read" && (
          <button className="ic-btn" onClick={s.startOver}>
            New card
          </button>
        )}
      </footer>
    </div>
  );
}
