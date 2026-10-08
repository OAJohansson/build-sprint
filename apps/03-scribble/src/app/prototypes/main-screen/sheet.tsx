"use client";

import { useRef, useState } from "react";
import { GOAL, jitter, keepCaretAtEnd, useScribble, useTypedOut, useTypeSound, wordCount } from "./shared";

// Shared by the three directions: no machine, just the qualities of typing on a typewriter.
// The line you're on holds still and the page rises; letters strike a little unevenly; keys click.

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
                style={{ "--y": `${((jitter(i) - 0.5) * 1.4).toFixed(2)}px`, "--o": (0.76 + jitter(i + 7) * 0.24).toFixed(2) } as React.CSSProperties}
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
export type Slots = { s: Scribble; sound: boolean; toggleSound: () => void; words: number };

/** Typed progress marks for the week: ■ ■ □ □ */
export function Week({ done }: { done: number }) {
  return (
    <span className="pg-week" role="img" aria-label={`${done} of ${GOAL} pieces this week`}>
      {Array.from({ length: GOAL }, (_, i) => (i < done ? "■" : "□")).join(" ")}
    </span>
  );
}

export function SheetShell({
  theme,
  header,
  footer,
  promptInHeader = false,
}: {
  theme: string;
  header: (x: Slots) => React.ReactNode;
  footer: (x: Slots) => React.ReactNode;
  promptInHeader?: boolean;
}) {
  const s = useScribble();
  const [sound, setSound] = useState(true);
  const { click } = useTypeSound(sound);
  const input = useRef<HTMLTextAreaElement>(null);
  const writing = s.stage === "writing";
  const reply = s.feedback ? `${s.feedback.strength}\n\n${s.feedback.tryNext}` : "";
  const typedReply = useTypedOut(reply, s.stage === "read", click);
  const slots: Slots = { s, sound, toggleSound: () => setSound((v) => !v), words: wordCount(s.text) };

  const prompt = (
    <h1 className="pg-prompt" key={s.prompt}>
      <Struck text={s.prompt} red={!promptInHeader} />
    </h1>
  );

  if (!writing) {
    return (
      <div className={`pg ${theme} pg-done`}>
        <header className="pg-head">{header(slots)}</header>
        <article className="pg-page page-turn">
          {!promptInHeader && prompt}
          <p className="pg-body"><Struck text={s.text} /></p>
          <p className="pg-end" aria-hidden="true">###</p>
          {s.stage === "reading" && <p className="pg-reading breathe">your reader is reading</p>}
          {typedReply && (
            <p className="pg-body pg-reply" aria-live="polite">
              <Struck text={typedReply} from={5000} red />
            </p>
          )}
        </article>
        <div className="pg-after">
          {s.stage === "set" && (
            <button className="pg-act pg-main" onClick={s.askReader}>
              Ask for a reader
            </button>
          )}
          {s.stage !== "reading" && (
            <button className="pg-act" onClick={s.startOver}>
              A fresh page
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`pg ${theme}`} onClick={() => input.current?.focus()}>
      <header className="pg-head">{header(slots)}</header>
      <div className="pg-stage">
        <div className="pg-col">
          {!promptInHeader && prompt}
          <p className="pg-body">
            <Struck text={s.text} />
            <span className="pg-caret" aria-hidden="true" />
          </p>
        </div>
      </div>
      <footer className="pg-foot" onClick={(e) => e.stopPropagation()}>
        {footer(slots)}
      </footer>
      <textarea
        ref={input}
        className="pg-input"
        value={s.text}
        onChange={(e) => {
          click();
          s.setText(e.target.value);
        }}
        onSelect={keepCaretAtEnd}
        aria-label="Your piece"
        autoFocus
        autoCapitalize="sentences"
      />
    </div>
  );
}

export function SoundToggle({ sound, toggleSound }: Pick<Slots, "sound" | "toggleSound">) {
  return (
    <button className="pg-sound" onClick={toggleSound} aria-pressed={sound}>
      {sound ? "sound on" : "sound off"}
    </button>
  );
}
