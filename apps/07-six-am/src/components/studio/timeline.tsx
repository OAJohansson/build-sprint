"use client";
/* eslint-disable react-hooks/refs -- the handler factories from useTimeline read refs only inside events */

// The timeline: ruler, four lanes of loop blocks and the playhead. While a loop is dragged from
// the crate, its own track lights up, the drop spot shows in the track's colour and the ruler
// marks the bar it will land on.
import { memo } from "react";
import { BARS, TRACKS, loopById, wavePath, type Kind } from "@/lib/timeline";
import type { Timeline } from "./use-timeline";
import s from "./studio.module.css";

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

export const Wave = memo(function Wave({ kind, loopBars, bars, seed = 1, className }: {
  kind: Kind; loopBars: number; bars: number; seed?: number; className?: string;
}) {
  return (
    <svg className={className} viewBox={`0 0 ${bars * 16} 100`} preserveAspectRatio="none" aria-hidden>
      <path d={wavePath(kind, loopBars, bars, seed)} stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
});

export function MiniWave({ loopId, className }: { loopId: string; className?: string }) {
  const l = loopById(loopId);
  return <Wave kind={l.kind} loopBars={l.bars} bars={l.bars} seed={3} className={className} />;
}

const RULER_EVERY = 8; // house is built in 8-bar phrases

export function TimelineView({ t, colors }: { t: Timeline; colors: string[] }) {
  const ppb = t.pxPerBar;
  const target = t.ghost?.loop.track ?? null;
  return (
    <div className={s.timeline}>
      <div className={s.corner} />
      <div className={s.ruler} {...t.ruler}>
        {Array.from({ length: BARS }, (_, b) => (
          <span key={b} className={cx(s.tick, b % 4 === 0 && s.tickBig)} style={{ left: b * ppb }}>
            {b % RULER_EVERY === 0 ? <em className={s.tickNum}>{b + 1}</em> : null}
          </span>
        ))}
        {t.ghost && t.ghost.bar !== null ? (
          <span className={s.rulerMark} style={{ left: (t.ghost.bar - 1) * ppb, ["--c" as string]: colors[t.ghost.loop.track] }}>{t.ghost.bar}</span>
        ) : null}
      </div>
      {TRACKS.map((name, tr) => (
        <div key={tr} className={s.row} style={{ gridRow: tr + 2, ["--c" as string]: colors[tr] }}>
          <div className={s.header}>
            <div className={s.trackName}>{name}</div>
            <button
              className={cx(s.mute, t.doc.muted[tr] && s.muteOn)}
              onClick={() => t.toggleMute(tr)}
              aria-pressed={t.doc.muted[tr]}
              aria-label={`Mute ${name}`}
            >M</button>
          </div>
        </div>
      ))}
      <div className={s.lanes} ref={t.lanesRef} style={{ gridRow: "2 / span 4" }} onPointerDown={() => t.setSelected(null)}>
        {TRACKS.map((_, tr) => (
          <div
            key={tr}
            data-track={tr}
            className={cx(s.lane, t.doc.muted[tr] && s.muted, target !== null && (target === tr ? s.laneTarget : s.laneDim))}
            style={{ backgroundSize: `${ppb * 4}px 100%`, ["--c" as string]: colors[tr] }}
          >
            {t.regions.filter((r) => r.track === tr).map((r, i) => {
              const l = loopById(r.loopId);
              const live = t.playhead >= r.start && t.playhead < r.start + r.length;
              return (
                <div
                  key={r.id}
                  className={cx(s.region, t.selected === r.id && s.selected, live && s.live, t.bin?.id === r.id && t.bin.over && s.removing)}
                  style={{ left: (r.start - 1) * ppb, width: r.length * ppb - 2 }}
                  {...t.blockBody(r)}
                >
                  <b className={s.regionName}>{l.name}</b>
                  <Wave kind={l.kind} loopBars={l.bars} bars={r.length} seed={tr * 7 + (i % 3)} className={s.wave} />
                  {Array.from({ length: r.length / l.bars - 1 }, (_, j) => (
                    <i key={j} className={s.rep} style={{ left: (j + 1) * l.bars * ppb }} />
                  ))}
                  <i className={s.grip} {...t.blockGrip(r)} />
                </div>
              );
            })}
            {t.ghost && t.ghost.bar !== null && target === tr ? (
              <div className={s.drop} style={{ left: (t.ghost.bar - 1) * ppb, width: t.ghost.loop.bars * ppb - 2 }}>
                <b className={s.dropName}>{t.ghost.loop.name}</b>
              </div>
            ) : null}
          </div>
        ))}
        <div className={s.playhead} style={{ transform: `translateX(${(t.playhead - 1) * ppb}px)` }} />
      </div>
    </div>
  );
}
