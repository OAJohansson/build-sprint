"use client";

import { useEffect, useRef, useState } from "react";
import { Dots, jitter, keepCaretAtEnd, useScribble, useTypedOut, useTypeSound, wordCount } from "./shared";

// Shared by the three typewriter directions: the sheet rises as you type, letters strike a little
// unevenly, keys click (no bell). Each direction supplies its own machine below the paper.

export function Struck({ text, from = 0, red = false }: { text: string; from?: number; red?: boolean }) {
  return (
    <>
      {text.split("\n").map((line, li, lines) => (
        <span key={li}>
          {Array.from(line).map((ch, ci) => {
            const i = from + li * 97 + ci;
            return ch === " " ? (
              " "
            ) : (
              <span
                key={ci}
                className={red ? "strike red" : "strike"}
                style={{ "--y": `${((jitter(i) - 0.5) * 1.6).toFixed(2)}px`, "--o": (0.74 + jitter(i + 7) * 0.26).toFixed(2) } as React.CSSProperties}
              >
                {ch}
              </span>
            );
          })}
          {li < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export type Scribble = ReturnType<typeof useScribble>;
export type MachineApi = { s: Scribble; press: (key: string) => void };

/** Applies a key from an on-screen keyboard: a character, "Backspace" or "Enter". */
function applyKey(text: string, key: string) {
  if (key === "Backspace") return text.slice(0, -1);
  if (key === "Enter") return text + "\n";
  const startOfSentence = text.trim() === "" || /[.!?]\s$/.test(text) || text.endsWith("\n");
  return text + (startOfSentence ? key.toUpperCase() : key);
}

export function TypewriterShell({
  theme,
  machine,
  ownKeyboard = false,
}: {
  theme: string;
  machine: (api: MachineApi) => React.ReactNode;
  ownKeyboard?: boolean;
}) {
  const s = useScribble();
  const [sound, setSound] = useState(true);
  const { click } = useTypeSound(sound);
  const input = useRef<HTMLTextAreaElement>(null);
  const [touch, setTouch] = useState(false);
  const writing = s.stage === "writing";
  const reply = s.feedback ? `${s.feedback.strength}\n\n${s.feedback.tryNext}\n\n— R.` : "";
  const typedReply = useTypedOut(reply, s.stage === "read", click);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- device check after mount
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const press = (key: string) => {
    click();
    s.setText(applyKey(s.text, key));
  };

  const top = (
    <header className="tw-top">
      <Dots done={s.done} />
      {writing && (
        <span className="tw-count" aria-live="polite">
          {s.nudge ? "A few words is enough." : `${wordCount(s.text)} words`}
        </span>
      )}
      <button className="tw-sound" onClick={() => setSound((v) => !v)} aria-pressed={sound}>
        {sound ? "sound on" : "sound off"}
      </button>
    </header>
  );

  if (!writing) {
    return (
      <div className={`tw ${theme} tw-done`}>
        {top}
        <article className="tw-sheet page-turn">
          <p className="tw-prompt"><Struck text={s.prompt} red /></p>
          <p className="tw-body"><Struck text={s.text} /></p>
          {s.stage === "reading" && <p className="tw-reading breathe">· · ·</p>}
          {typedReply && (
            <p className="tw-body tw-reply" aria-live="polite">
              <Struck text={typedReply} from={5000} red />
            </p>
          )}
        </article>
        <div className="tw-after">
          {s.stage === "set" && (
            <button className="tw-btn" onClick={s.askReader}>
              Ask for a reader
            </button>
          )}
          {s.stage !== "reading" && (
            <button className="tw-link" onClick={s.startOver}>
              New sheet
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`tw ${theme}`} onClick={() => input.current?.focus()}>
      {top}
      <div className="tw-window">
        <div className="tw-paper" key={s.prompt}>
          <p className="tw-prompt"><Struck text={s.prompt} red /></p>
          <p className="tw-body">
            <Struck text={s.text} />
            <span className="tw-caret" aria-hidden="true" />
          </p>
        </div>
      </div>
      <div className="tw-machine" onClick={(e) => e.stopPropagation()}>
        {machine({ s, press })}
      </div>
      <textarea
        ref={input}
        className="tw-input"
        value={s.text}
        onChange={(e) => {
          click();
          s.setText(e.target.value);
        }}
        onSelect={keepCaretAtEnd}
        inputMode={ownKeyboard && touch ? "none" : undefined}
        aria-label="Your piece"
        autoFocus
        autoCapitalize="sentences"
      />
    </div>
  );
}

/** The platen: roller with a knob at each end. */
export function Roller() {
  return (
    <div className="tw-carriage" aria-hidden="true">
      <span className="tw-knob" />
      <span className="tw-roller" />
      <span className="tw-knob" />
    </div>
  );
}
