"use client";

// C · Deck. Axis: density. A tight rekordbox table that also lists the playlist's tracks not yet
// analysed, over a fixed deck along the bottom (the Studio's crate position) for the selected
// track. The Listen button itself fills as the window runs.
import { useState } from "react";
import { BLOCKED, PLAYLIST, ROWS, SELECTED, STUDIO_BPM, WINDOW, bpmText, brightLabel, energyLabel, keyText, tagMismatch } from "./sample";
import { AppBar, Embed, Energy, Icon, cx, useActions } from "./shared";
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
          <button className={cx(s.cListen, !empty && s.cListenOff)} disabled={empty} style={empty ? { opacity: 0.4, cursor: "default" } : undefined}>
            <span>Enable listening</span><span className={cx(s.lcd, s.by)} style={{ marginLeft: "auto" }}>off</span>
          </button>
        )}
      </div>

      <main className={s.cTable}>
        <div className={cx(s.cCols, s.cHead)}>
          <span className={s.th}>#</span><span className={s.th}>Track</span><span className={s.th}>Top 2 styles</span>
          <span className={s.th}>BPM</span><span className={s.th}>Key</span><span className={s.th}>Energy</span><span className={s.th}>Bright</span>
          <span className={s.th}>Time</span><span className={s.th}>Uploader tag</span><span className={s.th}>Heard</span>
        </div>
        {empty ? (
          <div className={s.cEmptyBody}><b>No tracks yet</b>Paste a SoundCloud link above. A playlist lists all its tracks here; analysed ones fill in their columns.</div>
        ) : (
          <>
            {rows.map((r, i) => (
              <div key={r.id} className={cx(s.cCols, s.cRow, r.id === sel && s.cSel, r.id === "10" && s.cCur)} onClick={() => r.styles && setSel(r.id)}>
                <span className={cx(s.th, s.num)}>{i + 1}</span>
                <span><b>{r.title}</b> <span className={s.by}>· {r.uploader}</span></span>
                {r.styles ? (
                  <span>{r.styles[0].name} {r.styles[0].p}% <span className={s.by}>· {r.styles[1].name} {r.styles[1].p}%</span></span>
                ) : (
                  r.status === "ready" ? (
                  <span><button className={s.small} disabled={!listening} title={listening ? undefined : "Enable listening first"}>Analyse</button></span>
                ) : (
                  <span className={r.status === "analysing" ? s.listening : s.dim}>{r.status === "analysing" ? "Listening…" : "Not available in your region"}</span>
                )
                )}
                <span className={s.cBpm}>{bpmText(r) || <span className={s.dim}>–</span>}{r.halfDouble ? <span className={s.flag}> ½?</span> : null}</span>
                <span>{keyText(r) || <span className={s.dim}>–</span>}</span>
                <Energy value={r.energy} />
                <span className={r.brightness == null ? s.dim : undefined}>{r.brightness == null ? "–" : brightLabel(r.brightness)}</span>
                <span className={cx(s.num, s.by)}>{r.length || "–"}</span>
                <span className={s.by}>{r.uploaderTag ?? <span className={s.dim}>none</span>}{tagMismatch(r) ? <span className={s.mismatch} title="Not in the top 3 styles">≠</span> : null}</span>
                <span>{r.status === "preview" ? <span className={s.tagPreview}>30 s preview</span> : r.analysedSeconds ? <span className={s.by}>{r.analysedSeconds} s</span> : <span className={s.dim}>–</span>}</span>
              </div>
            ))}
            <div className={s.cMore}>45 more tracks in {PLAYLIST.name}, not analysed yet<button className={s.small}>Show all</button></div>
          </>
        )}
      </main>

      <section className={s.cDeck} aria-label={showSteps ? "Enable listening" : "Selected track"}>
        {showSteps ? (
          <div className={s.cDeckEmpty}>
            <div>
              <span className={s.label}>{empty ? "Start here" : "Listening is off for this session"}</span>
              <b>{empty ? "Load a track, then let Six AM hear it" : "Let Six AM hear this tab"}</b>
            </div>
            <div className={s.cDeckSteps}>
              <ol className={s.steps}>
                <li>{empty ? "Paste a SoundCloud track or playlist link." : "Press Enable listening. Chrome asks to share this tab."}</li>
                <li><span>Leave <q>Also share tab audio</q> on and click <q>Share</q>, once per session.</span></li>
                <li>Press Analyse on a track. About 60 s later its row fills in.</li>
              </ol>
              <p className={s.fine}>Six AM keeps the measurements only. The audio is never recorded or saved.</p>
            </div>
          </div>
        ) : picked ? (
          <>
            <div className={s.cDeckId}>
              <b>{picked.title}</b>
              <em>{picked.uploader} · {picked.analysedSeconds} s analysed</em>
              <div className={s.cDeckNums}>
                <span><span className={s.aBig}>{bpmText(picked)}</span><span className={s.lcdUnit}>bpm</span></span>
                <strong>{keyText(picked)}</strong>
              </div>
            </div>
            <div className={s.cDeckMid}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span className={s.label}>Styles it sounds like</span>
                {picked.styles!.map((x) => (
                  <div key={x.name} className={s.prob}><b>{x.name}</b><span className={s.probTrack}><i style={{ width: `${x.p}%` }} /></span><span>{x.p}%</span></div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span className={s.label}>Energy · {energyLabel(picked.energy)}</span><Energy value={picked.energy} wide /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><span className={s.label}>Brightness</span><span style={{ fontSize: 14 }}>{brightLabel(picked.brightness)}</span></div>
                <p className={s.aCompare}>Uploader tag <b>{picked.uploaderTag ?? "none"}</b>{picked.tags.length ? <><br />{picked.tags.join(", ")}</> : null}</p>
              </div>
            </div>
            <div className={s.cDeckSide}>
              <button className={cx(s.pill, s.gold)} onClick={() => a.copy(picked)}>{Icon.copy} Copy for Claude</button>
              <button className={s.pill} onClick={() => a.setBpm(picked)}>{Icon.tempo} Set Studio to {Math.round(picked.bpm!)} BPM</button>
              <span className={s.fine} style={{ textAlign: "center" }}>Studio is at {STUDIO_BPM} BPM</span>
            </div>
          </>
        ) : null}
      </section>
      {a.note ? <div className={s.note} role="status">{a.note}</div> : null}
    </div>
  );
}
