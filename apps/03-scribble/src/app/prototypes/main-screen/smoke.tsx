"use client";

import { useRef } from "react";
import { GOAL, keepCaretAtEnd, useScribble, useTypedOut } from "./shared";

// Axis: forward only. Just the sentence you're on; finished sentences drift up and fade like smoke,
// and you can't go back to fix them. Setting down the pen clears the smoke and the piece settles.
function split(text: string) {
  const m = text.match(/^([\s\S]*[.!?…]["”’)]?\s+|[\s\S]*\n)/);
  const done = m ? m[0] : "";
  const past = done
    .split(/(?<=[.!?…]["”’)]?)\s+|\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  return { past, current: text.slice(done.length) };
}

export default function Smoke() {
  const s = useScribble();
  const input = useRef<HTMLTextAreaElement>(null);
  const writing = s.stage === "writing";
  const { past, current } = split(s.text);
  const reply = s.feedback ? `${s.feedback.strength}\n\n${s.feedback.tryNext}` : "";
  const typedReply = useTypedOut(reply, s.stage === "read", undefined, 18);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // No going back past the sentence you're on.
    if (e.key === "Backspace" && current.length === 0) e.preventDefault();
  }

  const embers = (
    <div className="sm-embers" role="img" aria-label={`${s.done} of ${GOAL} pieces this week`}>
      {Array.from({ length: GOAL }, (_, i) => (
        <span key={i} className="ember" data-lit={i < s.done ? "" : undefined} />
      ))}
    </div>
  );

  if (!writing) {
    return (
      <div className="sm sm-done">
        {embers}
        <p className="sm-prompt">{s.prompt}</p>
        <p className="sm-page settle pre">{s.text}</p>
        <div className="sm-after">
          {s.stage === "set" && (
            <button className="sm-btn" onClick={s.askReader}>
              Ask for a reader
            </button>
          )}
          {s.stage === "reading" && <p className="sm-faint breathe">Your reader is reading…</p>}
          {s.stage === "read" && <p className="sm-reply pre" aria-live="polite">{typedReply}</p>}
          {s.stage !== "reading" && (
            <button className="sm-link" onClick={s.startOver}>
              Light another
            </button>
          )}
        </div>
      </div>
    );
  }

  const visible = past.slice(-4);
  return (
    <div className="sm" onClick={() => input.current?.focus()}>
      {embers}
      <p className="sm-prompt" key={s.prompt}>{s.prompt}</p>

      <div className="sm-stage">
        <div className="sm-past" aria-hidden="true">
          {visible.map((line, i) => (
            <p key={past.length - visible.length + i} className="sm-line" data-age={visible.length - i}>
              {line}
            </p>
          ))}
        </div>
        <p className="sm-current">
          {current}
          <span className="sm-caret" aria-hidden="true" />
        </p>
      </div>

      <footer className="sm-foot">
        <button
          className="sm-link"
          onClick={(e) => {
            e.stopPropagation();
            s.anotherSpark();
          }}
        >
          Another spark
        </button>
        <span className="sm-faint" aria-live="polite">{s.nudge ? "A few words is enough." : ""}</span>
        <button
          className="sm-btn"
          onClick={(e) => {
            e.stopPropagation();
            s.setDown();
          }}
        >
          Set down the pen
        </button>
      </footer>

      <textarea
        ref={input}
        className="sm-input"
        value={s.text}
        onChange={(e) => s.setText(e.target.value)}
        onKeyDown={onKeyDown}
        onSelect={keepCaretAtEnd}
        aria-label="Your piece. Finished sentences can't be changed."
        autoFocus
      />
    </div>
  );
}
