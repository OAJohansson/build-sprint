"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Dots, jitter, keepCaretAtEnd, useScribble, useTypedOut, useTypeSound, wordCount } from "./shared";

// Axis: the machine itself. The sheet feeds upward as you type, the line you're on stays at the
// roller, letters strike unevenly, keys click. The reader types back in red ribbon.
function Struck({ text, from = 0, red = false }: { text: string; from?: number; red?: boolean }) {
  return (
    <>
      {text.split("\n").map((line, li, lines) => (
        <span key={li}>
          {Array.from(line).map((ch, ci) => {
            const i = from + li * 97 + ci;
            const j = jitter(i);
            return ch === " " ? (
              " "
            ) : (
              <span
                key={ci}
                className={red ? "strike red" : "strike"}
                style={{ "--y": `${((j - 0.5) * 1.6).toFixed(2)}px`, "--o": (0.74 + jitter(i + 7) * 0.26).toFixed(2) } as React.CSSProperties}
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

export default function Platen() {
  const s = useScribble();
  const [sound, setSound] = useState(true);
  const { click, bell } = useTypeSound(sound);
  const input = useRef<HTMLTextAreaElement>(null);
  const writing = s.stage === "writing";
  const reply = s.feedback ? `${s.feedback.strength}\n\n${s.feedback.tryNext}\n\n— R.` : "";
  const typedReply = useTypedOut(reply, s.stage === "read", click);

  // Carriage: the strike point follows the caret; the paper drifts a little the other way and
  // slides back at the end of a line, when the bell rings.
  const caret = useRef<HTMLSpanElement>(null);
  const lastTop = useRef<number | null>(null);
  const [strike, setStrike] = useState({ x: 0, y: 0 });
  const [drift, setDrift] = useState(0);

  useLayoutEffect(() => {
    const el = caret.current;
    const body = el?.parentElement;
    if (!el || !body) return;
    const x = el.offsetLeft;
    const y = el.offsetTop;
    setStrike({ x, y });
    setDrift(Math.max(-18, Math.min(18, -(x - body.clientWidth / 2) * 0.12)));
    if (lastTop.current !== null && y > lastTop.current && !s.text.endsWith("\n")) bell();
    lastTop.current = y;
  }, [s.text, bell]);

  function onChange(v: string) {
    if (v.length > s.text.length && v.endsWith("\n")) bell();
    else click();
    s.setText(v);
  }

  const soundToggle = (
    <button className="pl-sound" onClick={() => setSound((v) => !v)} aria-pressed={sound}>
      {sound ? "sound on" : "sound off"}
    </button>
  );

  if (!writing) {
    return (
      <div className="pl pl-done">
        <header className="pl-top">
          <Dots done={s.done} />
          {soundToggle}
        </header>
        <article className="pl-sheet page-turn">
          <p className="pl-prompt"><Struck text={s.prompt} red /></p>
          <p className="pl-body"><Struck text={s.text} /></p>
          {s.stage === "reading" && <p className="pl-reading breathe">· · ·</p>}
          {typedReply && (
            <p className="pl-body pl-reply" aria-live="polite">
              <Struck text={typedReply} from={5000} red />
            </p>
          )}
        </article>
        <div className="pl-keys pl-keys-inline">
          {s.stage === "set" && (
            <Key glyph="R" label="Ask for a reader" onClick={s.askReader} />
          )}
          {s.stage !== "reading" && <Key glyph="↥" label="New sheet" onClick={s.startOver} />}
        </div>
      </div>
    );
  }

  return (
    <div className="pl" onClick={() => input.current?.focus()}>
      <header className="pl-top">
        <Dots done={s.done} />
        {soundToggle}
      </header>

      <div className="pl-window">
        <div className="pl-paper" key={s.prompt} style={{ transform: `translateX(${drift.toFixed(1)}px)` }}>
          <p className="pl-prompt"><Struck text={s.prompt} red /></p>
          <p className="pl-body">
            <Struck text={s.text} />
            <span className="pl-caret" ref={caret} aria-hidden="true" />
            <span className="pl-guide" aria-hidden="true" style={{ transform: `translate(${strike.x}px, ${strike.y}px)` }} />
          </p>
        </div>
        <div className="pl-bail" aria-hidden="true"><span /><span /></div>
      </div>

      <div className="pl-machine">
        <div className="pl-carriage" aria-hidden="true" style={{ transform: `translateX(${drift.toFixed(1)}px)` }}>
          <span className="pl-lever" />
          <span className="pl-knob" />
          <span className="pl-roller" />
          <span className="pl-knob" />
        </div>
        <div className="pl-body-shell">
          <span className="pl-badge" aria-hidden="true">Scribble</span>
          <p className="pl-count" aria-live="polite">
            {s.nudge ? "A few words is enough." : `${wordCount(s.text)} words`}
          </p>
          <div className="pl-keys">
            <Key glyph="*" label="Another spark" onClick={s.anotherSpark} />
            <Key glyph="¶" label="Set down the pen" onClick={s.setDown} big />
          </div>
        </div>
      </div>

      <textarea
        ref={input}
        className="pl-input"
        value={s.text}
        onChange={(e) => onChange(e.target.value)}
        onSelect={keepCaretAtEnd}
        aria-label="Your piece"
        autoFocus
        autoCapitalize="sentences"
      />
    </div>
  );
}

function Key({ glyph, label, onClick, big }: { glyph: string; label: string; onClick: () => void; big?: boolean }) {
  return (
    <button
      className="pl-key"
      data-big={big ? "" : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="pl-keycap" aria-hidden="true">{glyph}</span>
      <span className="pl-keylabel">{label}</span>
    </button>
  );
}
