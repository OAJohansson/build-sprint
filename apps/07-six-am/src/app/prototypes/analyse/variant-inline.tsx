"use client";

// B · Inline. Axis: one full-width column; the selected row opens in place with everything about
// that track. Listening progress is the player bar's own bottom edge; Enable listening is a band
// at the top of the list.
import { Fragment, useState } from "react";
import { PLAYLIST, ROWS, SELECTED, STUDIO_BPM, WINDOW, bpmText, brightLabel, energyLabel, keyText, tagMismatch } from "./sample";
import { AppBar, Embed, Energy, Icon, cx, useActions } from "./shared";
import type { VariantProps } from "./harness";
import s from "./analyse.module.css";

export function Inline({ state, seconds }: VariantProps) {
  const empty = state === "empty";
  const listening = state === "main";
  const rows = empty ? [] : ROWS.map((r) => (r.status === "analysing" && !listening ? { ...r, status: "ready" as const } : r));
  const [open, setOpen] = useState<string | null>(SELECTED);
  const a = useActions();
  const current = rows.find((r) => r.id === "10");
  const done = rows.filter((r) => r.styles).length;

  return (
    <div className={s.root}>
      <AppBar right={empty ? null : <><span className={s.by}>{done} analysed</span><button className={s.small}>Export CSV</button><button className={s.small}>JSON</button></>} />
      <div className={s.bBar}>
        <input className={s.url} aria-label="SoundCloud link" placeholder="Paste a SoundCloud track or playlist link" defaultValue={empty ? "" : PLAYLIST.url} spellCheck={false} />
        <Embed url={current?.url} />
        {listening ? (
          <div className={s.bNow}>
            <span className={s.bLcd}>{seconds}<span className={s.lcdUnit}>/ {WINDOW} s</span></span>
            <button className={cx(s.pill, s.ghost)}>Cancel</button>
          </div>
        ) : (
          <div className={s.bOff}>
            <span>Listening off</span>
            <button className={cx(s.pill, s.gold)} disabled={empty}>Enable listening</button>
          </div>
        )}
        {listening ? <i className={s.bLine} style={{ width: `${(seconds / WINDOW) * 100}%` }} role="progressbar" aria-label="Listening" aria-valuemin={0} aria-valuemax={WINDOW} aria-valuenow={seconds} /> : null}
      </div>

      <main className={s.bMain}>
        <div className={cx(s.bCols, s.bHead)}>
          <span className={s.th}>#</span><span className={s.th}>Track</span><span className={s.th}>Top 2 styles</span>
          <span className={s.th}>BPM</span><span className={s.th}>Key</span><span className={s.th}>Energy</span><span className={s.th}>Uploader tag</span>
        </div>

        {state === "listen" ? (
          <div className={s.bBand} role="region" aria-label="Enable listening">
            <ol className={s.steps}>
              <li>Press Enable listening. Chrome asks to share this tab.</li>
              <li><span>Leave <q>Also share tab audio</q> switched on, then click <q>Share</q>.</span></li>
              <li>Once per session. Six AM keeps the measurements, never the audio.</li>
            </ol>
          </div>
        ) : null}

        {empty ? (
          <div className={s.bEmpty}>
            <b>Nothing analysed yet</b>
            <p>Paste a SoundCloud track or playlist link above. Then enable listening and press Analyse on a track: its styles, BPM, key and energy land in a row here and stay after a reload.</p>
          </div>
        ) : [...rows].reverse().map((r) => {
          const i = rows.indexOf(r);
          const isOpen = open === r.id && !!r.styles;
          const row = (
            <div className={cx(s.bCols, s.bRow, r.id === "10" && s.bCur)} onClick={() => r.styles && setOpen(isOpen ? null : r.id)} aria-expanded={r.styles ? isOpen : undefined}>
              <span className={cx(s.th, s.num)}>{i + 1}</span>
              <span className={s.bTrack}>
                <span className={s.title}>{r.title}</span>
                <span className={s.by}>{r.uploader}</span>
              </span>
              {r.styles ? (
                <span className={s.bStyles}>{r.styles[0].name} {r.styles[0].p}% <span>· {r.styles[1].name} {r.styles[1].p}%</span></span>
              ) : (
                r.status === "ready" ? (
                <span><button className={s.small} disabled={!listening} title={listening ? undefined : "Enable listening first"}>Analyse</button></span>
              ) : (
                <span className={cx(s.bStyles, s.listening)}>Listening…</span>
              )
              )}
              <span className={s.bBpm}>{bpmText(r) || <span className={s.dim}>–</span>}{r.halfDouble ? <span className={s.flag}> ×2?</span> : null}</span>
              <span style={{ fontSize: 13 }}>{keyText(r) || <span className={s.dim}>–</span>}</span>
              <Energy value={r.energy} />
              <span className={s.by}>
                {r.status === "preview" ? <span className={s.tagPreview}>preview only (30 s)</span> : <>{r.uploaderTag ?? <span className={s.dim}>none</span>}{tagMismatch(r) ? <span className={s.mismatch} title="Not in the top 3 styles">≠</span> : null}</>}
              </span>
            </div>
          );
          if (!isOpen) return <Fragment key={r.id}>{row}</Fragment>;
          return (
            <div key={r.id} className={s.bOpen}>
              {row}
              <div className={s.bDetail}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span className={s.label}>Styles it sounds like · {r.analysedSeconds} s analysed</span>
                  {r.styles!.map((x) => (
                    <div key={x.name} className={s.prob}><b>{x.name}</b><span className={s.probTrack}><i style={{ width: `${x.p}%` }} /></span><span>{x.p}%</span></div>
                  ))}
                </div>
                <div className={s.bFacts}>
                  <span>BPM</span><b className={s.lcd}>{bpmText(r)}</b>
                  <span>Key</span><b style={{ fontWeight: 500 }}>{keyText(r)}</b>
                  <span>Energy</span><span style={{ color: "var(--ink)" }}><Energy value={r.energy} /> {energyLabel(r.energy)}</span>
                  <span>Brightness</span><span style={{ color: "var(--ink)" }}>{brightLabel(r.brightness)}</span>
                </div>
                <div className={s.bSide}>
                  <p className={s.aCompare}>Uploader tag <b>{r.uploaderTag ?? "none"}</b>{r.tags.length ? <> · tags {r.tags.join(", ")}</> : null}</p>
                  <div className={s.bButtons}>
                    <button className={cx(s.pill, s.gold)} onClick={() => a.copy(r)}>{Icon.copy} Copy for Claude</button>
                    <button className={s.pill} onClick={() => a.setBpm(r)}>{Icon.tempo} Set Studio to {Math.round(r.bpm!)} BPM</button>
                  </div>
                  <span className={s.fine}>Studio is at {STUDIO_BPM} BPM</span>
                </div>
              </div>
            </div>
          );
        })}
      </main>
      {a.note ? <div className={s.note} role="status">{a.note}</div> : null}
    </div>
  );
}
