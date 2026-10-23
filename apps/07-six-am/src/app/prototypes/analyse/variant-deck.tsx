"use client";

// C · Deck. Axis: density. A tight rekordbox table that also lists the playlist's tracks not yet
// analysed, over a fixed deck along the bottom (the Studio's crate position) for the selected
// track. The Listen button itself fills as the window runs.
import { useState } from "react";
import { BLOCKED, PLAYLIST, ROWS, SELECTED, STUDIO_BPM, WINDOW, bpmText, brightLabel, energyLabel, keyText, tagMismatch } from "./sample";
import { AppBar, Embed, Energy, cx, useActions } from "./shared";
import type { VariantProps } from "./harness";
import s from "./analyse.module.css";

export function Deck({ state, seconds }: VariantProps) {
  const empty = state === "empty";
  const listening = state === "main";
  const rows = empty ? [] : [...ROWS.map((r) => (r.status === "analysing" && !listening ? { ...r, status: "ready" as const } : r)), BLOCKED];
  const [sel, setSel] = useState(SELECTED);
  const a = useActions();
  const picked = rows.find((r) => r.id === sel && r.styles);
  const current = rows.find((r) => r.id === "10");
  const done = rows.filter((r) => r.styles).length;
  const showSteps = state !== "main";

  return (
    <div className={cx(s.root, s.cRoot)}>
      <AppBar right={empty ? null : <><span className={s.by}>{done} of {PLAYLIST.count} analysed</span><button className={s.small}>Export CSV</button><button className={s.small}>JSON</button></>} />
      <div className={s.cBar}>
        <input className={s.url} aria-label="SoundCloud link" placeholder="Paste a SoundCloud track or playlist link" defaultValue={empty ? "" : PLAYLIST.url} spellCheck={false} />
        <Embed url={current?.url} />
        {listening ? (
          <button className={s.cListen} aria-label={`Listening, ${seconds} of ${WINDOW} seconds. Cancel`}>
            <i style={{ width: `${(seconds / WINDOW) * 100}%` }} />
            <span className={s.listening}>Listening</span>
            <span className={s.lcd}>{seconds} / {WINDOW} s</span>
            <span className={s.by}>Cancel</span>
          </button>
        ) : (
          <button className={cx(s.small, s.cEnable)}>Enable listening</button>
        )}
      </div>

      <main className={s.cTable}>
        {empty ? (
          <p className={s.cEmptyLine}>Paste a SoundCloud link above.</p>
        ) : (
          <>
            <div className={cx(s.cCols, s.cHead)}>
              <span className={s.th}>#</span><span className={s.th}>Track</span><span className={s.th}>Top 2 styles</span>
              <span className={s.th}>BPM</span><span className={s.th}>Key</span><span className={s.th}>Energy</span><span className={s.th}>Bright</span>
              <span className={s.th}>Time</span><span className={s.th}>Uploader tag</span><span className={s.th} aria-hidden />
            </div>
            {rows.map((r, i) => (
              <div
                key={r.id}
                tabIndex={0}
                className={cx(s.cCols, s.cRow, r.id === sel && s.cSel, r.id === "10" && s.cCur)}
                aria-selected={r.id === sel}
                onClick={() => r.styles && setSel(r.id)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && r.styles) { e.preventDefault(); setSel(r.id); } }}
              >
                <span className={cx(s.th, s.num)}>{i + 1}</span>
                <span><b>{r.title}</b> <span className={s.by}>· {r.uploader}</span></span>
                {r.styles ? (
                  <span>{r.styles[0].name} {r.styles[0].p}% <span className={s.by}>· {r.styles[1].name} {r.styles[1].p}%</span></span>
                ) : (
                  <span className={r.status === "analysing" ? s.listening : s.dim}>
                    {r.status === "analysing" ? "Listening…" : r.status === "blocked" ? "Not available in your region" : "Not analysed"}
                  </span>
                )}
                <span className={s.cBpm}>{bpmText(r) || <span className={s.dim}>–</span>}{r.halfDouble ? <span className={s.flag} title="Might be half-time: 145 BPM"> ×2?</span> : null}</span>
                <span>{keyText(r) || <span className={s.dim}>–</span>}</span>
                <Energy value={r.energy} />
                <span className={r.brightness == null ? s.dim : undefined}>{r.brightness == null ? "–" : brightLabel(r.brightness)}</span>
                {r.status === "preview" ? (
                  <span className={s.cPreview} title={`The track is ${r.length}; SoundCloud plays only a 30 s preview, so 30 s were analysed`}>30 s preview</span>
                ) : (
                  <span className={cx(s.num, s.by)}>{r.length || "–"}</span>
                )}
                <span className={s.by}>{r.uploaderTag ?? <span className={s.dim}>none</span>}{tagMismatch(r) ? <span className={s.cDiffers} title="The uploader's tag isn't in the top 3 styles Six AM heard"> · differs</span> : null}</span>
                <span className={s.cAct}>
                  {r.status === "ready" ? (
                    <button className={cx(s.small, r.id === "10" && s.cActOn)} disabled={!listening} title={listening ? undefined : "Enable listening first"} onClick={(e) => e.stopPropagation()}>Analyse</button>
                  ) : null}
                </span>
              </div>
            ))}
            <div className={s.cMore}>45 more tracks in {PLAYLIST.name}, not analysed yet<button className={s.small}>Show all</button></div>
          </>
        )}
      </main>

      <section className={s.cDeck} aria-label={showSteps ? "Enable listening" : "Selected track"}>
        {showSteps ? (
          <div className={s.cSteps}>
            <span className={s.label}>{empty ? "How it works" : "Listening is off for this session"}</span>
            <ol className={s.steps}>
              <li>{empty ? "Paste a SoundCloud track or playlist link." : "Press Enable listening. Chrome asks to share this tab."}</li>
              <li><span>Leave <q>Also share tab audio</q> on and click <q>Share</q>, once per session.</span></li>
              <li>Press Analyse on a track. About 60 s later its row fills in.</li>
            </ol>
            <p className={s.fine}>Six AM keeps the measurements only, never the audio.</p>
          </div>
        ) : picked ? (
          <>
            <div className={s.cHeadLine}>
              <b>{picked.title}</b>
              <span className={s.by}>{picked.uploader}</span>
              <span className={s.cLcd}>{bpmText(picked)}<span className={s.lcdUnit}>bpm</span></span>
              <strong>{keyText(picked)}</strong>
              <span className={s.fine}>{picked.analysedSeconds} s analysed · never the audio</span>
              <span className={s.cActions}>
                <button className={s.small} onClick={() => a.copy(picked)}>Copy for Claude</button>
                <button className={s.small} onClick={() => a.setBpm(picked)} title={`Studio is at ${STUDIO_BPM} BPM`}>Set Studio to {Math.round(picked.bpm!)} BPM</button>
              </span>
            </div>
            <div className={s.cFacts}>
              {picked.styles!.map((x) => (
                <div key={x.name} className={s.prob}><b>{x.name}</b><span className={s.probTrack}><i style={{ width: `${x.p}%` }} /></span><span>{x.p}%</span></div>
              ))}
              <div className={s.cFact}><span className={s.label}>Energy · {energyLabel(picked.energy)}</span><Energy value={picked.energy} /></div>
              <div className={s.cFact}><span className={s.label}>Brightness</span><span>{brightLabel(picked.brightness)}</span></div>
              <div className={s.cFact}><span className={s.label}>Uploader tag</span><span title={picked.tags.join(", ")}>{picked.uploaderTag ?? "none"}{picked.tags.length > 1 ? <span className={s.by}> · {picked.tags.filter((x) => x !== picked.uploaderTag).join(", ")}</span> : null}</span></div>
            </div>
          </>
        ) : null}
      </section>
      {a.note ? <div className={s.note} role="status">{a.note}</div> : null}
    </div>
  );
}
