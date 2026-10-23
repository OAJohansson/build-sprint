"use client";

// C · Deck. Axis: density. A tight rekordbox table that also lists the playlist's tracks not yet
// analysed, over a fixed deck along the bottom (the Studio's crate position) for the selected
// track. The Listen button itself fills as the window runs.
import { useState } from "react";
import { type Row, BLOCKED, SNIPPETS, SNIPPET_S, KEY_STRENGTH, MORE_STYLES, PLAYLIST, ROWS, SELECTED, STUDIO_BPM, bpmText, brightLabel, camelot, keyCell, runnerUp, snippets, tagMismatch } from "./sample";
import { AppBar, Embed, Energy, cx, useActions } from "./shared";
import type { VariantProps } from "./harness";
import s from "./analyse.module.css";

export function Deck({ state, seconds }: VariantProps) {
  const empty = state === "empty";
  const listening = state === "main";
  // Owner, round 5: a queue (one track after another). In the listening sample, Kolter waits in it.
  const rows: (Row & { queued?: number })[] = empty ? [] : [
    ...ROWS.map((r) => (r.status === "analysing" && !listening ? { ...r, status: "ready" as const } : r))
      .map((r) => (listening && r.id === "3" ? { ...r, status: "ready" as const, styles: undefined, bpm: undefined, key: undefined, energy: undefined, brightness: undefined, analysedSeconds: undefined, queued: 1 } : r)),
    BLOCKED,
  ];
  const queuedCount = rows.filter((r) => r.queued).length;
  const heard = seconds; // of 4 × 30 s
  const snippet = Math.min(SNIPPETS, Math.floor(heard / SNIPPET_S) + 1);
  const [sel, setSel] = useState(SELECTED);
  const a = useActions();
  const picked = rows.find((r) => r.id === sel && r.styles);
  const current = rows.find((r) => r.id === "10");
  const done = rows.filter((r) => r.styles).length;
  const [menu, setMenu] = useState(false);

  return (
    <div className={cx(s.root, s.cRoot, (empty || !picked) && s.cNoDeck)}>
      <AppBar
        right={empty ? null : (
          <span className={s.cExport}>
            <button className={s.small} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>Export ▾</button>
            {menu ? (
              <span className={s.cMenu} role="menu">
                <button role="menuitem" onClick={() => setMenu(false)}>CSV</button>
                <button role="menuitem" onClick={() => setMenu(false)}>JSON</button>
              </span>
            ) : null}
          </span>
        )}
      />
      <div className={s.cBar}>
        <input className={s.url} aria-label="SoundCloud link" placeholder="Paste a SoundCloud track or playlist link" defaultValue={empty ? "" : PLAYLIST.url} spellCheck={false} />
        <Embed url={current?.url} />
        {listening ? (
          <span className={s.cListenWrap}>
            <span className={s.cProg} role="progressbar" aria-label={`Listening, snippet ${snippet} of ${SNIPPETS}`} aria-valuemin={0} aria-valuemax={SNIPPETS * SNIPPET_S} aria-valuenow={heard}>
              <span className={s.cProgText}><span>Listening {snippet}/{SNIPPETS}</span><span className={s.lcd}>{heard} s</span></span>
              <span className={s.cProgBar}><i style={{ width: `${(heard / (SNIPPETS * SNIPPET_S)) * 100}%` }} /></span>
            </span>
            {queuedCount ? <span className={s.by}>{queuedCount} queued</span> : null}
            <button className={s.cTextBtn}>Cancel</button>
          </span>
        ) : (
          <button className={cx(s.small, s.cEnable)}>Enable listening</button>
        )}
      </div>

      <main className={s.cTable}>
        {empty ? (
          <ol className={cx(s.steps, s.cBodySteps)}>
            <li>Paste a SoundCloud track or playlist link above. A playlist lists all its tracks here.</li>
            <li><span>Press Enable listening. In Chrome&apos;s dialog leave <q>Also share tab audio</q> on and click <q>Share</q>, once per session.</span></li>
            <li>Press Analyse on a track. Six AM listens to 4 snippets of 30 s; about 2 minutes later its row fills in. It keeps the measurements only, never the audio.</li>
          </ol>
        ) : (
          <>
            <div className={cx(s.cCols, s.cHead)}>
              <span className={s.th}>#</span><span className={s.th}>Track</span><span className={s.th}>Top 2 styles</span>
              <span className={s.th}>BPM</span><span className={s.th}>Key</span><span className={s.th}>Energy</span><span className={s.th}>Tone</span>
              <span className={s.th}>Time</span><span className={s.th}>Uploader tag</span>
            </div>
            {listening ? null : (
              <div className={s.cOff}>
                <span><b>Listening is off for this session.</b> Press Enable listening, leave <q>Also share tab audio</q> on and click <q>Share</q>. Six AM keeps the measurements only, never the audio.</span>
              </div>
            )}
            {rows.map((r, i) => (
              <div
                key={r.id}
                tabIndex={0}
                className={cx(s.cCols, s.cRow, r.id === sel && s.cSel)}
                aria-selected={r.id === sel}
                onClick={() => r.styles && setSel(r.id)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && r.styles) { e.preventDefault(); setSel(r.id); } }}
              >
                <span className={cx(s.th, s.num)}>{i + 1}</span>
                <span className={s.cTrack}><b>{r.title}</b><span className={s.by}>· {r.uploader}</span></span>
                {r.styles ? (
                  <span className={s.cStyles}>
                    <span>{r.styles[0].name}</span><span className={s.cPct}>{r.styles[0].p}%</span>
                    <span className={s.by}>{r.styles[1].name}</span><span className={s.cPct}>{r.styles[1].p}%</span>
                    {r.status === "preview" ? <span className={s.dim} title={`SoundCloud plays only a 30 s preview of this ${r.length} track, so one snippet was analysed`}>preview</span> : null}
                  </span>
                ) : r.queued ? (
                  <span className={s.dim}>Queued · {r.queued}</span>
                ) : r.status === "ready" ? (
                  <span><button className={cx(s.cTextBtn, s.cAnalyse)} title={listening ? "Listen to 4 snippets of 30 s" : "Enable listening first"} onClick={(e) => e.stopPropagation()}>Analyse</button></span>
                ) : (
                  <span className={r.status === "analysing" ? s.cListeningText : s.dim}>{r.status === "analysing" ? "Listening…" : "Not available in your region"}</span>
                )}
                <span className={s.cBpm}>{bpmText(r) || <span className={s.dim}>–</span>}{r.halfDouble ? <span className={s.cDoubt} title="Could be 145 BPM (half-time)"> ×2?</span> : null}</span>
                <span>{keyCell(r) || <span className={s.dim}>–</span>}</span>
                <Energy value={r.energy} />
                <span className={r.brightness == null ? s.dim : undefined}>{r.brightness == null ? "–" : brightLabel(r.brightness)}</span>
                <span className={cx(s.num, s.by)}>{r.length || "–"}</span>
                <span className={s.by}>{r.uploaderTag ?? <span className={s.dim}>none</span>}{tagMismatch(r) ? <span className={s.cDoubt} title="The uploader's tag isn't in the top 3 styles Six AM heard"> · differs</span> : null}</span>
              </div>
            ))}
            <div className={s.cMore}>{done} of {PLAYLIST.count} analysed · {PLAYLIST.count - done} not analysed<button className={s.small}>Show</button></div>
          </>
        )}
      </main>

      {empty || !picked ? null : (
        <section className={s.cDeck} aria-label="Selected track">
          <div className={s.cHeadLine}>
            <b>{picked.title}</b>
            <span className={s.by}>{picked.uploader}</span>
            <span className={s.cLcd}>{bpmText(picked)}<span className={s.lcdUnit}>bpm</span></span>
            <span className={s.cActions}>
              <button className={s.small} onClick={() => a.copy(picked)}>Copy for Claude</button>
              <button className={s.small} onClick={() => a.setBpm(picked)} title={`Studio is at ${STUDIO_BPM} BPM`}>Set Studio to {Math.round(picked.bpm!)} BPM</button>
            </span>
          </div>
          <div className={s.cFacts}>
            <div className={s.cBars} aria-label="Every style above 5 %">
              {[picked.styles![0], ...(MORE_STYLES[picked.id] ?? picked.styles!.slice(1))].map((x) => (
                <div key={x.name} className={s.prob}><b>{x.name}</b><span className={s.probTrack}><i style={{ width: `${x.p}%` }} /></span><span>{x.p}%</span></div>
              ))}
            </div>
            <dl className={s.cDl}>
              <dt>BPM</dt>
              <dd>{picked.halfDouble ? <>{bpmText(picked)} or {(picked.bpm! * 2).toFixed(1)} <span className={s.cDoubt}>· half-time ambiguous</span></> : <>{bpmText(picked)} <span className={s.by}>· steady</span></>}</dd>
              <dt>Key</dt>
              <dd>{keyCell(picked)} <span className={s.by} title="How sure the key detector is, 0 to 1">({(KEY_STRENGTH[picked.id] ?? 0.6).toFixed(2)})</span></dd>
              <dt>Runner-up</dt>
              <dd>{(() => { const k = runnerUp(picked); return k ? <>{camelot(k.key, k.scale)} · {k.key} {k.scale}</> : <span className={s.dim}>–</span>; })()}</dd>
            </dl>
            <div className={s.cSnipBlock}>
            <span className={s.label}>Snippets · 4 × 30 s</span>
            <div className={s.cSnips} aria-label="Four snippets across the track">
              {snippets(picked).map((x) => (
                <div key={x.at} className={s.cSnip}>
                  <span className={s.label}>{x.at}</span>
                  {x.style ? <><span className={s.cSnipStyle}>{x.style.name}</span><span className={s.cSnipBpm}>{x.style.p}% · {x.bpm?.toFixed(1)}</span></> : <span className={s.dim}>not in preview</span>}
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>
      )}
      {a.note ? <div className={s.note} role="status">{a.note}</div> : null}
    </div>
  );
}
