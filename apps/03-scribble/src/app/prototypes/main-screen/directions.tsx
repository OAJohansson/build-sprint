"use client";

import { type Scribble, SheetShell, SoundToggle, Struck, Week } from "./sheet";

// The number of the piece on the page: the next one while writing, this one once set down.
const pieceNo = (s: Scribble) => (s.stage === "writing" ? s.done + 1 : s.done);

// 1 · Manuscript: the whole screen is the page. Typed header, centred underlined title,
// double-spaced text, a page number, lamplight falling off at the edges.
export function Manuscript() {
  return (
    <SheetShell
      theme="pg-manuscript"
      header={({ s, sound, toggleSound }) => (
        <>
          <span>SCRIBBLE &nbsp;·&nbsp; NO. {pieceNo(s)}</span>
          <Week done={s.done} />
          <SoundToggle sound={sound} toggleSound={toggleSound} />
        </>
      )}
      footer={({ s, words }) => (
        <>
          <button className="pg-act" onClick={s.anotherSpark}>
            another spark
          </button>
          <span className="pg-folio" aria-live="polite">{s.nudge ? "a few words is enough" : `— ${words} words —`}</span>
          <button className="pg-act pg-main" onClick={s.setDown}>
            set down the pen
          </button>
        </>
      )}
    />
  );
}

// 2 · Night draft: almost nothing but your line, warm ink on near-black.
export function NightDraft() {
  return (
    <SheetShell
      theme="pg-night"
      header={({ s, sound, toggleSound }) => (
        <>
          <Week done={s.done} />
          <SoundToggle sound={sound} toggleSound={toggleSound} />
        </>
      )}
      footer={({ s, words }) => (
        <>
          <button className="pg-act" onClick={s.anotherSpark}>
            another spark
          </button>
          <span className="pg-folio" aria-live="polite">{s.nudge ? "a few words is enough" : words || ""}</span>
          <button className="pg-act pg-main" onClick={s.setDown}>
            set down the pen
          </button>
        </>
      )}
    />
  );
}

// 3 · Ribbon: graphic, two-tone like a typewriter ribbon. Black band for the prompt,
// cream to write on, a red strip for the actions.
export function Ribbon() {
  return (
    <SheetShell
      theme="pg-ribbon"
      promptInHeader
      header={({ s, sound, toggleSound }) => (
        <>
          <div className="rb-meta">
            <span>PROMPT NO. {11 + pieceNo(s)}</span>
            <Week done={s.done} />
            <SoundToggle sound={sound} toggleSound={toggleSound} />
          </div>
          <h1 className="rb-prompt" key={s.prompt}>
            <Struck text={s.prompt} />
          </h1>
        </>
      )}
      footer={({ s }) => (
        <>
          <button className="pg-act" onClick={s.anotherSpark}>
            ANOTHER SPARK
          </button>
          <span className="pg-folio" aria-live="polite">{s.nudge ? "A FEW WORDS IS ENOUGH" : ""}</span>
          <button className="pg-act pg-main" onClick={s.setDown}>
            SET DOWN THE PEN →
          </button>
        </>
      )}
    />
  );
}
