"use client";
// 7 Ear trainer (Syntorial): zoom into the looping section. The whole song shrinks to a strip; the
// bass and its sub-layers fill the top, a big level-matched A/B sits in the middle, knobs below.
// The Mentor gives hints in a narrow column.
import { MENTOR_SHORT } from "./data";
import { AB, Deck, Macros, MatchRow, PartChips, PresetHead, SaveRow, Shell, Strip, Suggest, TrackHead, Transport, Zoom, s } from "./shared";
import v from "./v.module.css";

export function V07Ear() {
  return (
    <Shell>
      <TrackHead small><Deck /></TrackHead>
      <div className={v.pad}><Strip /></div>
      <div className={v.e7}>
        <div className={v.e7main}>
          <div className={v.e7top}><Transport /><PartChips withSubs /></div>
          <Zoom height={150} />
          <div className={v.e7ab}><AB big /></div>
          <div className={v.e7make}><PresetHead /><Macros size={64} /><MatchRow /></div>
          <SaveRow />
        </div>
        <aside className={v.e7hint}>
          <span className={s.who}>Hint</span>
          <p className={s.mentor}>{MENTOR_SHORT}</p>
          <Suggest />
          <input className={s.ask} placeholder="Ask…" aria-label="Ask the Mentor" />
        </aside>
      </div>
    </Shell>
  );
}
