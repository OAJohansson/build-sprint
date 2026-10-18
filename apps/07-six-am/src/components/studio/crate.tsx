"use client";

// The crate along the bottom: a turntable that spins whatever you preview, group tabs and a
// three-column list. Click a loop to preview it; drag it onto its track to use it.
import { LOOPS, TRACKS, loopById } from "@/lib/timeline";
import type { Timeline } from "./use-timeline";
import { MiniWave, cx } from "./timeline";
import s from "./studio.module.css";

export function Crate({ t, colors }: { t: Timeline; colors: string[] }) {
  const deck = t.preview ? loopById(t.preview) : null;
  return (
    <aside className={s.crate}>
      <div className={s.deck}>
        <div className={s.platter}>
          <div className={cx(s.record, deck && s.spinning)}>
            <div className={s.label} style={{ background: deck ? colors[deck.track] : "#3b2a1f" }}>
              <span>{deck ? deck.name : "Nothing on"}</span>
            </div>
          </div>
          <i className={cx(s.arm, deck && s.armDown)} />
        </div>
        <div className={s.deckText}>
          <b>{deck ? deck.name : "—"}</b>
          <em>{deck ? `${deck.bars} bars · ${deck.vibe}` : "Click a loop to hear it"}</em>
        </div>
      </div>
      <div className={s.browse}>
        <div className={s.tabs}>
          {TRACKS.map((g, i) => (
            <button key={g} className={cx(s.tab, t.group === i && s.tabOn)} onClick={() => t.setGroup(i)}>{g}</button>
          ))}
        </div>
        <div className={s.list}>
          {LOOPS.filter((l) => l.track === t.group).map((l) => (
            <div key={l.id} className={cx(s.item, t.preview === l.id && s.itemOn)} {...t.crateItem(l)}>
              <div className={s.meta}>
                <b>{l.name}</b>
                <em>{l.vibe}</em>
              </div>
              <div className={s.right} style={{ color: colors[l.track] }}>
                <MiniWave loopId={l.id} className={s.mini} />
                <em>{l.bars} bars</em>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
