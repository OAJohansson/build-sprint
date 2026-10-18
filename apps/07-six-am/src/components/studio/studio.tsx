"use client";

// The main screen (design session, 18 Oct): a dark warehouse with Chicago house and disco
// colour. Control bar on top, the timeline in the middle, the crate along the bottom.
import { useTimeline } from "./use-timeline";
import { TimelineView, cx } from "./timeline";
import { Crate } from "./crate";
import { Logo } from "./logo";
import s from "./studio.module.css";

const COLORS = ["#f2b134", "#ef5b37", "#23b3a5", "#a9c95a"]; // drums, bass, chords, top/FX

const Icon = {
  start: <svg viewBox="0 0 16 16" aria-hidden><path d="M3 2h2v12H3zM14 2v12L6 8z" fill="currentColor" /></svg>,
  play: <svg viewBox="0 0 16 16" aria-hidden><path d="M4 2l10 6-10 6z" fill="currentColor" /></svg>,
  pause: <svg viewBox="0 0 16 16" aria-hidden><path d="M3 2h4v12H3zM9 2h4v12H9z" fill="currentColor" /></svg>,
  undo: <svg viewBox="0 0 16 16" aria-hidden><path d="M6 3 2 7l4 4V8h4a3 3 0 0 1 0 6H8v2h2a5 5 0 0 0 0-10H6z" fill="currentColor" /></svg>,
};

export function Studio() {
  const t = useTimeline();
  return (
    <div className={s.root}>
      <header className={s.bar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <div className={s.transport}>
          <button className={s.tb} onClick={() => t.setPlayhead(1)} aria-label="Back to start">{Icon.start}</button>
          <button className={cx(s.tb, s.play)} onClick={() => t.setPlaying(!t.playing)} aria-label={t.playing ? "Pause" : "Play"}>{t.playing ? Icon.pause : Icon.play}</button>
          <div className={s.lcd}><b>{t.bar}.{t.beat}</b><small>bar</small><b>124</b><small>bpm</small></div>
          <button className={s.undo} onClick={t.undo} disabled={!t.canUndo}>{Icon.undo} Undo</button>
          <div className={s.knobWrap}>
            Filter
            <div className={s.knob} {...t.knob} role="slider" aria-label="Filter" aria-valuenow={Math.round(t.filter * 100)} style={{ ["--a" as string]: `${-135 + t.filter * 270}deg` }} />
          </div>
        </div>
      </header>
      <main className={s.main}>
        <TimelineView t={t} colors={COLORS} />
      </main>
      <Crate t={t} colors={COLORS} />
    </div>
  );
}
