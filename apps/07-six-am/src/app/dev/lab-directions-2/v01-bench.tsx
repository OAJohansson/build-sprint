"use client";
// 1 Bench (seed 1): everything visible. The map on the left; one side panel on the right with the
// Mentor on top and the workbench for your sound below it, save at the foot.
import { AB, Deck, Lanes, Macros, MatchRow, Mentor, PresetHead, SaveRow, Shell, Suggest, TrackHead, Transport, s } from "./shared";
import v from "./v.module.css";

export function V01Bench() {
  return (
    <Shell>
      <TrackHead><Deck /></TrackHead>
      <div className={v.b1}>
        <div className={v.b1map}>
          <div className={v.bar}><Transport /></div>
          <Lanes laneH={124} />
        </div>
        <aside className={v.b1side}>
          <Mentor short />
          <hr className={v.hr} />
          <span className={s.who}>Make · a bass like this</span>
          <PresetHead />
          <AB />
          <Macros size={42} tight />
          <Suggest />
          <MatchRow />
          <div className={v.foot}><SaveRow stacked /></div>
        </aside>
      </div>
    </Shell>
  );
}
