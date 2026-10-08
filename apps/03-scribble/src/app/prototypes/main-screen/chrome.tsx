"use client";

import { Roller, TypewriterShell } from "./shell";

// Direction 1 · Chrome: a 1930s silver portable. Brushed metal, chrome-rimmed round keys, a curved
// ribbon cover. The phone's own keyboard does the typing; the machine's keys are the frame.
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export default function Chrome() {
  return (
    <TypewriterShell
      theme="tw-chrome"
      machine={({ s }) => (
        <>
          <Roller />
          <div className="ch-body">
            <div className="ch-cover">
              <span className="ch-badge">Scribble</span>
            </div>
            <div className="ch-keys" aria-hidden="true">
              {ROWS.map((row) => (
                <div className="ch-row" key={row}>
                  {Array.from(row).map((k) => (
                    <span className="ch-key" key={k}>{k}</span>
                  ))}
                </div>
              ))}
            </div>
            <div className="ch-actions">
              <button className="ch-tab" onClick={s.anotherSpark}>
                Another spark
              </button>
              <button className="ch-tab ch-tab-main" onClick={s.setDown}>
                Set down the pen
              </button>
            </div>
          </div>
        </>
      )}
    />
  );
}
