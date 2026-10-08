"use client";

import { Roller, TypewriterShell } from "./shell";

// Direction 2 · Enamel: a 1960s portable in soft green enamel with cream keys, and the keys are real.
// On a phone you type on the machine's own round keys (the phone keyboard stays away); on a
// computer your own keyboard works too.
const ROWS = ["qwertyuiop", "asdfghjkl'", "zxcvbnm,."];

export default function Enamel() {
  return (
    <TypewriterShell
      theme="tw-enamel"
      ownKeyboard
      machine={({ s, press }) => (
        <>
          <Roller />
          <div className="en-body">
            <div className="en-actions">
              <button className="en-tab" onClick={s.anotherSpark}>
                Another spark
              </button>
              <span className="en-badge" aria-hidden="true">Scribble</span>
              <button className="en-tab en-tab-main" onClick={s.setDown}>
                Set down the pen
              </button>
            </div>
            <div className="en-keys" role="group" aria-label="Typewriter keys">
              {ROWS.map((row, r) => (
                <div className="en-row" key={row}>
                  {Array.from(row).map((k) => (
                    <button className="en-key" key={k} onClick={() => press(k)}>
                      {k}
                    </button>
                  ))}
                  {r === 2 && (
                    <button className="en-key en-wide" onClick={() => press("Backspace")} aria-label="Backspace">
                      ←
                    </button>
                  )}
                </div>
              ))}
              <div className="en-row">
                <button className="en-key" onClick={() => press("?")}>?</button>
                <button className="en-key en-space" onClick={() => press(" ")} aria-label="Space" />
                <button className="en-key" onClick={() => press("!")}>!</button>
                <button className="en-key en-wide" onClick={() => press("Enter")} aria-label="New line">
                  ↵
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    />
  );
}
