"use client";

// A · Inspector. Axis: where the selected track's detail lives = a fixed deck on the right.
// Medium density (56 px rows, two lines each); Enable listening is a popover under its button.
import { useState } from "react";
import { PLAYLIST, ROWS, SELECTED, STUDIO_BPM, WINDOW, bpmText, brightLabel, energyLabel, keyText, tagMismatch } from "./sample";
import { AppBar, Embed, Energy, Icon, cx, useActions } from "./shared";
import type { VariantProps } from "./harness";
import s from "./analyse.module.css";

export function Inspector({ state, seconds }: VariantProps) {
  const empty = state === "empty";
  const listening = state === "main";
  const rows = empty ? [] : ROWS.map((r) => (r.status === "analysing" && !listening ? { ...r, status: "ready" as const } : r));
  const [sel, setSel] = useState(SELECTED);
  const [pop, setPop] = useState(state === "listen");
  const a = useActions();
  const picked = rows.find((r) => r.id === sel && r.styles);
  const current = rows.find((r) => r.id === "10");
  const done = rows.filter((r) => r.styles).length;

  return (
    <div className={s.root}>
      <AppBar />
      <div className={s.aBar}>
        <div className={s.aSource}>
          <input className={s.url} aria-label="SoundCloud link" placeholder="Paste a SoundCloud track or playlist link" defaultValue={empty ? "" : PLAYLIST.url} spellCheck={false} />
          {empty ? null : <button className={s.small}>{PLAYLIST.name} · {PLAYLIST.count}</button>}
        </div>
        <Embed url={current?.url} />
        <div className={s.aListen}>
          {listening ? (
            <>
              <span className={s.aStatus}><b className={s.listening}>Listening</b> to {current?.title.split(" (")[0]}</span>
              <div className={s.aProgress} role="progressbar" aria-valuemin={0} aria-valuemax={WINDOW} aria-valuenow={seconds}><i style={{ width: `${(seconds / WINDOW) * 100}%` }} /></div>
              <span className={s.lcd}>{seconds}<span className={s.lcdUnit}>/ {WINDOW} s</span></span>
              <button className={cx(s.pill, s.ghost)}>Cancel</button>
            </>
          ) : (
            <>
              <span className={s.aStatus}>Listening off</span>
              <button className={s.pill} onClick={() => setPop((v) => !v)} aria-expanded={pop}>Enable listening</button>
              <button className={cx(s.pill, s.gold)} disabled>Analyse</button>
            </>
          )}
          {pop && !listening ? (
            <div className={s.aPop} role="dialog" aria-label="Enable listening">
              <b>Let Six AM hear this tab</b>
              <ol className={s.steps}>
                <li>Chrome asks to share this tab.</li>
                <li><span>Leave <q>Also share tab audio</q> switched on.</span></li>
                <li><span>Click <q>Share</q>. Do it once per session.</span></li>
              </ol>
              <p className={s.fine}>Six AM keeps only the measurements. The audio is never recorded or saved.</p>
              <button className={cx(s.pill, s.gold)} onClick={() => setPop(false)}>Open the Chrome dialog</button>
            </div>
          ) : null}
        </div>
      </div>

      <main className={cx(s.aMain, empty && s.aMainEmpty)}>
        <section className={s.aTable} aria-label="Analysed tracks">
          <div className={cx(s.aCols, s.aHead)}>
            <span className={s.th}>#</span><span className={s.th}>Track</span><span className={s.th}>Styles</span>
            <span className={s.th}>BPM</span><span className={s.th}>Key</span><span className={s.th}>Energy</span><span className={s.th}>Uploader tag</span>
          </div>
          {empty ? (
            <div className={s.aEmpty}>
              <b>Nothing analysed yet</b>
              <p>Paste a SoundCloud track or playlist link above, enable listening, then press Analyse. Each track you analyse gets a row here and stays after a reload.</p>
            </div>
          ) : (
            <div className={s.aBody}>
              {rows.map((r, i) => (
                <div key={r.id} className={cx(s.aCols, s.aRow, r.id === sel && s.aSel, r.id === "10" && s.aCur)} onClick={() => r.styles && setSel(r.id)}>
                  <span className={cx(s.th, s.num)}>{i + 1}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    <span className={s.title}>{r.title}</span>
                    <span className={s.byRow}><span className={s.by}>{r.uploader}</span>{r.status === "preview" ? <span className={s.tagPreview}>preview only (30 s)</span> : null}</span>
                  </span>
                  {r.styles ? (
                    <span className={s.aStyles}>
                      <span>{r.styles[0].name} {r.styles[0].p}%</span>
                      <span>{r.styles[1].name} {r.styles[1].p}%</span>
                    </span>
                  ) : (
                    <span className={cx(s.aStyles, r.status === "analysing" ? s.listening : s.dim)}>{r.status === "analysing" ? `Listening… ${seconds} s` : "Not analysed"}</span>
                  )}
                  <span className={s.aBpm}>{bpmText(r) || <span className={s.dim}>–</span>}{r.halfDouble ? <div className={s.flag}>×2 = 145?</div> : null}</span>
                  <span style={{ fontSize: 13 }}>{keyText(r) || <span className={s.dim}>–</span>}</span>
                  <Energy value={r.energy} />
                  <span className={s.by}>{r.uploaderTag ?? <span className={s.dim}>none</span>}{tagMismatch(r) ? <span className={s.mismatch} title="Not in the top 3 styles">≠</span> : null}</span>
                </div>
              ))}
            </div>
          )}
          {empty ? null : (
            <div className={s.aFoot}>
              <span>{done} analysed{listening ? " · 1 listening" : ""} · stored on this laptop, never the audio</span>
              <button className={s.small}>Export CSV</button>
              <button className={s.small}>Export JSON</button>
            </div>
          )}
        </section>

        {empty || !picked ? null : (
          <aside className={s.aInspect} aria-label="Selected track">
            <div className={s.aDeckTitle}>
              <b>{picked.title}</b>
              <em>{picked.uploader} · {picked.analysedSeconds} s analysed{picked.status === "preview" ? " · preview only" : ""}</em>
            </div>
            <div className={s.aSection}>
              <span className={s.label}>Styles it sounds like</span>
              {picked.styles!.map((x) => (
                <div key={x.name} className={s.prob}><b>{x.name}</b><span className={s.probTrack}><i style={{ width: `${x.p}%` }} /></span><span>{x.p}%</span></div>
              ))}
            </div>
            <div className={s.aFacts}>
              <div className={s.aFact}><span className={s.label}>BPM</span><span className={s.aBig}>{bpmText(picked)}</span></div>
              <div className={s.aFact}><span className={s.label}>Key</span><strong>{keyText(picked)}</strong></div>
              <div className={s.aFact}><span className={s.label}>Energy · {energyLabel(picked.energy)}</span><Energy value={picked.energy} wide /></div>
              <div className={s.aFact}><span className={s.label}>Brightness</span><strong>{brightLabel(picked.brightness)}</strong></div>
            </div>
            <p className={s.aCompare}>
              Uploader tag <b>{picked.uploaderTag ?? "none"}</b>{picked.tags.length ? <> · tags {picked.tags.join(", ")}</> : null}
            </p>
            <div className={s.aActions}>
              <button className={cx(s.pill, s.gold)} onClick={() => a.copy(picked)}>{Icon.copy} Copy for Claude</button>
              <button className={s.pill} onClick={() => a.setBpm(picked)}>{Icon.tempo} Set Studio to {Math.round(picked.bpm!)} BPM</button>
              <small>Studio is at {STUDIO_BPM} BPM</small>
            </div>
          </aside>
        )}
      </main>
      {a.note ? <div className={s.note} role="status">{a.note}</div> : null}
    </div>
  );
}
